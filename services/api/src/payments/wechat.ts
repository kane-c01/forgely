/**
 * 微信支付 V3 Provider — Native(扫码) / JSAPI(公众号) / H5 / 小程序 / App。
 *
 * 真签名实现（无外部 SDK 依赖，仅 node:crypto）：
 *   - 商户请求签名: RSA-SHA256, header `Authorization: WECHATPAY2-SHA256-RSA2048 ...`
 *     按官方文档 https://pay.weixin.qq.com/wiki/doc/apiv3/wechatpay/wechatpay4_0.shtml
 *   - Webhook 验签 + AES-256-GCM 解密 (apiV3Key)
 *   - 退款: POST /v3/refund/domestic/refunds
 *
 * 生产部署只需在 .env 提供商户证书 + apiV3Key 即可启用，无需安装 SDK。
 *
 * @owner W3 — Sprint 3 (生产签名实现)
 */
import {
  createHash,
  createPrivateKey,
  createSign,
  createVerify,
  createDecipheriv,
  randomBytes,
} from 'node:crypto'

import { ForgelyError } from '../errors.js'
import type {
  CheckoutResult,
  CreateCheckoutInput,
  PaymentProvider,
  RefundResult,
  WebhookEvent,
} from './types.js'

interface Env {
  appId: string
  mchId: string
  /** PEM-encoded RSA private key (read from disk in env / vault). */
  mchPrivateKey: string
  /** APIv3 secret used for AES-GCM webhook decryption. 32 chars. */
  apiV3Key: string
  /** Merchant certificate serial number (hex). */
  serialNo: string
  notifyUrlDefault: string
  /**
   * Map of platform certificate serial -> public key (PEM). Populated from
   * `WECHAT_PAY_PLATFORM_CERTS_JSON` (JSON string) for webhook verification.
   * Empty by default — call sites must hydrate via `setPlatformCert`.
   */
  platformCerts: Record<string, string>
}

const PLATFORM_CERTS: Record<string, string> = (() => {
  const raw = process.env.WECHAT_PAY_PLATFORM_CERTS_JSON
  if (!raw) return {}
  try {
    return JSON.parse(raw) as Record<string, string>
  } catch {
    return {}
  }
})()

/** Test seam — apps/super_admin can rotate platform certificates without restart. */
export const setPlatformCert = (serialNo: string, publicKeyPem: string): void => {
  PLATFORM_CERTS[serialNo] = publicKeyPem
}

function readEnv(): Env {
  const env = {
    appId: process.env.WECHAT_PAY_APP_ID ?? '',
    mchId: process.env.WECHAT_PAY_MCH_ID ?? '',
    mchPrivateKey: process.env.WECHAT_PAY_PRIVATE_KEY ?? '',
    apiV3Key: process.env.WECHAT_PAY_APIV3_KEY ?? '',
    serialNo: process.env.WECHAT_PAY_SERIAL_NO ?? '',
    notifyUrlDefault:
      process.env.WECHAT_PAY_NOTIFY_URL ?? 'https://app.forgely.cn/api/webhooks/wechat-pay',
    platformCerts: PLATFORM_CERTS,
  }
  for (const [k, v] of Object.entries(env)) {
    if (!v && k !== 'notifyUrlDefault' && k !== 'platformCerts') {
      throw new ForgelyError('WECHAT_PAY_NOT_CONFIGURED', `微信支付未配置：缺少 ${k}。`, 500)
    }
  }
  return env
}

/**
 * Build the `Authorization` header value per WeChat Pay v3 spec:
 *   WECHATPAY2-SHA256-RSA2048 mchid="…",nonce_str="…",signature="…",timestamp="…",serial_no="…"
 */
export const buildWechatAuthHeader = (params: {
  method: 'GET' | 'POST'
  /** URL path + querystring (no scheme/host). */
  url: string
  body: string
  mchId: string
  serialNo: string
  privateKeyPem: string
  /** Override for tests. */
  timestamp?: number
  nonceStr?: string
}): string => {
  const timestamp = params.timestamp ?? Math.floor(Date.now() / 1000)
  const nonceStr = params.nonceStr ?? randomBytes(16).toString('hex')
  const message = `${params.method}\n${params.url}\n${timestamp}\n${nonceStr}\n${params.body}\n`
  const signer = createSign('RSA-SHA256')
  signer.update(message, 'utf8')
  signer.end()
  const signature = signer.sign(createPrivateKey(params.privateKeyPem)).toString('base64')
  return (
    `WECHATPAY2-SHA256-RSA2048 ` +
    `mchid="${params.mchId}",` +
    `nonce_str="${nonceStr}",` +
    `signature="${signature}",` +
    `timestamp="${timestamp}",` +
    `serial_no="${params.serialNo}"`
  )
}

