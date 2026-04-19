/**
 * `cms.*` router — Page CRUD for the user storefront.
 *
 * @owner W3 (backend API for T20/T22, W6)
 */

import type { User } from '@prisma/client'
import { z } from 'zod'

import { assertFoundAndOwned } from '../auth/index.js'
import type { prisma } from '../db.js'
import { errors } from '../errors.js'

import { protectedProcedure, router } from '../router/trpc.js'

import { IdSchema, PaginationInput, paginate } from './_shared.js'

const PageTypeSchema = z.enum(['page', 'blog', 'legal'])
const PageStatusSchema = z.enum(['draft', 'published', 'scheduled'])

const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/

const PageInput = z.object({
  siteId: IdSchema,
  type: PageTypeSchema,
  slug: z.string().toLowerCase().regex(SLUG_RE, 'Invalid slug'),
  title: z.string().trim().min(1).max(200),
  content: z.unknown(),
  featuredImage: z.string().url().optional(),
  seoTitle: z.string().max(200).optional(),
  seoDescription: z.string().max(500).optional(),
  seoKeywords: z.array(z.string().max(64)).max(20).default([]),
  status: PageStatusSchema.default('draft'),
  publishedAt: z.date().optional(),
  scheduledFor: z.date().optional(),
  author: z.string().max(80).optional(),
  tags: z.array(z.string().max(64)).max(20).default([]),
})

const ListInput = PaginationInput.extend({
  siteId: IdSchema,
  type: PageTypeSchema.optional(),
  status: PageStatusSchema.optional(),
})

const assertSiteOwnedByCaller = async (
  ctx: { prisma: typeof prisma; user: User },
  siteId: string,
): Promise<void> => {
  const site = await ctx.prisma.site.findUnique({
    where: { id: siteId },
    select: { id: true, userId: true },
  })
  assertFoundAndOwned(ctx, site, 'Site')
}

export const cmsRouter = router({
  list: protectedProcedure.input(ListInput).query(async ({ ctx, input }) => {
    await assertSiteOwnedByCaller(ctx, input.siteId)
    const limit = input.limit ?? 25
    const rows = await ctx.prisma.page.findMany({
      where: {
        siteId: input.siteId,
        ...(input.type ? { type: input.type } : {}),
        ...(input.status ? { status: input.status } : {}),
      },
      orderBy: { updatedAt: 'desc' },
      take: limit + 1,
      ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
    })
    return paginate(rows, limit)
  }),

  get: protectedProcedure
    .input(z.object({ siteId: IdSchema, id: IdSchema }))
    .query(async ({ ctx, input }) => {
      await assertSiteOwnedByCaller(ctx, input.siteId)
      const page = await ctx.prisma.page.findUnique({ where: { id: input.id } })
      if (!page || page.siteId !== input.siteId) throw errors.notFound('Page')
      return page
    }),

  create: protectedProcedure.input(PageInput).mutation(async ({ ctx, input }) => {
    await assertSiteOwnedByCaller(ctx, input.siteId)
    const conflict = await ctx.prisma.page.findUnique({
      where: { siteId_slug: { siteId: input.siteId, slug: input.slug } },
      select: { id: true },
    })
    if (conflict) throw errors.validation(`Slug "${input.slug}" already used.`)

    return ctx.prisma.page.create({
      data: {
        siteId: input.siteId,
        type: input.type,
        slug: input.slug,
        title: input.title,
        content: (input.content as object) ?? {},
        featuredImage: input.featuredImage ?? null,
        seoTitle: input.seoTitle ?? null,
        seoDescription: input.seoDescription ?? null,
        seoKeywords: input.seoKeywords,
        status: input.status,
        publishedAt: input.publishedAt ?? null,
        scheduledFor: input.scheduledFor ?? null,
        author: input.author ?? null,
        tags: input.tags,
      },
    })
  }),

  update: protectedProcedure
    .input(
      z.object({
        siteId: IdSchema,
        id: IdSchema,
        patch: PageInput.partial().omit({ siteId: true }),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await assertSiteOwnedByCaller(ctx, input.siteId)
      const existing = await ctx.prisma.page.findUnique({ where: { id: input.id } })
      if (!existing || existing.siteId !== input.siteId) throw errors.notFound('Page')

      const { content, ...rest } = input.patch
      return ctx.prisma.page.update({
        where: { id: input.id },
        data: {
          ...rest,
          ...(content !== undefined ? { content: (content as object) ?? {} } : {}),
        },
      })
    }),

  delete: protectedProcedure
    .input(z.object({ siteId: IdSchema, id: IdSchema }))
    .mutation(async ({ ctx, input }) => {
      await assertSiteOwnedByCaller(ctx, input.siteId)
      const existing = await ctx.prisma.page.findUnique({ where: { id: input.id } })
      if (!existing || existing.siteId !== input.siteId) throw errors.notFound('Page')
      await ctx.prisma.page.delete({ where: { id: input.id } })
      return { id: input.id }
    }),
})
