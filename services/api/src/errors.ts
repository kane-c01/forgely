/**
 * Domain-typed error class. Surfaces both a stable machine code (for
 * client logic) and a friendly user message (for UI Toast). All API layers
 * map this to TRPCError / HTTP responses.
 *
 * @owner W3 (T05) — used by T06 auth and T24 credits/Stripe.
 */
export class ForgelyError extends Error {
  override name = 'ForgelyError'

  constructor(
    public readonly code: ForgelyErrorCode,
    public readonly userMessage: string,
    public readonly statusCode: number = 400,
    public readonly context?: Record<string, unknown>,
  ) {
    super(`[${code}] ${userMessage}`)
  }
}

export const FORGELY_ERROR_CODES = [
  // auth
  'UNAUTHORIZED',
  'FORBIDDEN',
  'INVALID_CREDENTIALS',
  'EMAIL_TAKEN',
  'WEAK_PASSWORD',
  'ACCOUNT_LOCKED',
  'EMAIL_NOT_VERIFIED',
  'TOKEN_EXPIRED',
  'TOKEN_INVALID',
  'MFA_REQUIRED',
  // credits
  'INSUFFICIENT_CREDITS',
  'CREDIT_OPERATION_TOO_LARGE',
  'DAILY_CREDIT_LIMIT_EXCEEDED',
  'RESERVATION_NOT_FOUND',
  'RESERVATION_ALREADY_RESOLVED',
  'RESERVATION_EXPIRED',
  // billing / Stripe
  'STRIPE_NOT_CONFIGURED',
  'STRIPE_CUSTOMER_REQUIRED',
  'STRIPE_WEBHOOK_INVALID',
  'PLAN_NOT_FOUND',
  'PACKAGE_NOT_FOUND',
  // generic
  'NOT_FOUND',
  'CONFLICT',
  'RATE_LIMITED',
  'VALIDATION_ERROR',
  'INTERNAL_ERROR',
] as const
export type ForgelyErrorCode = (typeof FORGELY_ERROR_CODES)[number]

export const isForgelyError = (e: unknown): e is ForgelyError => e instanceof ForgelyError

/** Convenience constructors for the most common errors. */
export const errors = {
  unauthorized: (msg = 'You must be signed in.') => new ForgelyError('UNAUTHORIZED', msg, 401),
  forbidden: (msg = 'You do not have access to this resource.') =>
    new ForgelyError('FORBIDDEN', msg, 403),
  notFound: (resource: string) =>
    new ForgelyError('NOT_FOUND', `${resource} not found.`, 404, { resource }),
  insufficientCredits: (need: number, have: number) =>
    new ForgelyError(
      'INSUFFICIENT_CREDITS',
      `Not enough credits — need ${need}, have ${have}.`,
      402,
      { need, have },
    ),
  rateLimited: (retryAfterSeconds: number) =>
    new ForgelyError(
      'RATE_LIMITED',
      `Too many requests. Try again in ${retryAfterSeconds}s.`,
      429,
      { retryAfterSeconds },
    ),
  validation: (msg: string, fieldErrors?: Record<string, string>) =>
    new ForgelyError('VALIDATION_ERROR', msg, 400, { fieldErrors }),
} as const
