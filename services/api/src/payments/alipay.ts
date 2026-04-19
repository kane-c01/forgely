/**
 * 支付宝 OpenAPI Provider — PC / Wap / App / Native(扫码)。
 *
 * 实现框架（生产部署需补）：
 *   - 网关：https://openapi.alipay.com/gateway.do
 *   - 加签：RSA2 SHA256WithRSA, app_private_key + alipay_public_key
 *   - 主要 method：alipay.trade.page.pay (PC) / alipay.trade.wap.pay (H5)
 *                  alipay.trade.precreate (扫码) / alipay.trade.app.pay (App)
 *   - Webhook：用户支付成功后异步通知，参数中带 sign，需用 alipay_public_key 验签
 *   - 退款：alipay.trade.refund
 *
 * 本文件提供契约 + 主流程，省略二级签名计算（生产对接时引入
 * `alipay-sdk` npm 包）。
 *
 * @owner W1 — CN pivot (docs/PIVOT-CN.md §3)
 */
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
    notifyUrlDefault:
      process.env.ALIPAY_NOTIFY_URL ?? 'https://app.forgely.cn/api/webhooks/alipay',
    gateway: process.env.ALIPAY_GATEWAY ?? 'https://openapi.alipay.com/gateway.do',
  }
  for (const [k, v] of Object.entries(env)) {
    if (!v && !['notifyUrlDefault', 'gateway'].includes(k)) {
      throw new ForgelyError(
        'ALIPAY_NOT_CONFIGURED',
        `支付宝未配置：缺少 ${k}。`,
        500,
      )
    }
  }
  return env
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
          throw new ForgelyError('ALIPAY_SCENE_UNSUPPORTED', `不支持的支付场景：${input.scene}`, 400)
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
      ...(input.metadata ? { passback_params: encodeURIComponent(JSON.stringify(input.metadata)) } : {}),
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
    params.sign = '__SIGNED__' // TODO: RSA2 签名

    const query = new URLSearchParams(params).toString()
    if (input.scene === 'native') {
      // 扫码：调 API 获取 qr_code
      const response = await fetch(`${env.gateway}?${query}`, { method: 'POST' })
      const json = (await response.json()) as { alipay_trade_precreate_response?: { qr_code?: string; out_trade_no?: string } }
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

    // 表单跳转（PC/H5/Wap）
    return {
      channel: 'alipay',
      redirectUrl: `${env.gateway}?${query}`,
      externalId: input.orderId,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    }
  }

  async verifyWebhook(headers: Headers, body: string): Promise<WebhookEvent> {
    // TODO: 验签 RSA2 with alipay_public_key
    void headers
    const params = new URLSearchParams(body)
    const orderId = params.get('out_trade_no')
    const externalId = params.get('trade_no')
    const totalAmount = params.get('total_amount')
    const tradeStatus = params.get('trade_status')
    if (!orderId || !externalId || !totalAmount || !tradeStatus) {
      throw new ForgelyError('ALIPAY_WEBHOOK_INVALID', '支付宝回调参数不完整', 400)
    }
    return {
      channel: 'alipay',
      type: tradeStatus === 'TRADE_SUCCESS' || tradeStatus === 'TRADE_FINISHED' ? 'paid' : 'failed',
      orderId,
      externalId,
      amountCents: Math.round(parseFloat(totalAmount) * 100),
      currency: 'CNY',
      paidAt: new Date(),
      raw: Object.fromEntries(params),
    }
  }

  async refund(input: { externalId: string; amountCents: number; reason?: string }): Promise<RefundResult> {
    void input
    throw new ForgelyError('ALIPAY_REFUND_TODO', '支付宝退款待生产对接', 500)
  }
}
