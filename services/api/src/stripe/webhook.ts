/**
 * Stripe webhook receiver.
 *
 * Public surface: a single `handleStripeWebhook(rawBody, signature)` that:
 *   1. Verifies the signature with `STRIPE_WEBHOOK_SECRET`.
 *   2. Inserts a `StripeEventLog` row keyed on `event.id` for idempotency
 *      — duplicate deliveries become no-ops.
 *   3. Dispatches to per-type handlers covering the 5 webhooks called out
 *      in `docs/MASTER.md` §3.8:
 *        - checkout.session.completed
 *        - invoice.payment_succeeded
 *        - invoice.payment_failed
 *        - customer.subscription.updated / customer.subscription.deleted
 *        - charge.refunded
 *
 * @owner W3 (T24)
 */

import type Stripe from 'stripe'
import type { Prisma } from '@prisma/client'

import { Prisma as PrismaNS, prisma } from '../db.js'
import { ForgelyError, isForgelyError } from '../errors.js'
import { creditWallet } from '../credits/wallet.js'

import { getStripe, getWebhookSecret } from './client.js'
import { resolveUserByStripeCustomer } from './customers.js'

export interface WebhookOutcome {
  eventId: string
  type: string
  status: 'processed' | 'duplicate' | 'ignored' | 'failed'
  message?: string
}

const upsertEventLog = async (event: Stripe.Event): Promise<{ alreadyProcessed: boolean }> => {
  try {
    await prisma.stripeEventLog.create({
      data: {
        stripeEventId: event.id,
        type: event.type,
        apiVersion: event.api_version ?? null,
        livemode: event.livemode,
        payload: event as unknown as Prisma.InputJsonValue,
      },
    })
    return { alreadyProcessed: false }
  } catch (err) {
    const code = (err as { code?: string }).code
    if (code === 'P2002') return { alreadyProcessed: true }
    throw err
  }
}

const markEventStatus = async (
  stripeEventId: string,
  status: 'processed' | 'failed',
  error?: string,
): Promise<void> => {
  await prisma.stripeEventLog
    .update({
      where: { stripeEventId },
      data: {
        status,
        processedAt: new Date(),
        error: error ?? null,
        attempts: { increment: 1 },
      },
    })
    .catch(() => undefined)
}

// ─── Per-type handlers ────────────────────────────────────────────────────

const handleCheckoutCompleted = async (event: Stripe.Event): Promise<string> => {
  const session = event.data.object as Stripe.Checkout.Session
  const kind = session.metadata?.forgelyKind

  if (kind === 'credit_pack') {
    const userId = session.metadata?.forgelyUserId ?? session.client_reference_id
    const packageSlug = session.metadata?.forgelyPackageSlug
    if (!userId || !packageSlug) return 'credit_pack_missing_metadata'

    const pkg = await prisma.creditsPackage.findUnique({ where: { slug: packageSlug } })
    if (!pkg) return 'credit_pack_unknown'

    const total = pkg.credits + pkg.bonusCredits
    await creditWallet({
      userId,
      amount: total,
      type: 'purchase',
      description: `Credit pack purchase — ${pkg.name} (${pkg.credits}+${pkg.bonusCredits})`,
      stripeEventId: event.id,
      stripeChargeId:
        typeof session.payment_intent === 'string' ? session.payment_intent : undefined,
      metadata: {
        packageSlug,
        sessionId: session.id,
      },
    })
    return 'credit_pack_granted'
  }

  if (kind === 'subscription') {
    // The substantive subscription state lives in customer.subscription.created
    // / .updated, both of which fire alongside this event. This handler only
    // grants the first month's credits.
    const userId = session.metadata?.forgelyUserId ?? session.client_reference_id
    const planSlug = session.metadata?.forgelyPlanSlug
    if (!userId || !planSlug) return 'subscription_missing_metadata'

    const plan = await prisma.plan.findUnique({ where: { slug: planSlug } })
    if (!plan) return 'subscription_plan_unknown'
    if (plan.monthlyCredits <= 0) return 'subscription_no_credits_to_grant'

    await creditWallet({
      userId,
      amount: plan.monthlyCredits,
      type: 'subscription',
      description: `Subscription bonus credits — ${plan.name}`,
      stripeEventId: event.id,
      metadata: { planSlug, sessionId: session.id, source: 'checkout.session.completed' },
    })
    return 'subscription_initial_credits_granted'
  }

  return 'checkout_unknown_kind'
}

