/**
 * Prisma multi-tenant middleware.
 *
 * Forgely's tenancy model:
 *
 *   - Each `User` is a tenant root.
 *   - Tenant-scoped tables either carry `userId` directly (Site, BrandKit,
 *     MediaAsset, Generation, AiConversation, Subscription, UserCredits,
 *     CreditTransaction, CreditReservation, ScrapeHistory, TeamMember,
 *     Refund) or are reachable via a `siteId` whose Site belongs to the
 *     tenant (ThemeVersion, Page, InstalledPlugin, ComplianceRecord,
 *     GenerationStep).
 *
 *   - Catalog tables (`VisualDNA`, `CreditsPackage`, `Plan`, `Coupon`) are
 *     global and never get a tenant filter.
 *
 *   - Audit / system tables (`AuditLog`, `LoginEvent`, `StripeEventLog`,
 *     `RateLimitWindow`, `Waitlist`, `ScraperRule`, `Account`, `Session`,
 *     `VerificationToken`, `PasswordResetToken`, `User`, `WechatAccount`,
 *     `PhoneOtp`) are intentionally NOT auto-scoped — RBAC + targeted
 *     `where: { userId }` clauses guard them.
 *
 * Usage:
 *
 *   import { runWithTenant, attachTenantMiddleware } from '@forgely/api/db'
 *
 *   attachTenantMiddleware(prisma)   // call once at process startup
 *
 *   await runWithTenant({ userId: ctx.user.id }, async () => {
 *     return prisma.site.findMany()  // automatically scoped
 *   })
 *
 * Operators / cron jobs that legitimately need cross-tenant reads should
 * use `runWithBypass(...)` (writes an audit log row up-stack).
 *
 * @owner W3 (Sprint 3)
 */

import { AsyncLocalStorage } from 'node:async_hooks'

import { Prisma, type PrismaClient } from '@prisma/client'

interface TenantContext {
  /** When set, every USER_SCOPED model is auto-filtered by `userId`. */
  userId?: string
  /** When set, every SITE_SCOPED model is auto-filtered by `siteId`. */
  siteId?: string
  /** When true, the middleware short-circuits to no-op (super_admin / cron). */
  bypass?: boolean
}

const storage = new AsyncLocalStorage<TenantContext>()

/** USER_SCOPED models: row carries `userId` column. */
const USER_SCOPED = new Set<string>([
  'Site',
  'BrandKit',
  'MediaAsset',
  'Generation',
  'AiConversation',
  'Subscription',
  'UserCredits',
  'CreditTransaction',
  'CreditReservation',
  'ScrapeHistory',
  'TeamMember',
  'Refund',
  'CouponRedemption',
])

/** SITE_SCOPED models: row carries `siteId` column. */
const SITE_SCOPED = new Set<string>([
  'ThemeVersion',
  'Page',
  'InstalledPlugin',
  'ComplianceRecord',
  'GenerationStep',
])

/** Models the middleware never touches. */
const GLOBAL_MODELS = new Set<string>([
  'VisualDNA',
  'CreditsPackage',
  'Plan',
  'Coupon',
  // tenant-internal but already require explicit scoping at the call site:
  'User',
  'Account',
  'Session',
  'VerificationToken',
  'PasswordResetToken',
  'LoginEvent',
  'WechatAccount',
  'PhoneOtp',
  'StripeEventLog',
  'StripeIdempotencyKey',
  'RateLimitWindow',
  'Waitlist',
  'AuditLog',
  'ScraperRule',
])

const FIND_OPS = new Set([
  'findFirst',
  'findFirstOrThrow',
  'findMany',
  'findUnique',
  'findUniqueOrThrow',
  'count',
  'aggregate',
  'groupBy',
])

const MUTATE_OPS = new Set([
  'updateMany',
  'deleteMany',
  // For safety we DON'T inject into single-row update / delete because the
  // caller has already specified a unique `where` and a wrong inject would
  // turn a successful operation into "record not found". Use updateMany /
  // deleteMany when you want tenant-scoped batch ops.
])

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const wrap = (args: any, filter: Record<string, unknown>): any => {
  const next = args ?? {}
  next.where = next.where ? { AND: [next.where, filter] } : filter
  return next
}

/** Public helper: run `fn` with a tenant context attached. */
export const runWithTenant = async <T>(ctx: TenantContext, fn: () => Promise<T>): Promise<T> =>
  storage.run(ctx, fn)

/** Run something with explicit cross-tenant access. */
export const runWithBypass = async <T>(fn: () => Promise<T>): Promise<T> =>
  storage.run({ bypass: true }, fn)

/** Synchronous accessor — exposed for tests / observability. */
export const getActiveTenant = (): TenantContext | undefined => storage.getStore()

/**
 * Build a Prisma client extension that injects tenant filters.
 *
 * Usage:  `prisma.$extends(tenantExtension)`
 */
export const tenantExtension = Prisma.defineExtension({
  name: 'forgely-tenant',
  query: {
    $allModels: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      async $allOperations({ model, operation, args, query }: any) {
        const ctx = storage.getStore()
        if (!ctx || ctx.bypass) return query(args)
        if (!model || GLOBAL_MODELS.has(model)) return query(args)

        const isFind = FIND_OPS.has(operation)
        const isMutate = MUTATE_OPS.has(operation)
        if (!isFind && !isMutate) return query(args)

        if (USER_SCOPED.has(model) && ctx.userId) {
          return query(wrap(args, { userId: ctx.userId }))
        }
        if (SITE_SCOPED.has(model) && ctx.siteId) {
          return query(wrap(args, { siteId: ctx.siteId }))
        }
        return query(args)
      },
    },
  },
})

/**
 * Apply the tenant middleware to an existing Prisma client.
 *
 * Returns the extended client. The original client is left alone so test
 * code (and migration scripts) can keep an unscoped reference.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const attachTenantMiddleware = <T extends PrismaClient>(client: T): any =>
  client.$extends(tenantExtension)

/** Re-exported sets for tests + super-admin tooling. */
export const TENANT_MODELS = {
  USER_SCOPED,
  SITE_SCOPED,
  GLOBAL_MODELS,
} as const
