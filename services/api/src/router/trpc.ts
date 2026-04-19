/**
 * tRPC initialisation — superjson transformer + ForgelyError mapping +
 * standard auth middlewares.
 *
 * Three procedures are exported:
 *   - publicProcedure
 *   - protectedProcedure  (requires signed-in user)
 *   - superAdminProcedure (requires role === 'super_admin')
 *
 * @owner W3 (T06)
 */

import { TRPCError, initTRPC } from '@trpc/server'
import superjson from 'superjson'

import { ForgelyError, isForgelyError } from '../errors.js'
import { isSuperAdmin, requireUser } from '../auth/index.js'
import { localizeAllLocales } from '../i18n/index.js'

import type { AuthContext } from './context.js'

const FORGELY_TO_TRPC: Record<string, TRPCError['code']> = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INVALID_CREDENTIALS: 'UNAUTHORIZED',
  EMAIL_TAKEN: 'CONFLICT',
  WEAK_PASSWORD: 'BAD_REQUEST',
  ACCOUNT_LOCKED: 'TOO_MANY_REQUESTS',
  EMAIL_NOT_VERIFIED: 'FORBIDDEN',
  TOKEN_EXPIRED: 'UNAUTHORIZED',
  TOKEN_INVALID: 'UNAUTHORIZED',
  MFA_REQUIRED: 'UNAUTHORIZED',
  // tRPC v10 has no PAYMENT_REQUIRED — closest semantic match is FORBIDDEN
  // (the user is authenticated but not allowed to perform this action yet).
  INSUFFICIENT_CREDITS: 'FORBIDDEN',
  CREDIT_OPERATION_TOO_LARGE: 'BAD_REQUEST',
  DAILY_CREDIT_LIMIT_EXCEEDED: 'TOO_MANY_REQUESTS',
  RESERVATION_NOT_FOUND: 'NOT_FOUND',
  RESERVATION_ALREADY_RESOLVED: 'CONFLICT',
  RESERVATION_EXPIRED: 'CONFLICT',
  STRIPE_NOT_CONFIGURED: 'INTERNAL_SERVER_ERROR',
  STRIPE_CUSTOMER_REQUIRED: 'BAD_REQUEST',
  STRIPE_WEBHOOK_INVALID: 'BAD_REQUEST',
  PLAN_NOT_FOUND: 'NOT_FOUND',
  PACKAGE_NOT_FOUND: 'NOT_FOUND',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  RATE_LIMITED: 'TOO_MANY_REQUESTS',
  VALIDATION_ERROR: 'BAD_REQUEST',
  INTERNAL_ERROR: 'INTERNAL_SERVER_ERROR',
}

const t = initTRPC.context<AuthContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    const cause = error.cause
    if (isForgelyError(cause)) {
      const localized = localizeAllLocales(cause)
      return {
        ...shape,
        message: cause.userMessage,
        data: {
          ...shape.data,
          forgelyCode: cause.code,
          httpStatus: cause.statusCode,
          context: cause.context ?? null,
          /** Bilingual dictionary so the client can render zh-CN without re-fetching. */
          localizedMessages: localized,
        },
      }
    }
    return shape
  },
})

/**
 * Catches a `ForgelyError` thrown inside a procedure and wraps it into the
 * matching `TRPCError` (so HTTP status codes line up).
 */
const errorMappingMiddleware = t.middleware(async ({ next }) => {
  try {
    return await next()
  } catch (err) {
    if (isForgelyError(err)) {
      throw new TRPCError({
        code: FORGELY_TO_TRPC[err.code] ?? 'INTERNAL_SERVER_ERROR',
        message: err.getUserMessage('en'),
        cause: err,
      })
    }
    if (err instanceof ForgelyError) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: err.getUserMessage('en'),
        cause: err,
      })
    }
    throw err
  }
})

const requireUserMiddleware = t.middleware(async ({ ctx, next }) => {
  const user = requireUser(ctx)
  return next({ ctx: { ...ctx, user, session: ctx.session! } })
})

const requireSuperAdminMiddleware = t.middleware(async ({ ctx, next }) => {
  const user = requireUser(ctx)
  if (!isSuperAdmin(user)) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Super admin only.',
    })
  }
  return next({ ctx: { ...ctx, user, session: ctx.session! } })
})

export const router = t.router
export const publicProcedure = t.procedure.use(errorMappingMiddleware)
export const protectedProcedure = publicProcedure.use(requireUserMiddleware)
export const superAdminProcedure = publicProcedure.use(requireSuperAdminMiddleware)

/** Re-export the t instance for advanced router composition (mergeRouters). */
export const trpc = t
