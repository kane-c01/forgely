/**
 * Unified PaymentProvider contract — Stripe (海外) / 微信支付 / 支付宝 / 银联.
 *
 * Source: docs/PIVOT-CN.md §3.
 *
 * @owner W1 — CN pivot
 */

export type PaymentChannel = 'stripe' | 'wechat' | 'alipay' | 'unionpay' | 'now' | 'paypal'
export type PaymentScene = 'native' | 'jsapi' | 'h5' | 'mini' | 'app' | 'wap' | 'pc'
export type PaymentCurrency = 'CNY' | 'USD' | 'EUR' | 'GBP' | 'HKD'

export interface CreateCheckoutInput {
  /** Forgely 内部订单 id（必须唯一）。 */
  orderId: string
  amountCents: number
  currency: PaymentCurrency
  description: string
  /** 用户支付完成后回跳 URL（H5/PC 必填）。 */
  returnUrl?: string
  /** 通知地址（webhook）。 */
  notifyUrl: string
  /** 支付场景（决定返回 url / qr / prepay_id 等）。 */
  scene: PaymentScene
  /** 微信 jsapi 必填 — 用户的 openid。 */
  wechatOpenid?: string
  /** 用户标识（用于 risk control / 关联会员）。 */
  userId?: string
  metadata?: Record<string, string>
}

export interface CheckoutResult {
  channel: PaymentChannel
  /** PC / H5 跳转 URL（如有）。 */
  redirectUrl?: string
  /** Native 二维码内容（如有）。 */
  qrCode?: string
  /** 微信 jsapi 必备的 prepay_id / paySign / nonceStr 等。 */
  jsapiParams?: Record<string, string>
  /** 通道侧的支付意向 id（webhook 关联用）。 */
  externalId: string
  expiresAt: Date
}

export interface WebhookEvent {
  channel: PaymentChannel
  /** 标准化后的事件类型。 */
  type: 'paid' | 'refunded' | 'failed' | 'expired'
  /** Forgely orderId（从 metadata 解出）。 */
  orderId: string
  /** 通道侧的支付意向 id。 */
  externalId: string
  amountCents: number
  currency: PaymentCurrency
  /** 实际支付时间（通道返回）。 */
  paidAt?: Date
  raw: unknown
}

export interface RefundResult {
  refundId: string
  amountCents: number
  status: 'success' | 'pending' | 'failed'
}

export interface PaymentProvider {
  readonly channel: PaymentChannel
  createCheckout(input: CreateCheckoutInput): Promise<CheckoutResult>
  /** 校验 webhook 签名 + 解析事件。失败必须 throw。 */
  verifyWebhook(headers: Headers, body: string): Promise<WebhookEvent>
  refund(input: { externalId: string; amountCents: number; reason?: string }): Promise<RefundResult>
}
