/**
 * Stripe webhook endpoint — verifies signature + dispatches to W3's
 * `handleStripeWebhook`, which:
 *   - inserts StripeEventLog (idempotent on stripeEventId)
 *   - dispatches checkout.session.completed → credits grant
 *   - dispatches invoice.payment_succeeded → monthly renewal credits
 *   - dispatches customer.subscription.{created,updated,deleted} → Subscription upsert
 *   - dispatches charge.refunded → refund clawback
 *
 * @owner W4 — payments real
 */
import { NextResponse, type NextRequest } from 'next/server'

import { handleStripeWebhook } from '@forgely/api/stripe'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: NextRequest): Promise<NextResponse> {
  const signature = request.headers.get('stripe-signature')
  const rawBody = await request.text()

  try {
    const outcome = await handleStripeWebhook(rawBody, signature)
    return NextResponse.json(outcome, {
      status: outcome.status === 'failed' ? 202 : 200,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[stripe-webhook] failed', { message })
    return NextResponse.json({ error: 'invalid_webhook', message }, { status: 400 })
  }
}
