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
 * @owner W1 — CN pivot (docs/PIVOT-CN.md)
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

/** 把任意中国手机号统一成 E.164 (+86xxxxxxxxxxx)。 */
export function normalisePhone(input: string, defaultCountry = 'CN'): string {
  const trimmed = input.replace(/[\s\-()（）]/g, '')
  if (trimmed.startsWith('+')) {
    if (!PHONE_E164_RE.test(trimmed)) {
      throw new ForgelyError('INVALID_PHONE', '手机号格式不正确。', 400, { input })
    }
    return trimmed
  }
  // 国内手机号
  if (defaultCountry === 'CN' && /^1[3-9]\d{9}$/.test(trimmed)) {
    return `+86${trimmed}`
  }
  if (PHONE_E164_RE.test(`+${trimmed}`)) {
    return `+${trimmed}`
  }
  throw new ForgelyError('INVALID_PHONE', '手机号格式不正确。', 400, { input })
}

function hashCode(code: string, phoneE164: string): string {
  // phone 加盐避免彩虹表
  return createHash('sha256').update(`${phoneE164}:${code}`).digest('hex')
}

/** 通用 SMS 发送钩子 — 默认从 ENV `FORGELY_SMS_PROVIDER` 选择实现。 */
export interface SmsSender {
  send(opts: { phoneE164: string; code: string; purpose: OtpPurpose; ttlMinutes: number }): Promise<void>
}

class ConsoleSmsSender implements SmsSender {
  async send(opts: { phoneE164: string; code: string; purpose: OtpPurpose; ttlMinutes: number }): Promise<void> {
    console.info(
      `[sms-otp] (DEV) → ${opts.phoneE164} purpose=${opts.purpose} code=${opts.code} ttl=${opts.ttlMinutes}m`,
    )
  }
}

class AliyunSmsSender implements SmsSender {
  async send(opts: { phoneE164: string; code: string; purpose: OtpPurpose; ttlMinutes: number }): Promise<void> {
    // 实际项目接入 @alicloud/dysmsapi20170525 SDK 或 HTTP 直连。
    // 这里留生产实现的接入点；签名 / 模板 ID 通过 ENV 注入。
    const accessKey = process.env.ALIYUN_ACCESS_KEY_ID
    const accessSecret = process.env.ALIYUN_ACCESS_KEY_SECRET
    const signName = process.env.ALIYUN_SMS_SIGN_NAME
    const templateCode = process.env.ALIYUN_SMS_TEMPLATE_CODE
    if (!accessKey || !accessSecret || !signName || !templateCode) {
      throw new ForgelyError('SMS_NOT_CONFIGURED', '阿里云 SMS 未配置。', 500)
    }
    const phoneNum = opts.phoneE164.startsWith('+86')
      ? opts.phoneE164.slice(3)
      : opts.phoneE164.replace(/^\+/, '')
    const body = JSON.stringify({
      PhoneNumbers: phoneNum,
      SignName: signName,
      TemplateCode: templateCode,
      TemplateParam: JSON.stringify({ code: opts.code, ttl: String(opts.ttlMinutes) }),
    })
    // TODO: 实际签名计算 + POST 到 https://dysmsapi.aliyuncs.com
    // 留空返回成功，由 prod 部署接入真实 SDK 时替换。
    void body
  }
}

class TencentSmsSender implements SmsSender {
  async send(opts: { phoneE164: string; code: string; purpose: OtpPurpose; ttlMinutes: number }): Promise<void> {
    const secretId = process.env.TENCENT_SECRET_ID
    const secretKey = process.env.TENCENT_SECRET_KEY
    const sdkAppId = process.env.TENCENT_SMS_SDK_APP_ID
    const templateId = process.env.TENCENT_SMS_TEMPLATE_ID
    const signName = process.env.TENCENT_SMS_SIGN_NAME
    if (!secretId || !secretKey || !sdkAppId || !templateId || !signName) {
      throw new ForgelyError('SMS_NOT_CONFIGURED', '腾讯云 SMS 未配置。', 500)
    }
    void { opts, sdkAppId, templateId, signName, secretId, secretKey }
    // TODO: 接入 tencentcloud-sdk-nodejs Sms.SendSms
  }
}

let cachedSender: SmsSender | undefined

/** 解析当前 SMS 通道（按 ENV 选择阿里 / 腾讯 / dev console）。 */
export function getSmsSender(): SmsSender {
  if (cachedSender) return cachedSender
  const provider = process.env.FORGELY_SMS_PROVIDER ?? 'console'
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

  const code = String(randomInt(100_000, 1_000_000)) // 6 位数字
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

  await getSmsSender().send({
    phoneE164,
    code,
    purpose: options.purpose,
    ttlMinutes: Math.round(OTP_TTL_MS / 60_000),
  })

  return {
    expiresAt,
    resendAvailableAt: new Date(Date.now() + RESEND_COOLDOWN_MS),
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

/**
 * 手机号 + OTP 一键登录：校验 OTP → 找/建 User → 返回 userId。
 * 调用方拿到 userId 后调用 issueSession() 签发 cookie。
 */
export async function loginWithPhoneOtp(options: VerifyOtpOptions): Promise<{
  userId: string
  isNewUser: boolean
  phoneE164: string
}> {
  const verified = await verifyOtp({ ...options, purpose: 'login' })
  if (verified.userId) {
    return { userId: verified.userId, isNewUser: false, phoneE164: verified.phoneE164 }
  }
  // 新用户 — 落库（伪邮箱占位）
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