const handleInvoicePaymentSucceeded = async (event: Stripe.Event): Promise<string> => {
  const invoice = event.data.object as Stripe.Invoice
  // Only act on recurring subscription invoices (skip the first one — credits
  // are granted by checkout.session.completed to avoid double-grant).
  if (!invoice.subscription || invoice.billing_reason === 'subscription_create') {
    return 'invoice_skipped_first_or_one_off'
  }
  if (typeof invoice.customer !== 'string') return 'invoice_missing_customer'

  const user = await resolveUserByStripeCustomer(invoice.customer)
  if (!user) return 'invoice_unknown_customer'

  const subscriptionRow = await prisma.subscription.findUnique({
    where: { userId: user.id },
  })
  if (!subscriptionRow) return 'invoice_no_subscription_record'

  const plan = await prisma.plan.findUnique({ where: { slug: subscriptionRow.plan } })
  if (!plan || plan.monthlyCredits <= 0) return 'invoice_plan_no_credits'

  await creditWallet({
    userId: user.id,
    amount: plan.monthlyCredits,
    type: 'subscription',
    description: `Monthly renewal credits — ${plan.name}`,
    stripeEventId: event.id,
    metadata: {
      invoiceId: invoice.id,
      subscriptionId: invoice.subscription,
      planSlug: plan.slug,
    },
  })
  return 'invoice_renewal_credits_granted'
}

const handleInvoicePaymentFailed = async (event: Stripe.Event): Promise<string> => {
  const invoice = event.data.object as Stripe.Invoice
  if (typeof invoice.customer !== 'string') return 'failed_invoice_missing_customer'
  const user = await resolveUserByStripeCustomer(invoice.customer)
  if (!user) return 'failed_invoice_unknown_customer'

  await prisma.auditLog
    .create({
      data: {
        actorType: 'system',
        actorId: 'stripe',
        action: 'billing.invoice_payment_failed',
        targetType: 'user',
        targetId: user.id,
        before: PrismaNS.JsonNull,
        after: { invoiceId: invoice.id, attempt: invoice.attempt_count } as Prisma.InputJsonValue,
        ipAddress: '',
        userAgent: '',
      },
    })
    .catch(() => undefined)

  return 'failed_invoice_logged'
}

const handleSubscriptionUpsert = async (event: Stripe.Event): Promise<string> => {
  const sub = event.data.object as Stripe.Subscription
  if (typeof sub.customer !== 'string') return 'sub_missing_customer'

  const user = await resolveUserByStripeCustomer(sub.customer)
  if (!user) return 'sub_unknown_customer'

  const planSlug =
    (sub.metadata?.forgelyPlanSlug as string | undefined) ??
    (
      await prisma.plan.findFirst({
        where: {
          OR: [
            { stripePriceMonthlyId: sub.items.data[0]?.price.id },
            { stripePriceYearlyId: sub.items.data[0]?.price.id },
          ],
        },
        select: { slug: true },
      })
    )?.slug
  if (!planSlug) return 'sub_unknown_plan'

  const cadence = sub.items.data[0]?.price.recurring?.interval === 'year' ? 'yearly' : 'monthly'

  const data = {
    userId: user.id,
    plan: planSlug,
    status: sub.status,
    stripeSubscriptionId: sub.id,
    stripePriceId: sub.items.data[0]?.price.id ?? '',
    cadence,
    currentPeriodStart: new Date(sub.current_period_start * 1000),
    currentPeriodEnd: new Date(sub.current_period_end * 1000),
    cancelAtPeriodEnd: sub.cancel_at_period_end,
    trialEndsAt: sub.trial_end ? new Date(sub.trial_end * 1000) : null,
    canceledAt: sub.canceled_at ? new Date(sub.canceled_at * 1000) : null,
  }

  await prisma.subscription.upsert({
    where: { userId: user.id },
    create: data,
    update: data,
  })

  await prisma.user.update({
    where: { id: user.id },
    data: { plan: sub.status === 'active' || sub.status === 'trialing' ? planSlug : 'free' },
  })

  return `sub_upserted:${sub.status}`
}

const handleSubscriptionDeleted = async (event: Stripe.Event): Promise<string> => {
  const sub = event.data.object as Stripe.Subscription
  if (typeof sub.customer !== 'string') return 'sub_del_missing_customer'
  const user = await resolveUserByStripeCustomer(sub.customer)
  if (!user) return 'sub_del_unknown_customer'

  await prisma.subscription
    .updateMany({
      where: { stripeSubscriptionId: sub.id },
      data: { status: 'canceled', canceledAt: new Date() },
    })
    .catch(() => undefined)

  await prisma.user.update({
    where: { id: user.id },
    data: { plan: 'free' },
  })

  return 'sub_canceled'
}

