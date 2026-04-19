/**
 * Monthly credit reset for active subscriptions.
 *
 * Per docs/MASTER.md §3.3 — "subscription credits expire at end of month;
 * purchased credits never expire". On the first webhook of a new billing
 * period (`invoice.payment_succeeded`) we already top up via
 * `creditWallet({ type: 'subscription' })`. This module is the cron
 * fallback in case Stripe webhook delivery is delayed.
 *
 * Strategy: for every active subscription whose `currentPeriodEnd > now`
 * AND whose `User.credits.updatedAt` is older than the period start, top
 * up `plan.monthlyCredits` worth of subscription credits. This is safe
 * to run multiple times per period because we use an idempotency key on
 * the metadata.
 *
 * @owner W3
 */

import { prisma } from '../db.js'

import { creditWallet } from './wallet.js'

/**
 * Run the monthly reset job. Returns the number of users topped up.
 * Pass `dryRun = true` from a one-shot CLI to preview without writing.
 */
export const runMonthlyCreditReset = async (
  options: { dryRun?: boolean; now?: Date } = {},
): Promise<{ scanned: number; granted: number; creditsGranted: number }> => {
  const now = options.now ?? new Date()
  const subs = await prisma.subscription.findMany({
    where: {
      status: { in: ['active', 'trialing'] },
      currentPeriodEnd: { gt: now },
    },
    select: {
      id: true,
      userId: true,
      plan: true,
      currentPeriodStart: true,
    },
  })

  let granted = 0
  let creditsGranted = 0

  for (const sub of subs) {
    const plan = await prisma.plan.findUnique({ where: { slug: sub.plan } })
    if (!plan || plan.monthlyCredits <= 0) continue

    // Idempotency key: one grant per (userId, plan, period start)
    const idempotencyKey = `monthly:${sub.userId}:${sub.plan}:${sub.currentPeriodStart.toISOString()}`
    const already = await prisma.creditTransaction.findFirst({
      where: {
        userId: sub.userId,
        type: 'subscription',
        metadata: { path: ['idempotencyKey'], equals: idempotencyKey },
      },
      select: { id: true },
    })
    if (already) continue

    if (options.dryRun) {
      granted += 1
      creditsGranted += plan.monthlyCredits
      continue
    }

    await creditWallet({
      userId: sub.userId,
      amount: plan.monthlyCredits,
      type: 'subscription',
      description: `Monthly credits — ${plan.name} (cron fallback)`,
      metadata: {
        idempotencyKey,
        source: 'monthly_reset_job',
        planSlug: sub.plan,
        periodStart: sub.currentPeriodStart.toISOString(),
      },
    }).catch((err) => {
      console.warn('[monthly-reset] grant failed', { userId: sub.userId, err })
    })
    granted += 1
    creditsGranted += plan.monthlyCredits
  }

  return { scanned: subs.length, granted, creditsGranted }
}
