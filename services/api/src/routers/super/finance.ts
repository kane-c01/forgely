/**
 * /super > Finance tRPC sub-router. OWNER only.
 */

// `../../trpc` is provided by W3 / T06.
import { router, superAdminProcedure } from '../../trpc'
import { TRPCError } from '@trpc/server'
import { assertCan } from './_acl'
import { recordAudit, SUPER_ACTIONS } from './_audit-log'
import { paginationSchema, refundActionInput } from './_schemas'

export const superFinanceRouter = router({
  overview: superAdminProcedure.query(async ({ ctx }) => {
    assertCan(ctx.session.role, 'finance.read')
    const [mrr, refundsPending, payouts] = await Promise.all([
      ctx.billing.computeMrr(),
      ctx.prisma.refund.count({ where: { status: 'queued' } }),
      ctx.stripe.payouts.list({ limit: 10 }),
    ])
    return {
      mrr,
      arr: mrr * 12,
      refundsPending,
      payouts: payouts.data,
    }
  }),

  payouts: superAdminProcedure.input(paginationSchema).query(async ({ ctx, input }) => {
    assertCan(ctx.session.role, 'finance.read')
    const list = await ctx.stripe.payouts.list({ limit: input.pageSize })
    return { rows: list.data, total: list.data.length, page: input.page, pageSize: input.pageSize }
  }),

  creditTransactions: superAdminProcedure.input(paginationSchema).query(async ({ ctx, input }) => {
    assertCan(ctx.session.role, 'finance.read')
    const [rows, total] = await Promise.all([
      ctx.prisma.creditTransaction.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (input.page - 1) * input.pageSize,
        take: input.pageSize,
        include: { user: { select: { email: true } } },
      }),
      ctx.prisma.creditTransaction.count(),
    ])
    return { rows, total, page: input.page, pageSize: input.pageSize }
  }),

  refunds: superAdminProcedure.input(paginationSchema).query(async ({ ctx, input }) => {
    assertCan(ctx.session.role, 'finance.read')
    const [rows, total] = await Promise.all([
      ctx.prisma.refund.findMany({
        orderBy: { requestedAt: 'desc' },
        skip: (input.page - 1) * input.pageSize,
        take: input.pageSize,
        include: { user: { select: { email: true } } },
      }),
      ctx.prisma.refund.count(),
    ])
    return { rows, total, page: input.page, pageSize: input.pageSize }
  }),

  decideRefund: superAdminProcedure.input(refundActionInput).mutation(async ({ ctx, input }) => {
    assertCan(ctx.session.role, 'finance.refund.decide')
    const refund = await ctx.prisma.refund.findUnique({ where: { id: input.refundId } })
    if (!refund) throw new TRPCError({ code: 'NOT_FOUND' })
    if (refund.status !== 'queued') {
      throw new TRPCError({ code: 'CONFLICT', message: 'Refund is not queued' })
    }
    const nextStatus = input.decision === 'approve' ? 'approved' : 'rejected'
    const updated = await ctx.prisma.refund.update({
      where: { id: input.refundId },
      data: { status: nextStatus, decidedAt: new Date(), decidedBy: ctx.session.userId },
    })
    if (input.decision === 'approve') {
      await ctx.stripe.refunds.create({
        payment_intent: refund.paymentIntentId,
        amount: refund.amountUsd * 100,
        reason: 'requested_by_customer',
      })
    }
    await recordAudit(ctx, {
      action: SUPER_ACTIONS.SUBSCRIPTION_REFUND,
      targetType: 'refund',
      targetId: input.refundId,
      before: { status: refund.status },
      after: { status: updated.status, decision: input.decision },
      reason: input.reason,
    })
    return { ok: true as const, status: updated.status }
  }),
})

export type SuperFinanceRouter = typeof superFinanceRouter
