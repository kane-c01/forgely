/**
 * 手机号短信 OTP — 登录 / 绑定 / 重置密码三用途。
 *
 * 实现按 docs/PIVOT-CN.md §2：
 *   - 6 位数字 code，5 分钟内有效
 *   - SHA-256 哈希存库（明文从不入库）
 *   - 同一手机号 60s 内只能发一次（防刷），10 分钟内最多 5 次
 *   - 校验 5 次失败后该 OTP 作废
 *   - SMS 通道：阿里云 / 腾讯云 SMS（环境变量切换）
 *
 * dev mock 模式（没配 ALIYUN_SMS_ACCESS_KEY）：
 *   - code 固定 `123456`
 *   - 控制台打印 "验证码 123456" 方便调试
 *   - 仍然 hash 入库（保持 DB 写入一致性）
 *
 * @owner W1 — CN pivot (docs/PIVOT-CN.md) + W6 真接入
 */
import { createHash, randomInt } from 'node:crypto'
import { prisma } from '../db.js'
import { ForgelyError, errors } from '../errors.js'

export type OtpPurpose = 'login' | 'bind' | 'verify' | 'reset_password'

const OTP_TTL_MS = 5 * 60 * 1000 // 5 分钟有效
const RESEND_COOLDOWN_MS = 60 * 1000 // 60s 防刷
const HOURLY_LIMIT = 5 // 同手机号每 10 分钟最多 5 次
const MAX_ATTEMPTS = 5 // 同 OTP 最多校验 5 次
const PHONE_E164_RE = /^\+?[1-9]\d{6,14}$/
/** dev mock 模式下固定的验证码。 */
const DEV_MOCK_CODE = '123456'

/** 把任意中国手机号统一成 E.164 (+86xxxxxxxxxxx)。 */
export function normalisePhone(input: string, defaultCountry = 'CN'): string {
  const trimmed = input.replace(/[\s\-()（）]/g, '')
  if (trimmed.startsWith('+')) {
    if (!PHONE_E164_RE.test(trimmed)) {
      throw new ForgelyError('INVALID_PHONE', '手机号格式不正确。', 400, { input })
    }
    return trimmed
  }
  if (defaultCountry === 'CN' && /^1[3-9]\d{9}$/.test(trimmed)) {
    return `+86${trimmed}`
  }
  if (PHONE_E164_RE.test(`+${trimmed}`)) {
    return `+${trimmed}`
  }
  throw new ForgelyError('INVALID_PHONE', '手机号格式不正确。', 400, { input })
}

function hashCode(code: string, phoneE164: string): string {
  return createHash('sha256').update(`${phoneE164}:${code}`).digest('hex')
}

/** 通用 SMS 发送钩子 — 默认从 ENV `FORGELY_SMS_PROVIDER` 选择实现。 */
export interface SmsSender {
  /** 通道标识 —— 'console' 会触发 dev mock 行为（固定 123456）。 */
  readonly kind: 'console' | 'aliyun' | 'tencent'
  send(opts: {
    phoneE164: string
    code: string
    purpose: OtpPurpose
    ttlMinutes: number
  }): Promise<void>
}

class ConsoleSmsSender implements SmsSender {
  readonly kind = 'console' as const
  async send(opts: {
    phoneE164: string
    code: string
    purpose: OtpPurpose
    ttlMinutes: number
  }): Promise<void> {
    // eslint-disable-next-line no-console
    console.info(
      `\n[sms-otp] (DEV MOCK) 📱 ${opts.phoneE164} purpose=${opts.purpose} 验证码 ${opts.code}  (有效 ${opts.ttlMinutes} 分钟)\n`,
    )
  }
}

class AliyunSmsSender implements SmsSender {
  readonly kind = 'aliyun' as const

