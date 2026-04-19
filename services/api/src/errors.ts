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

  /**
   * Return the localised user message for the given language tag.
   *
   * MVP: there's no i18n catalog yet, so we always return the English
   * `userMessage` we were constructed with. The signature is in place
   * so callers (`router/trpc.ts`, `stripe/webhook.ts`) can pass the
   * locale once W5's `next-intl` integration provides per-request
   * language detection.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- locale arg reserved for future i18n integration
  getUserMessage(_locale: string = 'en'): string {
    return this.userMessage
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
  'STRIPE_UPSTREAM',
  'PLAN_NOT_FOUND',
  'PACKAGE_NOT_FOUND',
  // CN payments — wechat-pay
  'WECHAT_PAY_NOT_CONFIGURED',
  'WECHAT_PAY_SCENE_UNSUPPORTED',
  'WECHAT_PAY_OPENID_REQUIRED',
  'WECHAT_PAY_CREATE_FAILED',
  'WECHAT_PAY_WEBHOOK_TODO',
  'WECHAT_PAY_WEBHOOK_INVALID',
  'WECHAT_PAY_REFUND_FAILED',
  // CN payments — alipay
  'ALIPAY_NOT_CONFIGURED',
  'ALIPAY_SCENE_UNSUPPORTED',
  'ALIPAY_PRECREATE_FAILED',
  'ALIPAY_WEBHOOK_INVALID',
  'ALIPAY_REFUND_TODO',
  'ALIPAY_REFUND_FAILED',
  // CN auth — wechat
  'WECHAT_NOT_CONFIGURED',
  'WECHAT_TOKEN_EXCHANGE_FAILED',
  'WECHAT_USERINFO_FAILED',
  'WECHAT_REFRESH_FAILED',
  'WECHAT_UNIONID_MISSING',
  // CN auth — sms
  'SMS_NOT_CONFIGURED',
  'INVALID_PHONE',
  'OTP_NOT_FOUND',
  'OTP_INVALID',
  'OTP_LOCKED',
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
