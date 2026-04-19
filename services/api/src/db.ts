/**
 * Prisma Client singleton + shared domain constants.
 *
 * - Reuses one PrismaClient across hot-reload in dev (Next.js / tsx watcher)
 *   to avoid the "too many connections" foot-gun.
 * - Centralises soft-enum string unions (User.role, Plan.slug, etc.) so the
 *   API and web layers don't drift from the schema.
 *
 * @owner W3 — services/api (T05)
 */

import { PrismaClient } from '@prisma/client'

declare global {
  // eslint-disable-next-line no-var
  var __forgelyPrisma: PrismaClient | undefined
}

const buildClient = (): PrismaClient =>
  new PrismaClient({
    log: process.env.NODE_ENV === 'production' ? ['warn', 'error'] : ['warn', 'error'],
  })

/**
 * Shared Prisma Client. Import as `import { prisma } from '@forgely/api/db'`.
 */
export const prisma: PrismaClient = globalThis.__forgelyPrisma ?? buildClient()

if (process.env.NODE_ENV !== 'production') {
  globalThis.__forgelyPrisma = prisma
}

// ─── Multi-tenant middleware re-exports ────────────────────────────────────
export {
  attachTenantMiddleware,
  getActiveTenant,
  runWithBypass,
  runWithTenant,
  tenantExtension,
  TENANT_MODELS,
} from './db/tenant-middleware.js'

// ─── Re-exports for downstream callers ──────────────────────────────────────
export { Prisma } from '@prisma/client'
export type {
  User,
  Site,
  Generation,
  ThemeVersion,
  VisualDNA,
  BrandKit,
  MediaAsset,
  AiConversation,
  UserCredits,
  CreditTransaction,
  CreditReservation,
  CreditsPackage,
  Subscription,
  Plan,
  StripeEventLog,
  Account,
  Session,
  VerificationToken,
  PasswordResetToken,
  LoginEvent,
  AuditLog,
  ComplianceRecord,
  Page,
  InstalledPlugin,
  ScraperRule,
  ScrapeHistory,
  Waitlist,
  RateLimitWindow,
} from '@prisma/client'

// ─── Soft enums ─────────────────────────────────────────────────────────────

export const USER_ROLES = ['user', 'super_admin', 'admin', 'support'] as const
export type UserRole = (typeof USER_ROLES)[number]

export const PLANS = ['free', 'starter', 'pro', 'agency', 'enterprise'] as const
export type PlanSlug = (typeof PLANS)[number]

export const SUBSCRIPTION_STATUSES = [
  'active',
  'past_due',
  'canceled',
  'trialing',
  'incomplete',
  'unpaid',
] as const
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number]

export const SUBSCRIPTION_CADENCES = ['monthly', 'yearly'] as const
export type SubscriptionCadence = (typeof SUBSCRIPTION_CADENCES)[number]

export const SITE_STATUSES = ['draft', 'generating', 'published', 'suspended'] as const
export type SiteStatus = (typeof SITE_STATUSES)[number]

export const GENERATION_STATUSES = [
  'pending',
  'running',
  'completed',
  'failed',
  'cancelled',
] as const
export type GenerationStatus = (typeof GENERATION_STATUSES)[number]

export const CREDIT_TX_TYPES = [
  'purchase',
  'subscription',
  'consumption',
  'refund',
  'gift',
  'promotion',
  'reservation_release',
  'adjustment',
] as const
export type CreditTxType = (typeof CREDIT_TX_TYPES)[number]

export const CREDIT_RESERVATION_STATES = ['reserved', 'committed', 'released', 'expired'] as const
export type CreditReservationState = (typeof CREDIT_RESERVATION_STATES)[number]

export const LOGIN_OUTCOMES = [
  'success',
  'bad_password',
  'unknown_user',
  'locked',
  'mfa_required',
  'mfa_failed',
] as const
export type LoginOutcome = (typeof LOGIN_OUTCOMES)[number]

// ─── Limits referenced across services (docs/MASTER.md §25) ────────────────

export const CREDIT_LIMITS = {
  /** Max credits a single operation may consume. */
  perOperationMax: 1000,
  /** Default per-day cap for non-Pro tiers; overridable per-plan. */
  perDayDefault: Number(process.env.RATE_LIMIT_CREDITS_PER_DAY_STARTER ?? 500),
  /** Reservation TTL — credits auto-released after this. */
  reservationTtlMs: 30 * 60 * 1000,
} as const
