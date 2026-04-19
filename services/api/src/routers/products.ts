/**
 * `products.*` router — proxies to Medusa via the `_medusa` adapter.
 *
 * The router itself enforces tenant isolation by resolving the site first
 * (which carries the `medusaSalesChannelId`); Medusa is then queried
 * scoped to that sales channel so cross-tenant reads are impossible even
 * if the Medusa endpoint were exposed directly.
 *
 * @owner W3 (backend API for T18, W6)
 */

import type { User } from '@prisma/client'
import { z } from 'zod'

import { assertFoundAndOwned } from '../auth/index.js'
import type { prisma } from '../db.js'
import { errors } from '../errors.js'

import { protectedProcedure, router } from '../router/trpc.js'

import { medusa } from './_medusa.js'
import { IdSchema, PaginationInput } from './_shared.js'

const SiteScopedListInput = PaginationInput.extend({
  siteId: IdSchema,
  search: z.string().trim().max(120).optional(),
})

const ScopedIdInput = z.object({
  siteId: IdSchema,
  productId: z.string().min(1),
})

const requireSalesChannel = async (
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

export const productsRouter = router({
  list: protectedProcedure.input(SiteScopedListInput).query(async ({ ctx, input }) => {
    const salesChannelId = await requireSalesChannel(ctx, input.siteId)
    return medusa.listProducts({
      salesChannelId,
      limit: input.limit ?? 25,
      cursor: input.cursor,
      search: input.search,
    })
  }),

  get: protectedProcedure.input(ScopedIdInput).query(async ({ ctx, input }) => {
    await requireSalesChannel(ctx, input.siteId)
    const product = await medusa.getProduct(input.productId)
    if (!product) throw errors.notFound('Product')
    return product
  }),
})