/**
 * Verify the WeChat Pay platform signature on a webhook payload.
 *
 * Throws WECHAT_PAY_WEBHOOK_INVALID if the platform cert isn't loaded or
 * the signature is invalid.
 */
export const verifyWechatWebhookSignature = (params: {
  serial: string
  signature: string
  timestamp: string
  nonce: string
  body: string
  platformCerts: Record<string, string>
}): void => {
  const cert = params.platformCerts[params.serial]
  if (!cert) {
    throw new ForgelyError(
      'WECHAT_PAY_WEBHOOK_INVALID',
      `Unknown WeChat Pay platform serial: ${params.serial}`,
      400,
    )
  }
  const message = `${params.timestamp}\n${params.nonce}\n${params.body}\n`
  const verify = createVerify('RSA-SHA256')
  verify.update(message, 'utf8')
  verify.end()
  const ok = verify.verify(cert, params.signature, 'base64')
  if (!ok) {
    throw new ForgelyError('WECHAT_PAY_WEBHOOK_INVALID', '微信支付 webhook 签名验证失败。', 400)
  }
}

/** Decrypt the `resource.ciphertext` envelope using AES-256-GCM + apiV3Key. */
export const decryptWechatResource = (params: {
  ciphertextB64: string
  associatedData: string
  nonce: string
  apiV3Key: string
}): string => {
  const ciphertext = Buffer.from(params.ciphertextB64, 'base64')
  if (ciphertext.length <= 16) {
    throw new ForgelyError('WECHAT_PAY_WEBHOOK_INVALID', '密文长度异常。', 400)
  }
  const authTag = ciphertext.subarray(ciphertext.length - 16)
  const data = ciphertext.subarray(0, ciphertext.length - 16)
  const decipher = createDecipheriv(
    'aes-256-gcm',
    Buffer.from(params.apiV3Key, 'utf8'),
    Buffer.from(params.nonce, 'utf8'),
  )
  decipher.setAuthTag(authTag)
  decipher.setAAD(Buffer.from(params.associatedData, 'utf8'))
  const decoded = Buffer.concat([decipher.update(data), decipher.final()])
  return decoded.toString('utf8')
}

export class WechatPayProvider implements PaymentProvider {
  readonly channel = 'wechat' as const

