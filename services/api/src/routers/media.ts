/**
 * `media.*` router — uploads + library listing for MediaAsset.
 *
 * @owner W3 (backend API for T20, W6)
 */

import { z } from 'zod'

import { assertFoundAndOwned, ownedScopeWhere } from '../auth/index.js'

import { protectedProcedure, router } from '../router/trpc.js'

import { presignUpload } from './_storage.js'
import { IdSchema, PaginationInput, paginate } from './_shared.js'

const MediaTypeSchema = z.enum(['image', 'video', '3d_model', 'icon', 'audio'])
const MAX_UPLOAD_BYTES = 256 * 1024 * 1024

const ListInput = PaginationInput.extend({
  siteId: IdSchema.optional(),
  type: MediaTypeSchema.optional(),
})

const PresignInput = z.object({
  siteId: IdSchema.optional(),
  filename: z.string().trim().min(1).max(120),
  type: MediaTypeSchema,
  mimeType: z.string().trim().min(3).max(120),
  sizeBytes: z.number().int().positive().max(MAX_UPLOAD_BYTES),
})

const RegisterInput = z.object({
  key: z.string().min(1).max(512),
  publicUrl: z.string().url(),
  filename: z.string().trim().min(1).max(120),
  type: MediaTypeSchema,
  mimeType: z.string().trim().min(3).max(120),
  size: z.number().int().nonnegative().max(MAX_UPLOAD_BYTES),
  siteId: IdSchema.optional(),
  source: z.enum(['uploaded', 'ai_generated', 'library']).default('uploaded'),
  generator: z.string().max(64).optional(),
  prompt: z.string().max(2048).optional(),
  thumbnailUrl: z.string().url().optional(),
  dimensions: z.object({ width: z.number().int(), height: z.number().int() }).optional(),
  tags: z.array(z.string().max(64)).max(20).optional(),
})

export const mediaRouter = router({
  /** Library list, optionally filtered to a site or asset type. */
  list: protectedProcedure.input(ListInput.optional()).query(async ({ ctx, input }) => {
    const limit = input?.limit ?? 25
    const rows = await ctx.prisma.mediaAsset.findMany({
      where: {
        deletedAt: null,
        ...ownedScopeWhere(ctx),
        ...(input?.siteId ? { siteId: input.siteId } : {}),
        ...(input?.type ? { type: input.type } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(input?.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
    })
    return paginate(rows, limit)
  }),

  get: protectedProcedure.input(z.object({ id: IdSchema })).query(async ({ ctx, input }) => {
    const row = await ctx.prisma.mediaAsset.findUnique({ where: { id: input.id } })
    return assertFoundAndOwned(ctx, row, 'MediaAsset')
  }),

  /** Browser asks for a presigned R2 PUT, then PUTs the body, then calls register. */
  presign: protectedProcedure.input(PresignInput).mutation(async ({ ctx, input }) => {
    return presignUpload({
      userId: ctx.user.id,
      siteId: input.siteId ?? null,
      filename: input.filename,
      type: input.type,
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes,
    })
  }),

  /** Persist the MediaAsset row after the browser-side upload finishes. */
  register: protectedProcedure.input(RegisterInput).mutation(async ({ ctx, input }) => {
    const dimensions = input.dimensions ? input.dimensions : undefined
    return ctx.prisma.mediaAsset.create({
      data: {
        userId: ctx.user.id,
        siteId: input.siteId ?? null,
        type: input.type,
        url: input.publicUrl,
        thumbnailUrl: input.thumbnailUrl ?? null,
        filename: input.filename,
        size: input.size,
        mimeType: input.mimeType,
        source: input.source,
        generator: input.generator ?? null,
        prompt: input.prompt ?? null,
        tags: input.tags ?? [],
        dimensions: dimensions ?? undefined,
      },
    })
  }),

  /** Soft-delete (kept on R2 for 30 days then GC'd by a worker). */
  archive: protectedProcedure.input(z.object({ id: IdSchema })).mutation(async ({ ctx, input }) => {
    const row = await ctx.prisma.mediaAsset.findUnique({ where: { id: input.id } })
    const asset = assertFoundAndOwned(ctx, row, 'MediaAsset')
    return ctx.prisma.mediaAsset.update({
      where: { id: asset.id },
      data: { deletedAt: new Date() },
    })
  }),
})