const handleChargeRefunded = async (event: Stripe.Event): Promise<string> => {
  const charge = event.data.object as Stripe.Charge
  if (!charge.refunded) return 'charge_not_actually_refunded'
  if (typeof charge.customer !== 'string') return 'refund_missing_customer'

  const user = await resolveUserByStripeCustomer(charge.customer)
  if (!user) return 'refund_unknown_customer'

  // Look for the original purchase in our ledger via `stripeChargeId`.
  const original = await prisma.creditTransaction.findFirst({
    where: { stripeChargeId: charge.id, type: 'purchase' },
  })
  if (!original) return 'refund_no_matching_purchase'

  await creditWallet({
    userId: user.id,
    amount: -original.amount, // turn the original positive amount into a negative refund row…
    type: 'refund',
    description: `Refund for charge ${charge.id}`,
    stripeEventId: event.id,
    stripeChargeId: charge.id,
    metadata: { originalTransactionId: original.id },
  }).catch(async (err) => {
    // creditWallet enforces positive integers; for a true clawback we need
    // to log + decrement balance directly.
    void err
    const wallet = await prisma.userCredits.findUnique({ where: { userId: user.id } })
    if (!wallet) return
    const clawback = Math.min(wallet.balance, original.amount)
    if (clawback <= 0) return
    await prisma.$transaction(async (tx) => {
      const updated = await tx.userCredits.update({
        where: { userId: user.id },
        data: { balance: { decrement: clawback }, version: { increment: 1 } },
      })
      await tx.creditTransaction.create({
        data: {
          userId: user.id,
          type: 'refund',
          amount: -clawback,
          balance: updated.balance,
          description: `Refund clawback for charge ${charge.id}`,
          stripeEventId: event.id,
          stripeChargeId: charge.id,
          metadata: { originalTransactionId: original.id } as Prisma.InputJsonValue,
        },
      })
    })
  })

  return 'refund_processed'
}

const DISPATCH: Record<string, (e: Stripe.Event) => Promise<string>> = {
  'checkout.session.completed': handleCheckoutCompleted,
  'invoice.payment_succeeded': handleInvoicePaymentSucceeded,
  'invoice.payment_failed': handleInvoicePaymentFailed,
  'customer.subscription.created': handleSubscriptionUpsert,
  'customer.subscription.updated': handleSubscriptionUpsert,
  'customer.subscription.deleted': handleSubscriptionDeleted,
  'charge.refunded': handleChargeRefunded,
}

/** Parse + verify the Stripe webhook payload and dispatch. */
export const handleStripeWebhook = async (
  rawBody: string | Buffer,
  signature: string | null | undefined,
): Promise<WebhookOutcome> => {
  if (!signature) {
    throw new ForgelyError('STRIPE_WEBHOOK_INVALID', 'Missing Stripe-Signature header.', 400)
  }

  const stripe = getStripe()
  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, getWebhookSecret())
  } catch (err) {
    throw new ForgelyError('STRIPE_WEBHOOK_INVALID', 'Invalid Stripe webhook signature.', 400, {
      cause: err instanceof Error ? err.message : String(err),
    })
  }

  const log = await upsertEventLog(event)
  if (log.alreadyProcessed) {
    return { eventId: event.id, type: event.type, status: 'duplicate' }
  }

  const handler = DISPATCH[event.type]
  if (!handler) {
    await markEventStatus(event.id, 'processed', 'no_handler')
    return { eventId: event.id, type: event.type, status: 'ignored' }
  }

  try {
    const message = await handler(event)
    await markEventStatus(event.id, 'processed', message)
    return { eventId: event.id, type: event.type, status: 'processed', message }
  } catch (err) {
    const errorMessage = isForgelyError(err)
      ? err.getUserMessage('en')
      : err instanceof Error
        ? err.message
        : String(err)
    await markEventStatus(event.id, 'failed', errorMessage)
    return { eventId: event.id, type: event.type, status: 'failed', message: errorMessage }
  }
}

/**
 * Verify a webhook signature and return the parsed event without dispatching
 * — used by tests and admin "replay" tooling.
 */
export const verifyWebhookSignature = (
  rawBody: string | Buffer,
  signature: string,
): Stripe.Event => {
  return getStripe().webhooks.constructEvent(rawBody, signature, getWebhookSecret())
}
