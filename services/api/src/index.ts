/**
 * Public surface of `@forgely/api`.
 *
 * Subpath imports are preferred for tree-shaking and clearer ownership:
 *   - `@forgely/api/db`       — Prisma client + soft enums
 *   - `@forgely/api/auth`     — sessions, password, RBAC (T06)
 *   - `@forgely/api/credits`  — wallet ops (T24)
 *   - `@forgely/api/stripe`   — Stripe SDK + webhook (T24)
 *   - `@forgely/api/router`   — tRPC appRouter (mountable from apps/app)
 */

export { prisma, Prisma } from './db.js'
export type {
  User,
  UserRole,
  PlanSlug,
  SubscriptionStatus,
  SubscriptionCadence,
  SiteStatus,
  GenerationStatus,
  CreditTxType,
  CreditReservationState,
  LoginOutcome,
} from './db.js'

export { ForgelyError, errors, isForgelyError } from './errors.js'
export type { ForgelyErrorCode } from './errors.js'

export type { AppRouter } from './router/index.js'
