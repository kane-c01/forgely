/**
 * /super > Finance tRPC sub-router. OWNER only.
 *
 * Currently a stub — Stripe integration + Refund table land alongside
 * the dedicated billing-platform Task. UI receives empty payloads so
 * dashboards render their "loading state" instead of crashing.
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

export const superFinanceRouter = router({
  overview: superAdminProcedure.query(async () => ({
    mrr: 0,
    arr: 0,
    refundsPending: 0,
    payouts: [] as Array<{ id: string; amount: number; arrival_date: number }>,
  })),

  payouts: superAdminProcedure.input(paginationSchema).query(async () => ({
    items: [] as Array<{ id: string; amount: number; arrival_date: number }>,
    nextCursor: null as string | null,
  })),

  refundsQueue: superAdminProcedure.input(paginationSchema).query(async () => ({
    items: [] as Array<{ id: string; status: string; amountCents: number; reason: string | null }>,
    nextCursor: null as string | null,
  })),

  approveRefund: superAdminProcedure
    .input(refundActionInput)
    .mutation(async () => NOT_IMPLEMENTED()),

  denyRefund: superAdminProcedure
    .input(refundActionInput)
    .mutation(async () => NOT_IMPLEMENTED()),
})

export type SuperFinanceRouter = typeof superFinanceRouter
