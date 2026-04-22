/**
 * /super > Finance tRPC sub-router. OWNER only.
 *
 * Aggregates billing-adjacent data straight from Prisma so the /super
 * finance dashboard can render live numbers (MRR, ARR, net-revenue,
 * refund queue, credit activity) without depending on Stripe's async
 * reporting APIs. Values are best-effort — Stripe invoice sync lands in
 * a follow-up task.
 */
import { TRPCError } from '@trpc/server'

import { router, superAdminProcedure } from '../../router/trpc.js'
import { paginationSchema, refundActionInput } from './_schemas'

const NOT_IMPLEMENTED = (): never => {
  throw new TRPCError({
    code: 'METHOD_NOT_SUPPORTED',
    message: 'Finance ops are wired to the live Stripe account in the next deploy.',
  })
}

const PLAN_PRICE_USD: Record<string, number> = {
  starter: 29,
  pro: 99,
  business: 299,
}

export const superFinanceRouter = router({
  /**
   * Live mrr / arr / net-revenue / refundsPending snapshot.
   *
   * Returns the same shape as `apps/app/lib/super/types.ts::FinanceSnapshot`
   * so the /super/finance page can consume rows directly.
   */
  overview: superAdminProcedure.query(async ({ ctx }) => {
    const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    const [activeSubs, recentPurchases, recentRefunds, pendingRefunds, recentTxns] =
      await Promise.all([
        ctx.prisma.subscription.findMany({
          where: { status: 'active' },
          select: { plan: true, user: { select: { id: true, email: true } } },
        }),
        ctx.prisma.creditTransaction.aggregate({
          where: { createdAt: { gte: since30d }, type: 'purchase' },
          _sum: { amount: true },
        }),
        ctx.prisma.creditTransaction.aggregate({
          where: { createdAt: { gte: since30d }, type: 'refund' },
          _sum: { amount: true },
        }),
        ctx.prisma.creditTransaction.findMany({
          where: { type: 'refund' },
          orderBy: { createdAt: 'desc' },
          take: 12,
          include: { user: { select: { id: true, email: true } } },
        }),
        ctx.prisma.creditTransaction.findMany({
          orderBy: { createdAt: 'desc' },
          take: 12,
          include: { user: { select: { id: true, email: true } } },
        }),
      ])

    const mrr = activeSubs.reduce((sum, s) => sum + (PLAN_PRICE_USD[s.plan] ?? 0), 0)
    const arr = mrr * 12
    const netRevenue30d =
      Math.round((recentPurchases._sum.amount ?? 0) / 100) -
      Math.round(Math.abs(recentRefunds._sum.amount ?? 0) / 100)

    const refunds = pendingRefunds.map((r) => ({
      id: r.id,
      userId: r.userId,
      userEmail: r.user?.email ?? r.userId,
      amountUsd: Math.round(Math.abs(r.amount) / 100),
      reason: r.description ?? 'Refund',
      status: 'completed' as const,
      requestedAt: r.createdAt.getTime(),
      ageHours: Math.round((Date.now() - r.createdAt.getTime()) / 3_600_000),
    }))

    const creditTransactions = recentTxns.map((t) => ({
      id: t.id,
      userId: t.userId,
      userEmail: t.user?.email ?? t.userId,
      type: (t.type === 'monthly_reset'
        ? 'monthly_reset'
        : t.type === 'grant'
          ? 'grant'
          : t.type === 'refund'
            ? 'refund'
            : t.type === 'purchase'
              ? 'purchase'
              : 'consumption') as 'consumption' | 'purchase' | 'refund' | 'grant' | 'monthly_reset',
      amount: t.amount,
      balanceAfter: t.balance,
      occurredAt: t.createdAt.getTime(),
      description: t.description ?? t.type,
    }))

    return {
      mrr,
      arr,
      netRevenue30d,
      refundsPending: 0, // Stripe sync pending — refunds shown are `completed`.
      payouts: [] as Array<{
        id: string
        amountUsd: number
        status: 'paid' | 'pending' | 'failed' | 'in_transit'
        arrivalDate: number
        bankLast4: string
      }>,
      creditTransactions,
      refunds,
      generatedAt: Date.now(),
    }
  }),

  payouts: superAdminProcedure.input(paginationSchema).query(async () => ({
    items: [] as Array<{
      id: string
      amountUsd: number
      status: 'paid' | 'pending' | 'failed' | 'in_transit'
      arrivalDate: number
      bankLast4: string
    }>,
    nextCursor: null as string | null,
  })),

  refundsQueue: superAdminProcedure.input(paginationSchema).query(async ({ ctx, input }) => {
    const refunds = await ctx.prisma.creditTransaction.findMany({
      where: { type: 'refund' },
      orderBy: { createdAt: 'desc' },
      skip: (input.page - 1) * input.pageSize,
      take: input.pageSize,
    })
    return {
      items: refunds.map((r) => ({
        id: r.id,
        status: 'completed',
        amountCents: Math.abs(r.amount),
        reason: r.description ?? null,
      })),
      nextCursor: null as string | null,
    }
  }),

  approveRefund: superAdminProcedure
    .input(refundActionInput)
    .mutation(async () => NOT_IMPLEMENTED()),

  denyRefund: superAdminProcedure.input(refundActionInput).mutation(async () => NOT_IMPLEMENTED()),
})

export type SuperFinanceRouter = typeof superFinanceRouter
