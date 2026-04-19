/**
 * `super.finance.*` and `super.credits.*` — read-only finance metrics +
 * super-admin credit-balance ops.
 *
 * Designed to be merged into W7's `superRouter` like:
 *
 * ```ts
 * import { superFinanceRouter, superCreditsRouter } from
 *   '@forgely/api/routers/super-finance';
 * router({ ...other, finance: superFinanceRouter, credits: superCreditsRouter })
 * ```
 *
 * @owner W3 (backend support for T26, W7)
 */

import { z } from 'zod'

import { recordAudit } from '../auth/audit.js'
import { creditWallet, getOrCreateWallet, listTransactions } from '../credits/index.js'
import { prisma } from '../db.js'
import { errors } from '../errors.js'

import { router, superAdminProcedure } from '../router/trpc.js'

import { IdSchema } from './_shared.js'

const RangeInput = z.object({
  /** ISO-8601 day, e.g. '2026-04-19'. Defaults: last 30d. */
  from: z.string().date().optional(),
  to: z.string().date().optional(),
})

const dayBoundary = (s: string | undefined, fallback: Date): Date =>
  s ? new Date(`${s}T00:00:00.000Z`) : fallback

export const superFinanceRouter = router({
  /**
   * Headline metrics — purchases / subscription credits granted / refunds /
   * MRR proxy in the requested range. All amounts are USD cents on the
   * `priceUsd` side, integers on the credits side.
   */
  overview: superAdminProcedure.input(RangeInput.optional()).query(async ({ input }) => {
    const to = dayBoundary(input?.to, new Date())
    const from = dayBoundary(input?.from, new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000))

    const [purchases, subs, refunds, activeSubs] = await Promise.all([
      prisma.creditTransaction.aggregate({
        where: { type: 'purchase', createdAt: { gte: from, lt: to } },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.creditTransaction.aggregate({
        where: { type: 'subscription', createdAt: { gte: from, lt: to } },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.creditTransaction.aggregate({
        where: { type: 'refund', createdAt: { gte: from, lt: to } },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.subscription.count({
        where: { status: { in: ['active', 'trialing'] } },
      }),
    ])

    return {
      window: { from, to },
      purchases: {
        creditsGranted: purchases._sum.amount ?? 0,
        transactions: purchases._count,
      },
      subscriptionCredits: {
        creditsGranted: subs._sum.amount ?? 0,
        transactions: subs._count,
      },
      refunds: {
        creditsClawedBack: refunds._sum.amount ?? 0,
        transactions: refunds._count,
      },
      activeSubscriptions: activeSubs,
    }
  }),

  /** Per-plan subscription counts for the dashboard. */
  subscriptionsByPlan: superAdminProcedure.query(async () => {
    const grouped = await prisma.subscription.groupBy({
      by: ['plan', 'status'],
      _count: true,
    })
    return grouped
  }),

  /** Webhook health — last 100 Stripe events grouped by status. */
  recentStripeEvents: superAdminProcedure
    .input(z.object({ limit: z.number().int().min(1).max(200).optional() }).optional())
    .query(async ({ input }) => {
      const limit = input?.limit ?? 50
      return prisma.stripeEventLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: {
          id: true,
          stripeEventId: true,
          type: true,
          livemode: true,
          status: true,
          attempts: true,
          processedAt: true,
          createdAt: true,
          error: true,
        },
      })
    }),
})

const ManualGrantInput = z.object({
  userId: IdSchema,
  amount: z.number().int().positive().max(1_000_000),
  reason: z.string().trim().min(3).max(280),
})

const ListTxInput = z.object({
  userId: IdSchema,
  limit: z.number().int().min(1).max(100).optional(),
  cursor: z.string().optional(),
})

export const superCreditsRouter = router({
  /** Current wallet for any user (cross-tenant — recorded in AuditLog). */
  wallet: superAdminProcedure
    .input(z.object({ userId: IdSchema }))
    .query(async ({ ctx, input }) => {
      const wallet = await getOrCreateWallet(input.userId)
      await recordAudit({
        actorId: ctx.user.id,
        actorType: 'super_admin',
        action: 'super.tenant_data_read',
        targetType: 'wallet',
        targetId: input.userId,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
      })
      return wallet
    }),

  /** Recent ledger rows for one user. */
  history: superAdminProcedure.input(ListTxInput).query(async ({ ctx, input }) => {
    const list = await listTransactions(input)
    await recordAudit({
      actorId: ctx.user.id,
      actorType: 'super_admin',
      action: 'super.tenant_data_read',
      targetType: 'credit_ledger',
      targetId: input.userId,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    })
    return list
  }),

  /** Manual credits grant (gift / customer-service make-good). */
  grant: superAdminProcedure.input(ManualGrantInput).mutation(async ({ ctx, input }) => {
    const target = await prisma.user.findUnique({
      where: { id: input.userId },
      select: { id: true },
    })
    if (!target) throw errors.notFound('User')

    const result = await creditWallet({
      userId: input.userId,
      amount: input.amount,
      type: 'gift',
      description: `Manual grant by super admin: ${input.reason}`,
      metadata: { grantedBy: ctx.user.id, reason: input.reason },
    })

    await recordAudit({
      actorId: ctx.user.id,
      actorType: 'super_admin',
      action: 'credits.adjustment',
      targetType: 'wallet',
      targetId: input.userId,
      after: { amount: input.amount, newBalance: result.balance },
      reason: input.reason,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    })

    return result
  }),

  /** Manual clawback (refund / abuse). Negative-side counterpart of `grant`. */
  clawback: superAdminProcedure.input(ManualGrantInput).mutation(async ({ ctx, input }) => {
    const wallet = await getOrCreateWallet(input.userId)
    const amount = Math.min(wallet.balance, input.amount)
    if (amount <= 0) {
      throw errors.validation('User has no spendable balance to claw back.')
    }

    await prisma.$transaction(async (tx) => {
      const updated = await tx.userCredits.update({
        where: { userId: input.userId },
        data: { balance: { decrement: amount }, version: { increment: 1 } },
      })
      await tx.creditTransaction.create({
        data: {
          userId: input.userId,
          type: 'adjustment',
          amount: -amount,
          balance: updated.balance,
          description: `Manual clawback by super admin: ${input.reason}`,
          metadata: { actorId: ctx.user.id, reason: input.reason },
        },
      })
    })

    await recordAudit({
      actorId: ctx.user.id,
      actorType: 'super_admin',
      action: 'credits.adjustment',
      targetType: 'wallet',
      targetId: input.userId,
      after: { amount: -amount },
      reason: input.reason,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    })

    return { clawedBack: amount }
  }),
})