  async send(opts: {
    phoneE164: string
    code: string
    purpose: OtpPurpose
    ttlMinutes: number
  }): Promise<void> {
    const accessKey = process.env.ALIYUN_SMS_ACCESS_KEY ?? process.env.ALIYUN_ACCESS_KEY_ID
    const accessSecret = process.env.ALIYUN_SMS_SECRET_KEY ?? process.env.ALIYUN_ACCESS_KEY_SECRET
    const signName = process.env.ALIYUN_SMS_SIGN_NAME
    const templateCode = process.env.ALIYUN_SMS_TEMPLATE_OTP ?? process.env.ALIYUN_SMS_TEMPLATE_CODE
    if (!accessKey || !accessSecret || !signName || !templateCode) {
      throw new ForgelyError('SMS_NOT_CONFIGURED', '阿里云 SMS 未配置。', 500)
    }

    // 阿里云 dysmsapi 仅接受中国大陆手机号（不带 +86）
    const phoneNumbers = opts.phoneE164.startsWith('+86')
      ? opts.phoneE164.slice(3)
      : opts.phoneE164.replace(/^\+/, '')

    // 动态 import —— 海外部署不装阿里云 SDK 也能启动
    const [dysms, openapi, teaUtil] = await Promise.all([
      import('@alicloud/dysmsapi20170525'),
      import('@alicloud/openapi-client'),
      import('@alicloud/tea-util'),
    ])
    const DysmsClient = dysms.default
    const SendSmsRequest = dysms.SendSmsRequest
    const { Config } = openapi
    const { RuntimeOptions } = teaUtil

    const config = new Config({
      accessKeyId: accessKey,
      accessKeySecret: accessSecret,
      endpoint: process.env.ALIYUN_SMS_ENDPOINT ?? 'dysmsapi.aliyuncs.com',
    })
    const client = new DysmsClient(config)
    const req = new SendSmsRequest({
      phoneNumbers,
      signName,
      templateCode,
      templateParam: JSON.stringify({ code: opts.code }),
    })
    const runtime = new RuntimeOptions({})
    const resp = await client.sendSmsWithOptions(req, runtime)
    const body = resp.body
    if (body?.code && body.code !== 'OK') {
      throw new ForgelyError(
        'SMS_SEND_FAILED',
        `阿里云 SMS 发送失败：${body.message ?? body.code}`,
        502,
        { aliyunCode: body.code, aliyunRequestId: body.requestId },
      )
    }
  }
}

class TencentSmsSender implements SmsSender {
  readonly kind = 'tencent' as const
  async send(opts: {
    phoneE164: string
    code: string
    purpose: OtpPurpose
    ttlMinutes: number
  }): Promise<void> {
    const secretId = process.env.TENCENT_SMS_SECRET_ID ?? process.env.TENCENT_SECRET_ID
    const secretKey = process.env.TENCENT_SMS_SECRET_KEY ?? process.env.TENCENT_SECRET_KEY
    const sdkAppId = process.env.TENCENT_SMS_APP_ID ?? process.env.TENCENT_SMS_SDK_APP_ID
    const templateId = process.env.TENCENT_SMS_TEMPLATE_OTP ?? process.env.TENCENT_SMS_TEMPLATE_ID
    const signName = process.env.TENCENT_SMS_SIGN_NAME
    if (!secretId || !secretKey || !sdkAppId || !templateId || !signName) {
      throw new ForgelyError('SMS_NOT_CONFIGURED', '腾讯云 SMS 未配置。', 500)
    }
    void { opts, sdkAppId, templateId, signName, secretId, secretKey }
    // TODO: 接入 tencentcloud-sdk-nodejs Sms.SendSms（当前 MVP 只用阿里云）
  }
}

let cachedSender: SmsSender | undefined

/** 解析当前 SMS 通道（按 ENV 选择阿里 / 腾讯 / dev console）。 */
export function getSmsSender(): SmsSender {
  if (cachedSender) return cachedSender
  const explicit = process.env.FORGELY_SMS_PROVIDER
  // 无显式选择 → 有 aliyun key 则阿里云，否则 console
  const hasAliyun =
    !!(process.env.ALIYUN_SMS_ACCESS_KEY ?? process.env.ALIYUN_ACCESS_KEY_ID) &&
    !!(process.env.ALIYUN_SMS_SECRET_KEY ?? process.env.ALIYUN_ACCESS_KEY_SECRET)
  const provider = explicit ?? (hasAliyun ? 'aliyun' : 'console')
  switch (provider) {
    case 'aliyun':
      cachedSender = new AliyunSmsSender()
      break
    case 'tencent':
      cachedSender = new TencentSmsSender()
      break
    case 'console':
    default:
      cachedSender = new ConsoleSmsSender()
      break
  }
  return cachedSender
}

/** 测试场景：注入自定义 sender。 */
export function setSmsSender(sender: SmsSender): void {
  cachedSender = sender
}

export interface RequestOtpOptions {
  phone: string
  purpose: OtpPurpose
  /** 可选 — 如果用户已登录，关联到对应 userId（绑定 / 验证场景）。 */
  userId?: string
  /** 调用方 IP（风控）。 */
  requestIp?: string
}

export interface RequestOtpResult {
  expiresAt: Date
  /** 60 秒重试冷却 */
  resendAvailableAt: Date
  /** 是否 dev mock 模式（前端用于展示 "验证码 123456" 提示）。 */
  mock: boolean
}

