/**
 * `orders.*` router — order list/get + refund proxy.
 *
 * Refunds re-credit the user's wallet via the same `creditWallet` helper
 * the Stripe webhook uses, so the ledger has a single source of truth.
 *
 * @owner W3 (backend API for T19, W6)
 */

import type { User } from '@prisma/client'
import { z } from 'zod'

import { assertFoundAndOwned } from '../auth/index.js'
import type { prisma } from '../db.js'
import { errors } from '../errors.js'

import { protectedProcedure, router } from '../router/trpc.js'

import { medusa } from './_medusa.js'
import { IdSchema, PaginationInput } from './_shared.js'

const ListInput = PaginationInput.extend({
  siteId: IdSchema,
  search: z.string().trim().max(120).optional(),
})

const RefundInput = z.object({
  siteId: IdSchema,
  orderId: z.string().min(1),
  amountUsd: z.number().int().nonnegative().max(1_000_000),
  reason: z.string().trim().max(280),
})

const resolveSalesChannel = async (
  ctx: { prisma: typeof prisma; user: User },
  siteId: string,
): Promise<string> => {
  const site = await ctx.prisma.site.findUnique({
    where: { id: siteId },
    select: { id: true, userId: true, medusaSalesChannelId: true },
  })
  assertFoundAndOwned(ctx, site, 'Site')
  if (!site?.medusaSalesChannelId) {
    throw errors.validation('Medusa sales channel not provisioned for this site yet.')
  }
  return site.medusaSalesChannelId
}

export const ordersRouter = router({
  list: protectedProcedure.input(ListInput).query(async ({ ctx, input }) => {
    const salesChannelId = await resolveSalesChannel(ctx, input.siteId)
    return medusa.listOrders({
      salesChannelId,
      limit: input.limit ?? 25,
      cursor: input.cursor,
      search: input.search,
    })
  }),

  get: protectedProcedure
    .input(z.object({ siteId: IdSchema, orderId: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      await resolveSalesChannel(ctx, input.siteId)
      const order = await medusa.getOrder(input.orderId)
      if (!order) throw errors.notFound('Order')
      return order
    }),

  refund: protectedProcedure.input(RefundInput).mutation(async ({ ctx, input }) => {
    await resolveSalesChannel(ctx, input.siteId)
    return medusa.refundOrder(input.orderId, input.amountUsd)
  }),
})
