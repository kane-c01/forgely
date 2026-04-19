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

type PayPalOptions = {
  clientId: string
  clientSecret: string
  sandbox: boolean
}

class PayPalPaymentProvider extends AbstractPaymentProvider<PayPalOptions> {
  static identifier = 'paypal'
  private baseUrl: string

  constructor(container: Record<string, unknown>, options: PayPalOptions) {
    super(container, options)
    this.baseUrl = options.sandbox ? 'https://api-m.sandbox.paypal.com' : 'https://api-m.paypal.com'
  }

  private async getAccessToken(): Promise<string> {
    const { clientId, clientSecret } = this.options
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
    const res = await fetch(`${this.baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    })
    const data = (await res.json()) as { access_token: string }
    return data.access_token
  }

  private async apiCall(method: string, path: string, body?: unknown) {
    const token = await this.getAccessToken()
    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    })
    return res.json()
  }

  async initiatePayment(
    input: CreatePaymentProviderSession,
  ): Promise<PaymentProviderError | PaymentProviderSessionResponse> {
    const { amount, currency_code } = input
    const order = (await this.apiCall('POST', '/v2/checkout/orders', {
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: {
            currency_code: currency_code.toUpperCase(),
            value: (amount / 100).toFixed(2),
          },
        },
      ],
    })) as { id: string; status: string }
    return { data: { id: order.id, status: order.status } } as PaymentProviderSessionResponse
  }

  async updatePayment(
    input: UpdatePaymentProviderSession,
  ): Promise<PaymentProviderError | PaymentProviderSessionResponse> {
    const { amount, currency_code, data } = input
    await this.apiCall('PATCH', `/v2/checkout/orders/${data.id}`, [
      {
        op: 'replace',
        path: "/purchase_units/@reference_id=='default'/amount",
        value: {
          currency_code: currency_code.toUpperCase(),
          value: (amount / 100).toFixed(2),
        },
      },
    ])
    return { data: { id: data.id } } as PaymentProviderSessionResponse
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
    const result = (await this.apiCall(
      'POST',
      `/v2/checkout/orders/${paymentSessionData.id}/capture`,
    )) as { id: string; status: string }
    return { id: result.id, status: result.status }
  }

  async refundPayment(
    paymentSessionData: Record<string, unknown>,
    refundAmount: number,
  ): Promise<PaymentProviderError | Record<string, unknown>> {
    const captures = (paymentSessionData.captures as Array<{ id: string }>) ?? []
    const captureId = captures[0]?.id ?? paymentSessionData.capture_id
    if (!captureId) {
      return {
        error: 'No capture ID found',
        code: 'paypal_no_capture',
      } as unknown as PaymentProviderError
    }
    const result = (await this.apiCall('POST', `/v2/payments/captures/${captureId}/refund`, {
      amount: {
        value: (refundAmount / 100).toFixed(2),
        currency_code: 'USD',
      },
    })) as { id: string; status: string }
    return { refund_id: result.id, status: result.status }
  }

  async cancelPayment(
    paymentSessionData: Record<string, unknown>,
  ): Promise<PaymentProviderError | Record<string, unknown>> {
    return { id: paymentSessionData.id, status: 'VOIDED' }
  }

  async deletePayment(
    paymentSessionData: Record<string, unknown>,
  ): Promise<PaymentProviderError | Record<string, unknown>> {
    return this.cancelPayment(paymentSessionData)
  }

  async retrievePayment(
    paymentSessionData: Record<string, unknown>,
  ): Promise<PaymentProviderError | Record<string, unknown>> {
    const order = (await this.apiCall('GET', `/v2/checkout/orders/${paymentSessionData.id}`)) as {
      id: string
      status: string
    }
    return { id: order.id, status: order.status }
  }

  async getPaymentStatus(
    paymentSessionData: Record<string, unknown>,
  ): Promise<PaymentSessionStatus> {
    const order = (await this.retrievePayment(paymentSessionData)) as { status: string }
    switch (order.status) {
      case 'COMPLETED':
        return PaymentSessionStatus.AUTHORIZED
      case 'VOIDED':
        return PaymentSessionStatus.CANCELED
      default:
        return PaymentSessionStatus.PENDING
    }
  }

  async getWebhookActionAndData(_payload: ProviderWebhookPayload): Promise<WebhookActionResult> {
    return { action: 'not_supported' }
  }
}

export default PayPalPaymentProvider
