/**
 * 支付宝 OpenAPI Provider — PC / Wap / App / Native(扫码)。
 *
 * 真签名实现（仅依赖 node:crypto，无 alipay-sdk peer dep）：
 *   - 网关：https://openapi.alipay.com/gateway.do
 *   - 加签 RSA2 (SHA256WithRSA): app_private_key
 *   - 验签 RSA2: alipay_public_key
 *   - 支持 method: alipay.trade.page.pay / wap.pay / precreate / app.pay /
 *                  alipay.trade.refund
 *
 * @owner W3 — Sprint 3 (生产签名实现)
 */
import { createPrivateKey, createPublicKey, createSign, createVerify } from 'node:crypto'

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
  appPrivateKey: string
  alipayPublicKey: string
  notifyUrlDefault: string
  gateway: string
}

function readEnv(): Env {
  const env = {
    appId: process.env.ALIPAY_APP_ID ?? '',
    appPrivateKey: process.env.ALIPAY_APP_PRIVATE_KEY ?? '',
    alipayPublicKey: process.env.ALIPAY_PUBLIC_KEY ?? '',
    notifyUrlDefault: process.env.ALIPAY_NOTIFY_URL ?? 'https://app.forgely.cn/api/webhooks/alipay',
    gateway: process.env.ALIPAY_GATEWAY ?? 'https://openapi.alipay.com/gateway.do',
  }
  for (const [k, v] of Object.entries(env)) {
    if (!v && !['notifyUrlDefault', 'gateway'].includes(k)) {
      throw new ForgelyError('ALIPAY_NOT_CONFIGURED', `支付宝未配置：缺少 ${k}。`, 500)
    }
  }
  return env
}

const wrapPrivateKeyPem = (raw: string): string => {
  if (raw.includes('-----BEGIN')) return raw
  // Treat as raw base64 PKCS#8 string.
  const lines = raw.match(/.{1,64}/g) ?? []
  return `-----BEGIN PRIVATE KEY-----\n${lines.join('\n')}\n-----END PRIVATE KEY-----\n`
}

const wrapPublicKeyPem = (raw: string): string => {
  if (raw.includes('-----BEGIN')) return raw
  const lines = raw.match(/.{1,64}/g) ?? []
  return `-----BEGIN PUBLIC KEY-----\n${lines.join('\n')}\n-----END PUBLIC KEY-----\n`
}

/** Build the canonical sign-string per Alipay openapi spec. */
export const buildAlipaySignString = (params: Record<string, string>): string => {
  return Object.keys(params)
    .filter((k) => k !== 'sign' && k !== 'sign_type' && params[k] !== undefined && params[k] !== '')
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join('&')
}

export const signAlipayParams = (params: Record<string, string>, privateKeyPem: string): string => {
  const stringToSign = buildAlipaySignString(params)
  const signer = createSign('RSA-SHA256')
  signer.update(stringToSign, 'utf8')
  signer.end()
  return signer.sign(createPrivateKey(wrapPrivateKeyPem(privateKeyPem))).toString('base64')
}

export const verifyAlipaySignature = (
  params: Record<string, string>,
  publicKeyPem: string,
  signature: string,
): boolean => {
  const stringToVerify = buildAlipaySignString(params)
  const verify = createVerify('RSA-SHA256')
  verify.update(stringToVerify, 'utf8')
  verify.end()
  return verify.verify(createPublicKey(wrapPublicKeyPem(publicKeyPem)), signature, 'base64')
}

export class AlipayProvider implements PaymentProvider {
  readonly channel = 'alipay' as const