/** 发送一条新 OTP — 自动做防刷 + hash 入库 + 调用 SMS sender。 */
export async function requestOtp(options: RequestOtpOptions): Promise<RequestOtpResult> {
  const phoneE164 = normalisePhone(options.phone)
  const since = new Date(Date.now() - 10 * 60 * 1000)

  const recent = await prisma.phoneOtp.findMany({
    where: { phoneE164, purpose: options.purpose, createdAt: { gte: since } },
    orderBy: { createdAt: 'desc' },
    take: HOURLY_LIMIT,
  })
  if (recent.length >= HOURLY_LIMIT) {
    throw errors.rateLimited(600)
  }
  const lastSent = recent[0]
  if (lastSent && Date.now() - lastSent.createdAt.getTime() < RESEND_COOLDOWN_MS) {
    const waitS = Math.ceil(
      (RESEND_COOLDOWN_MS - (Date.now() - lastSent.createdAt.getTime())) / 1000,
    )
    throw errors.rateLimited(waitS)
  }

  const sender = getSmsSender()
  const code = sender.kind === 'console' ? DEV_MOCK_CODE : String(randomInt(100_000, 1_000_000))
  const codeHash = hashCode(code, phoneE164)
  const expiresAt = new Date(Date.now() + OTP_TTL_MS)

  await prisma.phoneOtp.create({
    data: {
      phoneE164,
      purpose: options.purpose,
      codeHash,
      userId: options.userId ?? null,
      requestIp: options.requestIp ?? null,
      expiresAt,
    },
  })

  await sender.send({
    phoneE164,
    code,
    purpose: options.purpose,
    ttlMinutes: Math.round(OTP_TTL_MS / 60_000),
  })

  return {
    expiresAt,
    resendAvailableAt: new Date(Date.now() + RESEND_COOLDOWN_MS),
    mock: sender.kind === 'console',
  }
}

export interface VerifyOtpOptions {
  phone: string
  purpose: OtpPurpose
  code: string
}

export interface VerifyOtpResult {
  /** 校验通过的 OTP id（已标记 consumed）。 */
  otpId: string
  /** 标准化后的 E.164 手机号。 */
  phoneE164: string
  /** 关联到的现有 user.id（如果有），否则 null（调用方决定建用户 / 绑当前会话）。 */
  userId: string | null
}

/** 校验一条 OTP —— 成功返回 `userId` 或 null。失败抛 ForgelyError。 */
export async function verifyOtp(options: VerifyOtpOptions): Promise<VerifyOtpResult> {
  const phoneE164 = normalisePhone(options.phone)
  const codeHash = hashCode(options.code, phoneE164)

  const otp = await prisma.phoneOtp.findFirst({
    where: {
      phoneE164,
      purpose: options.purpose,
      consumedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  })
  if (!otp) {
    throw new ForgelyError('OTP_NOT_FOUND', '验证码不存在或已过期，请重新获取。', 400)
  }
  if (otp.attempts >= MAX_ATTEMPTS) {
    throw new ForgelyError('OTP_LOCKED', '验证码尝试次数过多，请重新获取。', 429)
  }

  if (otp.codeHash !== codeHash) {
    await prisma.phoneOtp.update({
      where: { id: otp.id },
      data: { attempts: otp.attempts + 1 },
    })
    throw new ForgelyError('OTP_INVALID', '验证码错误。', 400, {
      remaining: MAX_ATTEMPTS - otp.attempts - 1,
    })
  }

  await prisma.phoneOtp.update({
    where: { id: otp.id },
    data: { consumedAt: new Date(), attempts: otp.attempts + 1 },
  })

  return { otpId: otp.id, phoneE164, userId: otp.userId }
}

export interface PhoneLoginResult {
  userId: string
  isNewUser: boolean
  phoneE164: string
}

/**
 * 手机号 + OTP 一键登录：校验 OTP → 找/建 User → 返回 userId。
 * 调用方拿到 userId 后调用 createSession() 签发 cookie。
 */
export async function loginWithPhoneOtp(options: VerifyOtpOptions): Promise<PhoneLoginResult> {
  const verified = await verifyOtp({ ...options, purpose: 'login' })

  // 先按 phoneE164 查用户（OTP 可能未 link 到 userId，但号码可能已存在）
  if (!verified.userId) {
    const byPhone = await prisma.user.findUnique({
      where: { phoneE164: verified.phoneE164 },
      select: { id: true },
    })
    if (byPhone) {
      return { userId: byPhone.id, isNewUser: false, phoneE164: verified.phoneE164 }
    }
  } else {
    return { userId: verified.userId, isNewUser: false, phoneE164: verified.phoneE164 }
  }

  const user = await prisma.user.create({
    data: {
      email: `phone_${verified.phoneE164.replace(/[^0-9]/g, '')}@phone.forgely.cn`,
      name: null,
      phoneE164: verified.phoneE164,
      phoneVerifiedAt: new Date(),
      region: 'cn',
      locale: 'zh-CN',
    },
    select: { id: true },
  })
  return { userId: user.id, isNewUser: true, phoneE164: verified.phoneE164 }
}

/** 已登录用户绑定手机号 — verify 通过后写 user.phoneE164。 */
export async function bindPhoneToUser(options: {
  userId: string
  phone: string
  code: string
}): Promise<{ phoneE164: string }> {
  const verified = await verifyOtp({ phone: options.phone, code: options.code, purpose: 'bind' })
  await prisma.user.update({
    where: { id: options.userId },
    data: { phoneE164: verified.phoneE164, phoneVerifiedAt: new Date() },
  })
  return { phoneE164: verified.phoneE164 }
}
