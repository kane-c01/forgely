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

type NowPaymentsOptions = {
  apiKey: string
  ipnSecret: string
  sandbox: boolean
}

/**
 * NOWPayments (crypto) provider for Medusa v2.
 * Wraps the NOWPayments API to accept BTC/ETH/USDT etc.
 */
class NowPaymentsPaymentProvider extends AbstractPaymentProvider<NowPaymentsOptions> {
  static identifier = 'nowpayments'
  private baseUrl: string

  constructor(container: Record<string, unknown>, options: NowPaymentsOptions) {
    super(container, options)
    this.baseUrl = options.sandbox
      ? 'https://api-sandbox.nowpayments.io/v1'
      : 'https://api.nowpayments.io/v1'
  }

  private async apiCall(method: string, path: string, body?: unknown) {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: {
        'x-api-key': this.options.apiKey,
        'Content-Type': 'application/json',
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    })
    return res.json()
  }

  async initiatePayment(
    input: CreatePaymentProviderSession,
  ): Promise<PaymentProviderError | PaymentProviderSessionResponse> {
    const { amount, currency_code, context } = input
    try {
      const payment = (await this.apiCall('POST', '/payment', {
        price_amount: (amount / 100).toFixed(2),
        price_currency: currency_code.toUpperCase(),
        pay_currency: 'btc',
        order_id: (context?.cart_id as string) ?? `forgely_${Date.now()}`,
        order_description: 'Forgely Order',
        ipn_callback_url: `${process.env.MEDUSA_BACKEND_URL ?? 'http://localhost:9000'}/hooks/payment/nowpayments`,
      })) as {
        payment_id: string
        payment_status: string
        pay_address: string
        pay_amount: number
        pay_currency: string
      }

      return {
        data: {
          payment_id: payment.payment_id,
          pay_address: payment.pay_address,
          pay_amount: payment.pay_amount,
          pay_currency: payment.pay_currency,
          status: payment.payment_status,
        },
      } as PaymentProviderSessionResponse
    } catch (err) {
      return {
        error: (err as Error).message,
        code: 'nowpayments_initiate_error',
      } as unknown as PaymentProviderError
    }
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
    const status = await this.getPaymentStatus(paymentSessionData)
    return { status, data: paymentSessionData }
  }

  async capturePayment(
    paymentSessionData: Record<string, unknown>,
  ): Promise<PaymentProviderError | Record<string, unknown>> {
    return { ...paymentSessionData, captured: true }
  }

  async refundPayment(
    _paymentSessionData: Record<string, unknown>,
    _refundAmount: number,
  ): Promise<PaymentProviderError | Record<string, unknown>> {
    return {
      error: 'Crypto refunds must be processed manually',
      code: 'nowpayments_manual_refund',
    } as unknown as PaymentProviderError
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
    const result = (await this.apiCall('GET', `/payment/${paymentSessionData.payment_id}`)) as {
      payment_status: string
    }
    return { ...paymentSessionData, status: result.payment_status }
  }

  async getPaymentStatus(
    paymentSessionData: Record<string, unknown>,
  ): Promise<PaymentSessionStatus> {
    try {
      const result = (await this.apiCall('GET', `/payment/${paymentSessionData.payment_id}`)) as {
        payment_status: string
      }
      switch (result.payment_status) {
        case 'finished':
        case 'confirmed':
          return PaymentSessionStatus.AUTHORIZED
        case 'expired':
        case 'failed':
          return PaymentSessionStatus.CANCELED
        default:
          return PaymentSessionStatus.PENDING
      }
    } catch {
      return PaymentSessionStatus.PENDING
    }
  }

  async getWebhookActionAndData(payload: ProviderWebhookPayload): Promise<WebhookActionResult> {
    const body = payload.rawData as string
    const sig = payload.headers['x-nowpayments-sig'] as string
    const hmac = crypto.createHmac('sha512', this.options.ipnSecret).update(body).digest('hex')
    if (hmac !== sig) {
      return { action: 'not_supported' }
    }
    const data = JSON.parse(body) as { payment_status: string; payment_id: string }
    if (data.payment_status === 'finished' || data.payment_status === 'confirmed') {
      return {
        action: 'authorized',
        data: { session_id: String(data.payment_id) },
      }
    }
    return { action: 'not_supported' }
  }
}

export default NowPaymentsPaymentProvider
