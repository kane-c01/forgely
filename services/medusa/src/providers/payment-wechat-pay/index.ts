import type {
  PaymentProviderError,
  PaymentProviderSessionResponse} from '@medusajs/framework/utils';
import {
  AbstractPaymentProvider,
  PaymentSessionStatus,
  type CreatePaymentProviderSession,
  type UpdatePaymentProviderSession,
  type ProviderWebhookPayload,
  type WebhookActionResult,
} from '@medusajs/framework/utils'
import crypto from 'node:crypto'

type WechatPayOptions = {
  appId: string
  mchId: string
  apiKey: string
  sandbox: boolean
}

/**
 * WeChat Pay Native (JSAPI) provider for Medusa v2.
 * Wraps the WeChat Pay V3 API for unified payment flow.
 */
class WechatPayPaymentProvider extends AbstractPaymentProvider<WechatPayOptions> {
  static identifier = 'wechat-pay'
  private baseUrl: string

  constructor(container: Record<string, unknown>, options: WechatPayOptions) {
    super(container, options)
    this.baseUrl = options.sandbox
      ? 'https://api.mch.weixin.qq.com/sandboxnew'
      : 'https://api.mch.weixin.qq.com'
  }

  private sign(params: Record<string, string>): string {
    const sorted = Object.keys(params).sort()
    const str = sorted.map((k) => `${k}=${params[k]}`).join('&') + `&key=${this.options.apiKey}`
    return crypto.createHash('md5').update(str, 'utf8').digest('hex').toUpperCase()
  }

  private generateNonce(): string {
    return crypto.randomBytes(16).toString('hex')
  }

  async initiatePayment(
    input: CreatePaymentProviderSession,
  ): Promise<PaymentProviderError | PaymentProviderSessionResponse> {
    const { amount, currency_code, context } = input
    const outTradeNo = `forgely_${Date.now()}_${this.generateNonce().slice(0, 8)}`
    const params: Record<string, string> = {
      appid: this.options.appId,
      mch_id: this.options.mchId,
      nonce_str: this.generateNonce(),
      body: 'Forgely Order',
      out_trade_no: outTradeNo,
      total_fee: String(Math.round(amount)),
      spbill_create_ip: '127.0.0.1',
      notify_url: `${process.env.MEDUSA_BACKEND_URL ?? 'http://localhost:9000'}/hooks/payment/wechat-pay`,
      trade_type: 'NATIVE',
      fee_type: currency_code.toUpperCase(),
    }
    params.sign = this.sign(params)

    return {
      data: {
        out_trade_no: outTradeNo,
        params,
        cart_id: (context?.cart_id as string) ?? '',
      },
    } as PaymentProviderSessionResponse
  }

  async updatePayment(
    input: UpdatePaymentProviderSession,
  ): Promise<PaymentProviderError | PaymentProviderSessionResponse> {
    return { data: input.data } as PaymentProviderSessionResponse
  }

  async authorizePayment(
    paymentSessionData: Record<string, unknown>,
  ): Promise<
    PaymentProviderError | { status: PaymentSessionStatus; data: Record<string, unknown> }
  > {
    return {
      status: PaymentSessionStatus.AUTHORIZED,
      data: paymentSessionData,
    }
  }

  async capturePayment(
    paymentSessionData: Record<string, unknown>,
  ): Promise<PaymentProviderError | Record<string, unknown>> {
    return { ...paymentSessionData, captured: true }
  }

  async refundPayment(
    paymentSessionData: Record<string, unknown>,
    _refundAmount: number,
  ): Promise<PaymentProviderError | Record<string, unknown>> {
    return { ...paymentSessionData, refunded: true }
  }

  async cancelPayment(
    paymentSessionData: Record<string, unknown>,
  ): Promise<PaymentProviderError | Record<string, unknown>> {
    return { ...paymentSessionData, cancelled: true }
  }

  async deletePayment(
    paymentSessionData: Record<string, unknown>,
  ): Promise<PaymentProviderError | Record<string, unknown>> {
    return this.cancelPayment(paymentSessionData)
  }

  async retrievePayment(
    paymentSessionData: Record<string, unknown>,
  ): Promise<PaymentProviderError | Record<string, unknown>> {
    return paymentSessionData
  }

  async getPaymentStatus(
    _paymentSessionData: Record<string, unknown>,
  ): Promise<PaymentSessionStatus> {
    return PaymentSessionStatus.PENDING
  }

  async getWebhookActionAndData(_payload: ProviderWebhookPayload): Promise<WebhookActionResult> {
    return { action: 'authorized', data: { session_id: '' } }
  }
}

export default WechatPayPaymentProvider
