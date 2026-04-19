/**
 * /super > Finance tRPC sub-router. OWNER only.
 *
 * Real implementation backed by:
 *   - `Subscription` table for MRR / ARR
 *   - `Refund` table for the operator queue
 *   - `CreditTransaction` table for the rolling credit ledger
 *   - Stripe SDK (via `services/api/src/stripe/client.ts`) for payouts +
 *     refund execution
 *
 * When Stripe is not yet configured (no `STRIPE_SECRET_KEY` in env), the
 * external calls degrade gracefully — the router still returns DB-derived
 * data and `status: 'stripe_not_configured'` for the relevant fields.
 */
import { TRPCError } from '@trpc/server'

import { router, superAdminProcedure } from '../../router/trpc.js'
import { getStripe, isStripeConfigured } from '../../stripe/client.js'
import { assertCan } from './_acl.js'
import { recordAudit, SUPER_ACTIONS } from './_audit-log.js'
import { paginationSchema, refundActionInput } from './_schemas.js'

/**
 * Plan price book in USD cents — single source of truth for MRR maths.
 * Mirrors the actual Stripe Price catalogue. Override per-row through
 * `Subscription.metadata` if a customer is on a custom price.
 */
const PLAN_MONTHLY_CENTS: Record<string, number> = {
  starter: 2_900,
  pro: 9_900,
  agency: 29_900,
  enterprise: 99_900,
}

function monthlyCents(plan: string, cadence: string): number {
  const base = PLAN_MONTHLY_CENTS[plan] ?? 0
  // Yearly subscriptions are billed once but recognised monthly for MRR.
  return cadence === 'yearly' ? Math.round(base * 0.8) : base
}

