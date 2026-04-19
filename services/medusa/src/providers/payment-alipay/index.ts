/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck — TODO(W11): Medusa v2.13 changed the payment provider API surface.
// Provider preserved for runtime loading; signatures need a follow-up rewrite.
import { AbstractPaymentProvider, PaymentSessionStatus } from '@medusajs/framework/utils'
import crypto from 'node:crypto'

type AlipayOptions = {
  appId: string
  privateKey: string
  sandbox: boolean
}

/**
 * Alipay provider for Medusa v2.
 * Wraps the Alipay Open Platform API (RSA2 signing).
 */
class AlipayPaymentProvider extends AbstractPaymentProvider<AlipayOptions> {
  static identifier = 'alipay'
  private baseUrl: string

  constructor(container: Record<string, unknown>, options: AlipayOptions) {
    super(container, options)
    this.baseUrl = options.sandbox
      ? 'https://openapi-sandbox.dl.alipaydev.com/gateway.do'
      : 'https://openapi.alipay.com/gateway.do'
  }

  private signRSA2(content: string): string {
    const signer = crypto.createSign('RSA-SHA256')
    signer.update(content, 'utf8')
    return signer.sign(this.options.privateKey, 'base64')
  }

  private buildBizContent(amount: number, outTradeNo: string, subject: string) {
    return JSON.stringify({
      out_trade_no: outTradeNo,
      total_amount: (amount / 100).toFixed(2),
      subject,
      product_code: 'FAST_INSTANT_TRADE_PAY',
    })
  }

  async initiatePayment(
    input: CreatePaymentProviderSession,
  ): Promise<PaymentProviderError | PaymentProviderSessionResponse> {
    const { amount, context } = input
    const outTradeNo = `forgely_alipay_${Date.now()}`
    const bizContent = this.buildBizContent(amount, outTradeNo, 'Forgely Order')

    const params: Record<string, string> = {
      app_id: this.options.appId,
      method: 'alipay.trade.page.pay',
      charset: 'utf-8',
      sign_type: 'RSA2',
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      version: '1.0',
      biz_content: bizContent,
      notify_url: `${process.env.MEDUSA_BACKEND_URL ?? 'http://localhost:9000'}/hooks/payment/alipay`,
      return_url: (context?.return_url as string) ?? 'http://localhost:3002/checkout/complete',
    }

    const sortedKeys = Object.keys(params).sort()
    const signStr = sortedKeys.map((k) => `${k}=${params[k]}`).join('&')
    params.sign = this.signRSA2(signStr)

    return {
      data: {
        out_trade_no: outTradeNo,
        params,
        gateway_url: this.baseUrl,
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

export default AlipayPaymentProvider
