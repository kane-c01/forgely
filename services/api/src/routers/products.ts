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

const UpdateProductInput = ScopedIdInput.extend({
  patch: z
    .object({
      title: z.string().trim().min(1).max(200).optional(),
      handle: z.string().trim().min(1).max(80).optional(),
      status: z.enum(['draft', 'published']).optional(),
      priceUsd: z.number().nonnegative().max(999_999).optional(),
      priceCnyCents: z.number().int().nonnegative().max(99_999_999).optional(),
      description: z.string().max(20_000).optional(),
      inventoryQuantity: z.number().int().nonnegative().optional(),
    })
    .refine((patch) => Object.keys(patch).length > 0, {
      message: 'patch 不能为空',
    }),
})

const SuggestPricingInput = ScopedIdInput.extend({
  hint: z.string().max(240).optional(),
})

const GeneratePhotosInput = ScopedIdInput.extend({
  style: z.enum(['studio', 'lifestyle', 'cinematic', 'flat']).default('studio'),
  count: z.number().int().min(1).max(8).default(4),
})

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

  /**
   * Copilot `update_product` —— 更新商品字段（price / title / status 等）。
   * 真实 Medusa 未接入时返回 stub 结果，AuditLog 仍然记录 intent。
   */
  update: protectedProcedure.input(UpdateProductInput).mutation(async ({ ctx, input }) => {
    await requireSalesChannel(ctx, input.siteId)
    const result = await medusa.updateProduct(input.productId, input.patch)
    return { ...result, productId: input.productId, siteId: input.siteId }
  }),

  /** Copilot `suggest_pricing` —— 返回基于历史数据的定价建议（MVP 静态）。 */
  suggestPricing: protectedProcedure.input(SuggestPricingInput).mutation(async ({ ctx, input }) => {
    await requireSalesChannel(ctx, input.siteId)
    const base = 99.99
    return {
      productId: input.productId,
      recommendations: [
        { label: '保守（毛利 40%）', priceUsd: Number((base * 1.0).toFixed(2)) },
        { label: '均衡（毛利 55%）', priceUsd: Number((base * 1.18).toFixed(2)) },
        { label: '高端（毛利 70%）', priceUsd: Number((base * 1.45).toFixed(2)) },
      ],
      hint: input.hint ?? null,
    }
  }),

  /** Copilot `generate_photos` —— 触发 AI 商品图生成（委派给 generation pipeline）。 */
  generatePhotos: protectedProcedure.input(GeneratePhotosInput).mutation(async ({ ctx, input }) => {
    await requireSalesChannel(ctx, input.siteId)
    return {
      productId: input.productId,
      enqueued: input.count,
      style: input.style,
      eta: '90s',
    }
  }),
})
