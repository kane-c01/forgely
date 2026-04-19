/**
 * `brandKits.*` router — per-user (and optionally per-site) brand kits.
 *
 * @owner W3 (backend API for T20, W6)
 */

import { z } from 'zod'

import { assertFoundAndOwned, ownedScopeWhere } from '../auth/index.js'
import { errors } from '../errors.js'

import { protectedProcedure, router } from '../router/trpc.js'

import { IdSchema } from './_shared.js'

const ColorsSchema = z
  .object({
    primary: z.string().regex(/^#[0-9a-fA-F]{6,8}$/),
    accent: z.string().regex(/^#[0-9a-fA-F]{6,8}$/),
    bg: z.string().regex(/^#[0-9a-fA-F]{6,8}$/),
    muted: z
      .string()
      .regex(/^#[0-9a-fA-F]{6,8}$/)
      .optional(),
  })
  .strict()

const FontsSchema = z
  .object({
    display: z.string().min(1).max(80),
    heading: z.string().min(1).max(80).optional(),
    body: z.string().min(1).max(80),
    mono: z.string().min(1).max(80).optional(),
  })
  .strict()

const VoiceSchema = z
  .object({
    tone: z.array(z.string().max(40)).max(8),
    avoid: z.array(z.string().max(40)).max(8).optional(),
  })
  .strict()

const ImageStyleSchema = z
  .object({
    mood: z.string().max(120).optional(),
    palette: z.array(z.string().max(40)).max(8).optional(),
    cameraLanguage: z.string().max(120).optional(),
  })
  .strict()

const BrandKitInput = z.object({
  name: z.string().trim().min(1).max(80),
  siteId: IdSchema.optional(),
  logoPrimary: z.string().url().optional(),
  logoVariants: z.array(z.string().url()).max(20).default([]),
  colors: ColorsSchema,
  fonts: FontsSchema,
  voice: VoiceSchema,
  imageStyle: ImageStyleSchema,
})

const BrandKitPatch = BrandKitInput.partial()

export const brandKitsRouter = router({
  list: protectedProcedure
    .input(z.object({ siteId: IdSchema.optional() }).optional())
    .query(async ({ ctx, input }) => {
      return ctx.prisma.brandKit.findMany({
        where: {
          ...ownedScopeWhere(ctx),
          ...(input?.siteId ? { siteId: input.siteId } : {}),
        },
        orderBy: { updatedAt: 'desc' },
      })
    }),

  get: protectedProcedure.input(z.object({ id: IdSchema })).query(async ({ ctx, input }) => {
    const row = await ctx.prisma.brandKit.findUnique({ where: { id: input.id } })
    return assertFoundAndOwned(ctx, row, 'BrandKit')
  }),

  create: protectedProcedure.input(BrandKitInput).mutation(async ({ ctx, input }) => {
    if (input.siteId) {
      const taken = await ctx.prisma.brandKit.findUnique({ where: { siteId: input.siteId } })
      if (taken) {
        throw errors.validation('This site already has a brand kit; update the existing one.')
      }
    }

    return ctx.prisma.brandKit.create({
      data: {
        userId: ctx.user.id,
        siteId: input.siteId ?? null,
        name: input.name,
        logoPrimary: input.logoPrimary ?? null,
        logoVariants: input.logoVariants,
        colors: input.colors,
        fonts: input.fonts,
        voice: input.voice,
        imageStyle: input.imageStyle,
      },
    })
  }),

  update: protectedProcedure
    .input(z.object({ id: IdSchema, patch: BrandKitPatch }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.brandKit.findUnique({ where: { id: input.id } })
      assertFoundAndOwned(ctx, existing, 'BrandKit')
      return ctx.prisma.brandKit.update({
        where: { id: input.id },
        data: input.patch as Record<string, unknown>,
      })
    }),

  delete: protectedProcedure.input(z.object({ id: IdSchema })).mutation(async ({ ctx, input }) => {
    const row = await ctx.prisma.brandKit.findUnique({ where: { id: input.id } })
    const kit = assertFoundAndOwned(ctx, row, 'BrandKit')
    await ctx.prisma.brandKit.delete({ where: { id: kit.id } })
    return { id: kit.id }
  }),
})
