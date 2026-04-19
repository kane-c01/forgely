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

/**
 * Cron contract for the worker layer.  We schedule daily at UTC 00:05 and
 * the function bails out on non-1st days, so the job is safe to put on a
 * `0 5 * * *` (UTC) schedule and still produce the "first of the month"
 * semantics.
 */
export const MONTHLY_CREDIT_RESET_CRON = '5 0 * * *'

/**
 * Calendar-aware wrapper. Only invokes `runMonthlyCreditReset` when `now`
 * is on the 1st of the month (UTC). On any other day it returns
 * `{ skipped: true }` so cron-driven invocations are no-ops.
 *
 * The function-side idempotency key (per `currentPeriodStart`) means even
 * if the wrapper is bypassed and the job runs twice on the 1st, no user
 * gets double credits.
 */
export const runMonthlyCreditResetIfDue = async (
  options: { dryRun?: boolean; now?: Date } = {},
): Promise<
  | { skipped: true; reason: string }
  | { skipped: false; scanned: number; granted: number; creditsGranted: number }
> => {
  const now = options.now ?? new Date()
  if (now.getUTCDate() !== 1) {
    return { skipped: true, reason: `not the 1st of the month (utc day = ${now.getUTCDate()})` }
  }
  const result = await runMonthlyCreditReset(options)
  return { skipped: false, ...result }
}