  async createCheckout(input: CreateCheckoutInput): Promise<CheckoutResult> {
    const env = readEnv()
    const method = ((): string => {
      switch (input.scene) {
        case 'pc':
          return 'alipay.trade.page.pay'
        case 'wap':
        case 'h5':
          return 'alipay.trade.wap.pay'
        case 'app':
          return 'alipay.trade.app.pay'
        case 'native':
          return 'alipay.trade.precreate'
        default:
          throw new ForgelyError(
            'ALIPAY_SCENE_UNSUPPORTED',
            `不支持的支付场景：${input.scene}`,
            400,
          )
      }
    })()

    const bizContent = {
      out_trade_no: input.orderId,
      total_amount: (input.amountCents / 100).toFixed(2),
      subject: input.description.slice(0, 256),
      product_code:
        input.scene === 'pc'
          ? 'FAST_INSTANT_TRADE_PAY'
          : input.scene === 'wap' || input.scene === 'h5'
            ? 'QUICK_WAP_WAY'
            : input.scene === 'app'
              ? 'QUICK_MSECURITY_PAY'
              : 'FACE_TO_FACE_PAYMENT',
      ...(input.metadata
        ? { passback_params: encodeURIComponent(JSON.stringify(input.metadata)) }
        : {}),
    }

    const params: Record<string, string> = {
      app_id: env.appId,
      method,
      format: 'JSON',
      charset: 'utf-8',
      sign_type: 'RSA2',
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      version: '1.0',
      notify_url: input.notifyUrl ?? env.notifyUrlDefault,
      ...(input.returnUrl ? { return_url: input.returnUrl } : {}),
      biz_content: JSON.stringify(bizContent),
    }
    params.sign = signAlipayParams(params, env.appPrivateKey)

    const query = new URLSearchParams(params).toString()
    if (input.scene === 'native') {
      const response = await fetch(`${env.gateway}?${query}`, { method: 'POST' })
      const json = (await response.json()) as {
        alipay_trade_precreate_response?: { qr_code?: string; out_trade_no?: string }
      }
      const qr = json.alipay_trade_precreate_response?.qr_code
      if (!qr) {
        throw new ForgelyError('ALIPAY_PRECREATE_FAILED', '支付宝预下单失败', 502)
      }
      return {
        channel: 'alipay',
        qrCode: qr,
        externalId: json.alipay_trade_precreate_response?.out_trade_no ?? input.orderId,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      }
    }

    return {
      channel: 'alipay',
      redirectUrl: `${env.gateway}?${query}`,
      externalId: input.orderId,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    }
  }

  async verifyWebhook(_headers: Headers, body: string): Promise<WebhookEvent> {
    void _headers
    const env = readEnv()
    const params = Object.fromEntries(new URLSearchParams(body)) as Record<string, string>
    const signature = params.sign
    if (!signature) {
      throw new ForgelyError('ALIPAY_WEBHOOK_INVALID', '支付宝回调缺少 sign 字段。', 400)
    }

    const ok = verifyAlipaySignature(params, env.alipayPublicKey, signature)
    if (!ok) {
      throw new ForgelyError('ALIPAY_WEBHOOK_INVALID', '支付宝回调签名验证失败。', 400)
    }

    const orderId = params.out_trade_no
    const externalId = params.trade_no
    const totalAmount = params.total_amount
    const tradeStatus = params.trade_status
    if (!orderId || !externalId || !totalAmount || !tradeStatus) {
      throw new ForgelyError('ALIPAY_WEBHOOK_INVALID', '支付宝回调参数不完整。', 400)
    }
    return {
      channel: 'alipay',
      type:
        tradeStatus === 'TRADE_SUCCESS' || tradeStatus === 'TRADE_FINISHED'
          ? 'paid'
          : tradeStatus === 'TRADE_CLOSED'
            ? 'expired'
            : 'failed',
      orderId,
      externalId,
      amountCents: Math.round(parseFloat(totalAmount) * 100),
      currency: 'CNY',
      paidAt: new Date(),
      raw: params,
    }
  }

  async refund(input: {
    externalId: string
    amountCents: number
    reason?: string
  }): Promise<RefundResult> {
    const env = readEnv()
    const bizContent = {
      trade_no: input.externalId,
      refund_amount: (input.amountCents / 100).toFixed(2),
      refund_reason: input.reason?.slice(0, 256) ?? '用户退款',
    }
    const params: Record<string, string> = {
      app_id: env.appId,
      method: 'alipay.trade.refund',
      format: 'JSON',
      charset: 'utf-8',
      sign_type: 'RSA2',
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      version: '1.0',
      biz_content: JSON.stringify(bizContent),
    }
    params.sign = signAlipayParams(params, env.appPrivateKey)

    const response = await fetch(env.gateway, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(params).toString(),
    })
    if (!response.ok) {
      throw new ForgelyError(
        'ALIPAY_REFUND_FAILED',
        `支付宝退款失败：HTTP ${response.status}`,
        response.status,
      )
    }
    const json = (await response.json()) as {
      alipay_trade_refund_response?: { code?: string; trade_no?: string }
    }
    const resp = json.alipay_trade_refund_response
    if (!resp || resp.code !== '10000') {
      throw new ForgelyError(
        'ALIPAY_REFUND_FAILED',
        `支付宝退款失败：code=${resp?.code ?? 'unknown'}`,
        502,
      )
    }
    return {
      refundId: resp.trade_no ?? input.externalId,
      status: 'success',
      amountCents: input.amountCents,
    }
  }
}