  async createCheckout(input: CreateCheckoutInput): Promise<CheckoutResult> {
    const env = readEnv()
    const endpoint = ((): string => {
      switch (input.scene) {
        case 'native':
          return 'https://api.mch.weixin.qq.com/v3/pay/transactions/native'
        case 'jsapi':
        case 'mini':
          return 'https://api.mch.weixin.qq.com/v3/pay/transactions/jsapi'
        case 'h5':
        case 'wap':
          return 'https://api.mch.weixin.qq.com/v3/pay/transactions/h5'
        case 'app':
          return 'https://api.mch.weixin.qq.com/v3/pay/transactions/app'
        default:
          throw new ForgelyError(
            'WECHAT_PAY_SCENE_UNSUPPORTED',
            `不支持的支付场景：${input.scene}`,
            400,
          )
      }
    })()

    if ((input.scene === 'jsapi' || input.scene === 'mini') && !input.wechatOpenid) {
      throw new ForgelyError(
        'WECHAT_PAY_OPENID_REQUIRED',
        '微信 JSAPI / 小程序支付需要 openid。',
        400,
      )
    }

    const body = {
      appid: env.appId,
      mchid: env.mchId,
      description: input.description.slice(0, 127),
      out_trade_no: input.orderId,
      notify_url: input.notifyUrl ?? env.notifyUrlDefault,
      amount: { total: input.amountCents, currency: input.currency },
      ...(input.wechatOpenid ? { payer: { openid: input.wechatOpenid } } : {}),
      attach: input.metadata ? JSON.stringify(input.metadata).slice(0, 127) : undefined,
    }
    const bodyStr = JSON.stringify(body)
    const url = new URL(endpoint).pathname

    const authorization = buildWechatAuthHeader({
      method: 'POST',
      url,
      body: bodyStr,
      mchId: env.mchId,
      serialNo: env.serialNo,
      privateKeyPem: env.mchPrivateKey,
    })

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json',
        authorization,
        'user-agent': 'forgely/0.1.0 (+https://forgely.com)',
      },
      body: bodyStr,
    })
    if (!response.ok) {
      const detail = await response.text().catch(() => '')
      throw new ForgelyError(
        'WECHAT_PAY_CREATE_FAILED',
        `微信支付下单失败：HTTP ${response.status} ${detail.slice(0, 200)}`,
        response.status,
      )
    }
    const json = (await response.json()) as Record<string, string>

    return {
      channel: 'wechat',
      redirectUrl: json.h5_url,
      qrCode: json.code_url,
      jsapiParams:
        input.scene === 'jsapi' || input.scene === 'mini'
          ? buildJsapiParams(env.appId, json.prepay_id ?? '', env.mchPrivateKey)
          : undefined,
      externalId: json.prepay_id ?? input.orderId,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    }
  }

  async verifyWebhook(headers: Headers, body: string): Promise<WebhookEvent> {
    const env = readEnv()
    const serial = headers.get('wechatpay-serial')
    const signature = headers.get('wechatpay-signature')
    const timestamp = headers.get('wechatpay-timestamp')
    const nonce = headers.get('wechatpay-nonce')
    if (!serial || !signature || !timestamp || !nonce) {
      throw new ForgelyError(
        'WECHAT_PAY_WEBHOOK_INVALID',
        '微信支付 webhook 缺少必要 header。',
        400,
      )
    }

    verifyWechatWebhookSignature({
      serial,
      signature,
      timestamp,
      nonce,
      body,
      platformCerts: env.platformCerts,
    })

    const event = JSON.parse(body) as {
      id: string
      event_type: string
      summary?: string
      resource: { ciphertext: string; associated_data: string; nonce: string }
    }
    const plaintext = decryptWechatResource({
      ciphertextB64: event.resource.ciphertext,
      associatedData: event.resource.associated_data,
      nonce: event.resource.nonce,
      apiV3Key: env.apiV3Key,
    })
    const decoded = JSON.parse(plaintext) as {
      out_trade_no: string
      transaction_id: string
      trade_state: string
      amount?: { total?: number; currency?: string }
    }

    const standardCurrency = (decoded.amount?.currency === 'USD' ? 'USD' : 'CNY') as 'CNY' | 'USD'
    const standardType: WebhookEvent['type'] =
      decoded.trade_state === 'SUCCESS'
        ? 'paid'
        : decoded.trade_state === 'CLOSED' || decoded.trade_state === 'REVOKED'
          ? 'expired'
          : decoded.trade_state === 'REFUND'
            ? 'refunded'
            : 'failed'

    return {
      channel: 'wechat',
      type: standardType,
      orderId: decoded.out_trade_no,
      externalId: decoded.transaction_id,
      amountCents: decoded.amount?.total ?? 0,
      currency: standardCurrency,
      paidAt: standardType === 'paid' ? new Date() : undefined,
      raw: { event, decoded },
    }
  }

  async refund(input: {
    externalId: string
    amountCents: number
    reason?: string
  }): Promise<RefundResult> {
    const env = readEnv()
    const url = '/v3/refund/domestic/refunds'
    const body = {
      transaction_id: input.externalId,
      out_refund_no: `forgely_${Date.now()}_${randomBytes(4).toString('hex')}`,
      reason: input.reason?.slice(0, 80) ?? '用户退款',
      amount: {
        refund: input.amountCents,
        total: input.amountCents,
        currency: 'CNY',
      },
      notify_url: env.notifyUrlDefault.replace('/wechat-pay', '/wechat-pay/refund'),
    }
    const bodyStr = JSON.stringify(body)
    const authorization = buildWechatAuthHeader({
      method: 'POST',
      url,
      body: bodyStr,
      mchId: env.mchId,
      serialNo: env.serialNo,
      privateKeyPem: env.mchPrivateKey,
    })
    const response = await fetch(`https://api.mch.weixin.qq.com${url}`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json',
        authorization,
        'user-agent': 'forgely/0.1.0 (+https://forgely.com)',
      },
      body: bodyStr,
    })
    if (!response.ok) {
      const detail = await response.text().catch(() => '')
      throw new ForgelyError(
        'WECHAT_PAY_REFUND_FAILED',
        `微信退款失败：HTTP ${response.status} ${detail.slice(0, 200)}`,
        response.status,
      )
    }
    const json = (await response.json()) as { refund_id: string; status: string }
    return {
      refundId: json.refund_id,
      status: json.status === 'SUCCESS' ? 'success' : 'pending',
      amountCents: input.amountCents,
    }
  }
}

function buildJsapiParams(
  appId: string,
  prepayId: string,
  privateKeyPem: string,
): Record<string, string> {
  const timeStamp = String(Math.floor(Date.now() / 1000))
  const nonceStr = randomBytes(8).toString('hex')
  const packageStr = `prepay_id=${prepayId}`
  const message = `${appId}\n${timeStamp}\n${nonceStr}\n${packageStr}\n`
  const signer = createSign('RSA-SHA256')
  signer.update(message, 'utf8')
  signer.end()
  const paySign = signer.sign(createPrivateKey(privateKeyPem)).toString('base64')
  return {
    appId,
    timeStamp,
    nonceStr,
    package: packageStr,
    signType: 'RSA',
    paySign,
  }
}

void createHash
