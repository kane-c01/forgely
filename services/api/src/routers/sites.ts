/**
 * `sites.*` tRPC router — user-owned brand sites.
 *
 * Multi-tenant safe via `assertFoundAndOwned`; super_admin can read across
 * tenants but each cross-tenant access writes an AuditLog row (added in T26).
 *
 * @owner W3 (backend API for T18, W6)
 */

import { z } from 'zod'

import { recordAuthAudit } from '../auth/audit.js'
import { assertFoundAndOwned, ownedScopeWhere } from '../auth/index.js'
import { errors } from '../errors.js'

import { protectedProcedure, router } from '../router/trpc.js'

import { IdSchema, PaginationInput, paginate } from './_shared.js'

const SUBDOMAIN_RE = /^[a-z][a-z0-9-]{1,30}[a-z0-9]$/

const SubdomainSchema = z
  .string()
  .toLowerCase()
  .min(3)
  .max(32)
  .regex(SUBDOMAIN_RE, 'Subdomain must be 3–32 chars, a–z 0–9 -, start with a letter')
  .refine((s) => !RESERVED_SUBDOMAINS.has(s), 'This subdomain is reserved.')

const RESERVED_SUBDOMAINS = new Set([
  'www',
  'app',
  'api',
  'super',
  'admin',
  'login',
  'signup',
  'mail',
  'docs',
  'help',
  'status',
  'static',
  'assets',
  'cdn',
  'forgely',
  'forge',
  'pricing',
  'about',
])

const SiteCreateInput = z.object({
  name: z.string().trim().min(1).max(80),
  subdomain: SubdomainSchema,
  sourceUrl: z.string().url().optional(),
})

const SiteUpdateInput = z.object({
  id: IdSchema,
  patch: z
    .object({
      name: z.string().trim().min(1).max(80).optional(),
      customDomain: z.string().trim().min(3).max(255).optional(),
      heroProductId: IdSchema.optional(),
      heroMomentType: z.string().trim().min(1).max(8).optional(),
      dnaId: z.string().trim().min(1).max(64).optional(),
    })
    .strict(),
})

const ListInput = PaginationInput.extend({
  status: z.enum(['draft', 'generating', 'published', 'suspended']).optional(),
})

export const sitesRouter = router({
  /** List sites for the active user (or all sites for super_admin). */
  list: protectedProcedure.input(ListInput.optional()).query(async ({ ctx, input }) => {
    const limit = input?.limit ?? 25
    const rows = await ctx.prisma.site.findMany({
      where: {
        deletedAt: null,
        ...ownedScopeWhere(ctx),
        ...(input?.status ? { status: input.status } : {}),
      },
      orderBy: { updatedAt: 'desc' },
      take: limit + 1,
      ...(input?.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
    })
    return paginate(rows, limit)
  }),

  /** Single site by id, with ownership enforcement. */
  get: protectedProcedure.input(z.object({ id: IdSchema })).query(async ({ ctx, input }) => {
    const site = await ctx.prisma.site.findUnique({ where: { id: input.id } })
    return assertFoundAndOwned(ctx, site, 'Site')
  }),

  /** Create a new draft site. Subdomain uniqueness enforced at the DB layer. */
  create: protectedProcedure.input(SiteCreateInput).mutation(async ({ ctx, input }) => {
    const taken = await ctx.prisma.site.findUnique({
      where: { subdomain: input.subdomain },
      select: { id: true },
    })
    if (taken) {
      throw errors.validation(`Subdomain "${input.subdomain}" is already taken.`, {
        subdomain: 'taken',
      })
    }

    const site = await ctx.prisma.site.create({
      data: {
        userId: ctx.user.id,
        name: input.name,
        subdomain: input.subdomain,
        sourceUrl: input.sourceUrl ?? null,
        status: 'draft',
      },
    })
    return site
  }),

  /** Patch metadata. Status/dsl changes go through their own endpoints. */
  update: protectedProcedure.input(SiteUpdateInput).mutation(async ({ ctx, input }) => {
    const existing = await ctx.prisma.site.findUnique({ where: { id: input.id } })
    assertFoundAndOwned(ctx, existing, 'Site')

    return ctx.prisma.site.update({
      where: { id: input.id },
      data: input.patch,
    })
  }),

  /** Soft-delete (`deletedAt`) — keeps generations / billing history intact. */
  archive: protectedProcedure
    .input(z.object({ id: IdSchema, reason: z.string().max(280).optional() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.site.findUnique({ where: { id: input.id } })
      const site = assertFoundAndOwned(ctx, existing, 'Site')

      await ctx.prisma.site.update({
        where: { id: site.id },
        data: { deletedAt: new Date(), status: 'suspended' },
      })

      await recordAuthAudit({
        actorId: ctx.user.id,
        action: 'auth.signout', // placeholder — replaced by 'sites.archive' once T26 expands the action enum
        targetType: 'site',
        targetId: site.id,
        before: { status: site.status },
        reason: input.reason,
      })

      return { id: site.id, archivedAt: new Date() }
    }),

  /**
   * Cheap availability check for the signup wizard. Public-readable so we
   * can surface "username taken" feedback before the user even clicks
   * Submit (no PII leak: just confirms subdomain reservation).
   */
  isSubdomainAvailable: protectedProcedure
    .input(z.object({ subdomain: SubdomainSchema }))
    .query(async ({ ctx, input }) => {
      const existing = await ctx.prisma.site.findUnique({
        where: { subdomain: input.subdomain },
        select: { id: true },
      })
      return { available: !existing, reserved: RESERVED_SUBDOMAINS.has(input.subdomain) }
    }),
})

/** Exported so other routers can re-validate subdomains. */
export const isReservedSubdomain = (s: string): boolean => RESERVED_SUBDOMAINS.has(s.toLowerCase())

export const SUBDOMAIN_REGEX = SUBDOMAIN_RE