export const superFinanceRouter = router({
  overview: superAdminProcedure.query(async ({ ctx }) => {
    assertCan(ctx.user?.role, 'finance.read')

    const activeSubs = await ctx.prisma.subscription.findMany({
      where: { status: { in: ['active', 'trialing'] } },
      select: { plan: true, cadence: true },
    })
    const mrrCents = activeSubs.reduce((sum, s) => sum + monthlyCents(s.plan, s.cadence), 0)
    const refundsPending = await ctx.prisma.refund.count({ where: { status: 'queued' } })

    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const last30Net = await ctx.prisma.creditTransaction.aggregate({
      _sum: { amount: true },
      where: {
        type: { in: ['purchase', 'subscription'] },
        createdAt: { gte: since },
      },
    })

    let payouts: Array<{ id: string; amount: number; arrival_date: number; status: string }> = []
    let payoutsStatus: 'ok' | 'stripe_not_configured' | 'stripe_error' = 'ok'
    if (isStripeConfigured()) {
      try {
        const list = await getStripe().payouts.list({ limit: 5 })
        payouts = list.data.map((p) => ({
          id: p.id,
          amount: p.amount,
          arrival_date: p.arrival_date,
          status: p.status,
        }))
      } catch (err) {
        // eslint-disable-next-line no-console -- Sentry wired by W3.
        console.error('[super/finance] stripe.payouts.list failed', err)
        payoutsStatus = 'stripe_error'
      }
    } else {
      payoutsStatus = 'stripe_not_configured'
    }

    return {
      mrr: Math.round(mrrCents / 100),
      arr: Math.round((mrrCents * 12) / 100),
      activeSubscriptions: activeSubs.length,
      refundsPending,
      netRevenue30dCredits: last30Net._sum.amount ?? 0,
      payouts,
      payoutsStatus,
    }
  }),

  payouts: superAdminProcedure.input(paginationSchema).query(async ({ ctx, input }) => {
    assertCan(ctx.user?.role, 'finance.read')
    if (!isStripeConfigured()) {
      return {
        items: [] as Array<{ id: string; amount: number; arrival_date: number; status: string }>,
        nextCursor: null as string | null,
        status: 'stripe_not_configured' as const,
      }
    }
    try {
      const list = await getStripe().payouts.list({ limit: input.pageSize })
      return {
        items: list.data.map((p) => ({
          id: p.id,
          amount: p.amount,
          arrival_date: p.arrival_date,
          status: p.status,
        })),
        nextCursor: list.has_more ? (list.data[list.data.length - 1]?.id ?? null) : null,
        status: 'ok' as const,
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[super/finance] payouts.list failed', err)
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Stripe payouts unavailable' })
    }
  }),

  refundsQueue: superAdminProcedure.input(paginationSchema).query(async ({ ctx, input }) => {
    assertCan(ctx.user?.role, 'finance.read')
    const where = { status: 'queued' as const }
    const [items, total] = await Promise.all([
      ctx.prisma.refund.findMany({
        where,
        orderBy: { createdAt: 'asc' },
        skip: (input.page - 1) * input.pageSize,
        take: input.pageSize,
      }),
      ctx.prisma.refund.count({ where }),
    ])
    return { items, total, page: input.page, pageSize: input.pageSize }
  }),

  creditLedger: superAdminProcedure.input(paginationSchema).query(async ({ ctx, input }) => {
    assertCan(ctx.user?.role, 'finance.read')
    const [items, total] = await Promise.all([
      ctx.prisma.creditTransaction.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (input.page - 1) * input.pageSize,
        take: input.pageSize,
      }),
      ctx.prisma.creditTransaction.count(),
    ])
    return { items, total, page: input.page, pageSize: input.pageSize }
  }),

  approveRefund: superAdminProcedure.input(refundActionInput).mutation(async ({ ctx, input }) => {
    assertCan(ctx.user?.role, 'finance.refund.decide')
    const refund = await ctx.prisma.refund.findUnique({ where: { id: input.refundId } })
    if (!refund) throw new TRPCError({ code: 'NOT_FOUND' })
    if (refund.status !== 'queued') {
      throw new TRPCError({ code: 'CONFLICT', message: 'Refund is not queued' })
    }

    // 1. Mark approved (intermediate state — `completed` only after the
    //    external provider confirms).
    await ctx.prisma.refund.update({
      where: { id: input.refundId },
      data: { status: 'approved' },
    })

    // 2. Hit the provider — degrade gracefully when not configured.
    let externalId: string | null = null
    let finalStatus: 'completed' | 'approved' | 'failed' = 'approved'
    if (refund.provider === 'stripe' && isStripeConfigured() && refund.externalId) {
      try {
        const r = await getStripe().refunds.create({
          charge: refund.externalId,
          amount: refund.amountCents,
          reason: 'requested_by_customer',
        })
        externalId = r.id
        finalStatus = 'completed'
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[super/finance] stripe refund failed', err)
        finalStatus = 'failed'
      }
    } else if (refund.provider !== 'stripe') {
      // wechat / alipay / manual — operator handles externally and
      // marks `completed` later via a follow-up call.
      finalStatus = 'approved'
    }

    const final = await ctx.prisma.refund.update({
      where: { id: input.refundId },
      data: {
        status: finalStatus,
        externalId: externalId ?? refund.externalId,
        processedAt: finalStatus === 'completed' ? new Date() : null,
      },
    })

    await recordAudit(ctx, {
      action: SUPER_ACTIONS.SUBSCRIPTION_REFUND,
      targetType: 'refund',
      targetId: input.refundId,
      before: { status: refund.status },
      after: { status: final.status, externalId: final.externalId },
      reason: input.reason,
    })

    return { ok: true as const, status: final.status, externalId: final.externalId }
  }),

  denyRefund: superAdminProcedure.input(refundActionInput).mutation(async ({ ctx, input }) => {
    assertCan(ctx.user?.role, 'finance.refund.decide')
    const refund = await ctx.prisma.refund.findUnique({ where: { id: input.refundId } })
    if (!refund) throw new TRPCError({ code: 'NOT_FOUND' })
    if (refund.status !== 'queued') {
      throw new TRPCError({ code: 'CONFLICT', message: 'Refund is not queued' })
    }
    const denied = await ctx.prisma.refund.update({
      where: { id: input.refundId },
      data: { status: 'denied', processedAt: new Date() },
    })
    await recordAudit(ctx, {
      action: SUPER_ACTIONS.SUBSCRIPTION_REFUND,
      targetType: 'refund',
      targetId: input.refundId,
      before: { status: refund.status },
      after: { status: denied.status },
      reason: input.reason,
    })
    return { ok: true as const, status: denied.status }
  }),
})

export type SuperFinanceRouter = typeof superFinanceRouter
