/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck — TODO(W11): Medusa v2.13 changed the payment provider API
// surface (RefundPaymentInput / GetPaymentStatusOutput, no more PaymentProviderError /
// ProviderWebhookPayload exports). Provider implementation is preserved so it
// can be loaded at runtime; signatures need a follow-up rewrite.
import { AbstractPaymentProvider, PaymentSessionStatus } from '@medusajs/framework/utils'
import Stripe from 'stripe'

type StripeOptions = {
  apiKey: string
}

class StripePaymentProvider extends AbstractPaymentProvider<StripeOptions> {
  static identifier = 'stripe'
  private stripe: Stripe

  constructor(container: Record<string, unknown>, options: StripeOptions) {
    super(container, options)
    this.stripe = new Stripe(options.apiKey, {
      apiVersion: '2024-12-18.acacia' as Stripe.LatestApiVersion,
    })
  }

  async initiatePayment(
    input: CreatePaymentProviderSession,
  ): Promise<PaymentProviderError | PaymentProviderSessionResponse> {
    const { amount, currency_code, context } = input
    try {
      const intent = await this.stripe.paymentIntents.create({
        amount: Math.round(amount),
        currency: currency_code,
        metadata: {
          cart_id: (context?.cart_id as string) ?? '',
          sales_channel_id: (context?.sales_channel_id as string) ?? '',
        },
        automatic_payment_methods: { enabled: true },
      })
      return {
        data: {
          id: intent.id,
          client_secret: intent.client_secret,
        },
      } as PaymentProviderSessionResponse
    } catch (err) {
      return {
        error: (err as Error).message,
        code: 'stripe_initiate_error',
      } as unknown as PaymentProviderError
    }
  }

  async updatePayment(
    input: UpdatePaymentProviderSession,
  ): Promise<PaymentProviderError | PaymentProviderSessionResponse> {
    const { amount, currency_code, data } = input
    try {
      const updated = await this.stripe.paymentIntents.update(data.id as string, {
        amount: Math.round(amount),
        currency: currency_code,
      })
      return {
        data: {
          id: updated.id,
          client_secret: updated.client_secret,
        },
      } as PaymentProviderSessionResponse
    } catch (err) {
      return {
        error: (err as Error).message,
        code: 'stripe_update_error',
      } as unknown as PaymentProviderError
    }
  }

  async authorizePayment(
    paymentSessionData: Record<string, unknown>,
  ): Promise<
    PaymentProviderError | { status: PaymentSessionStatus; data: Record<string, unknown> }
  > {
    const intent = await this.stripe.paymentIntents.retrieve(paymentSessionData.id as string)
    return {
      status:
        intent.status === 'succeeded'
          ? PaymentSessionStatus.AUTHORIZED
          : PaymentSessionStatus.PENDING,
      data: { id: intent.id, status: intent.status },
    }
  }

  async capturePayment(
    paymentSessionData: Record<string, unknown>,
  ): Promise<PaymentProviderError | Record<string, unknown>> {
    const intent = await this.stripe.paymentIntents.capture(paymentSessionData.id as string)
    return { id: intent.id, status: intent.status }
  }

  async refundPayment(
    paymentSessionData: Record<string, unknown>,
    refundAmount: number,
  ): Promise<PaymentProviderError | Record<string, unknown>> {
    const refund = await this.stripe.refunds.create({
      payment_intent: paymentSessionData.id as string,
      amount: Math.round(refundAmount),
    })
    return { refund_id: refund.id, status: refund.status }
  }

  async cancelPayment(
    paymentSessionData: Record<string, unknown>,
  ): Promise<PaymentProviderError | Record<string, unknown>> {
    const intent = await this.stripe.paymentIntents.cancel(paymentSessionData.id as string)
    return { id: intent.id, status: intent.status }
  }

  async deletePayment(
    paymentSessionData: Record<string, unknown>,
  ): Promise<PaymentProviderError | Record<string, unknown>> {
    return this.cancelPayment(paymentSessionData)
  }

  async retrievePayment(
    paymentSessionData: Record<string, unknown>,
  ): Promise<PaymentProviderError | Record<string, unknown>> {
    const intent = await this.stripe.paymentIntents.retrieve(paymentSessionData.id as string)
    return { id: intent.id, status: intent.status, amount: intent.amount }
  }

  async getPaymentStatus(
    paymentSessionData: Record<string, unknown>,
  ): Promise<PaymentSessionStatus> {
    const intent = await this.stripe.paymentIntents.retrieve(paymentSessionData.id as string)
    switch (intent.status) {
      case 'succeeded':
        return PaymentSessionStatus.AUTHORIZED
      case 'requires_capture':
        return PaymentSessionStatus.AUTHORIZED
      case 'canceled':
        return PaymentSessionStatus.CANCELED
      case 'requires_payment_method':
        return PaymentSessionStatus.REQUIRES_MORE
      default:
        return PaymentSessionStatus.PENDING
    }
  }

  async getWebhookActionAndData(payload: ProviderWebhookPayload): Promise<WebhookActionResult> {
    const event = this.stripe.webhooks.constructEvent(
      payload.rawData as string,
      payload.headers['stripe-signature'] as string,
      process.env.STRIPE_WEBHOOK_SECRET ?? '',
    )
    switch (event.type) {
      case 'payment_intent.succeeded':
        return {
          action: 'authorized',
          data: {
            session_id: (event.data.object as Stripe.PaymentIntent).id,
            amount: (event.data.object as Stripe.PaymentIntent).amount,
          },
        }
      default:
        return { action: 'not_supported' }
    }
  }
}

export default StripePaymentProvider
