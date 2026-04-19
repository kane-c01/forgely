/**
 * `customers.*` router — site-scoped customer list/detail.
 *
 * Customers belong to Medusa (the e-commerce backend), not Forgely's User
 * table. Same tenant guard via Site.medusaSalesChannelId.
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

export const customersRouter = router({
  list: protectedProcedure.input(ListInput).query(async ({ ctx, input }) => {
    const salesChannelId = await resolveSalesChannel(ctx, input.siteId)
    return medusa.listCustomers({
      salesChannelId,
      limit: input.limit ?? 25,
      cursor: input.cursor,
      search: input.search,
    })
  }),

  get: protectedProcedure
    .input(z.object({ siteId: IdSchema, customerId: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      await resolveSalesChannel(ctx, input.siteId)
      const customer = await medusa.getCustomer(input.customerId)
      if (!customer) throw errors.notFound('Customer')
      return customer
    }),
})
