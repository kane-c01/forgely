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
import { recordAudit } from './super/_audit-log.js'

const SiteScopedListInput = PaginationInput.extend({
  siteId: IdSchema,
  search: z.string().trim().max(120).optional(),
})

const ScopedIdInput = z.object({
  siteId: IdSchema,
  productId: z.string().min(1),
})

/**
 * Shape of the patch accepted by `products.update`. We keep this
 * intentionally loose — unknown keys are ignored downstream — so Copilot
 * runners (which forward args verbatim from the assistant) cannot cause
 * zod validation failures for benign extensions like `_userConfirmed`.
 */
const ProductPatch = z
  .object({
    title: z.string().min(1).max(200).optional(),
    handle: z.string().min(1).max(120).optional(),
    status: z.enum(['draft', 'published']).optional(),
    priceUsd: z.number().int().nonnegative().max(10_000_000).optional(),
    /** Convenience: assistants often emit cents, mirror the UI. */
    priceCents: z.number().int().nonnegative().max(1_000_000_000).optional(),
    thumbnail: z.string().url().nullable().optional(),
  })
  .passthrough()

const UpdateProductInput = z.object({
  siteId: IdSchema,
  productId: z.string().min(1),
  patch: ProductPatch,
  /** Free-form trace — e.g. 'copilot.tool.update_product'. */
  reason: z.string().trim().max(280).optional(),
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

  /**
   * Tenant-scoped product mutation, used directly by the Copilot
   * `update_product` runner. The request flow is:
   *
   *   1. Site ownership + Medusa sales-channel check.
   *   2. Snapshot the "before" state so the audit row carries a real diff.
   *   3. Delegate to the Medusa adapter (stub in MVP, real SDK later).
   *   4. Append an AuditLog row tagged `copilot.tool.executed` so the
   *      audit filter in `/super/audit` can show exactly which AI
   *      interactions moved real data.
   *
   * Audit writes are wrapped in recordAudit's own try/catch, so a logging
   * failure can never roll back the product change.
   */
  update: protectedProcedure.input(UpdateProductInput).mutation(async ({ ctx, input }) => {
    await requireSalesChannel(ctx, input.siteId)

    const before = await medusa.getProduct(input.productId)
    if (!before) throw errors.notFound('Product')

    const patch = { ...input.patch }
    if (typeof patch.priceCents === 'number' && typeof patch.priceUsd !== 'number') {
      patch.priceUsd = Math.round(patch.priceCents / 100)
    }
    delete patch.priceCents

    const after = await medusa.updateProduct(input.productId, patch)

    await recordAudit(ctx, {
      action: 'copilot.tool.executed',
      targetType: 'product',
      targetId: input.productId,
      before: { title: before.title, priceUsd: before.priceUsd, status: before.status },
      after: { title: after.title, priceUsd: after.priceUsd, status: after.status },
      reason: input.reason ?? 'copilot.tool.update_product',
    })

    return after
  }),
})
