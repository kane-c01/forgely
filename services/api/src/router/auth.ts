/**
 * `auth.*` tRPC procedures.
 *
 * Returned `session.sessionToken` should be set as a HttpOnly cookie by the
 * Next.js Route Handler — the API never sets cookies directly so tRPC stays
 * usable from non-HTTP transports.
 *
 * @owner W3
 */

import { z } from 'zod'

import {
  SigninInput,
  SignupInput,
  beginTotpEnrollment,
  confirmTotpEnrollment,
  consumePasswordReset,
  disableTotp,
  requestPasswordReset,
  revokeSession,
  sendEmailVerification,
  signinWithPassword,
  signoutAll,
  signupWithPassword,
  verifyEmail,
} from '../auth/index.js'
import { consumeRateLimit } from '../credits/rate-limit.js'

import { protectedProcedure, publicProcedure, router } from './trpc.js'

const ipBucket = (action: string, ip: string | null): string => `auth:${action}:${ip ?? 'unknown'}`
const emailBucket = (action: string, email: string): string => `auth:${action}:email:${email}`

/**
 * Rate-limit signup/signin attempts:
 *   - 20 per minute per IP (prevents broad brute-force)
 *   - 8 per 15 min per email (prevents targeted brute-force on one account)
 */
const enforceAuthRateLimit = async (
  action: 'signup' | 'signin' | 'password_reset',
  ip: string | null,
  email: string | null,
): Promise<void> => {
  await consumeRateLimit({
    bucketKey: ipBucket(action, ip),
    windowMs: 60_000,
    max: 20,
  })
  if (email) {
    await consumeRateLimit({
      bucketKey: emailBucket(action, email),
      windowMs: 15 * 60_000,
      max: 8,
    })
  }
}

const SignoutInput = z
  .object({
    sessionToken: z.string().min(1).optional(),
  })
  .optional()

const PasswordResetRequestInput = z.object({
  email: z.string().trim().toLowerCase().email(),
})

const PasswordResetConfirmInput = z.object({
  token: z.string().min(8).max(128),
  newPassword: z.string().min(1).max(256),
})

const VerifyEmailInputSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  token: z.string().min(8).max(128),
})

const TotpCodeInput = z.object({
  code: z.string().regex(/^\d{6}$/),
})

export const authRouter = router({
  /** Email + password signup. Logs the user in immediately and returns a session. */
  signup: publicProcedure.input(SignupInput).mutation(async ({ input, ctx }) => {
    await enforceAuthRateLimit('signup', ctx.ipAddress, input.email)
    return signupWithPassword(input, {
      ipAddress: ctx.ipAddress ?? undefined,
      userAgent: ctx.userAgent ?? undefined,
    })
  }),

  /** Email + password signin. */
  signin: publicProcedure.input(SigninInput).mutation(async ({ input, ctx }) => {
    await enforceAuthRateLimit('signin', ctx.ipAddress, input.email)
    return signinWithPassword(input, {
      ipAddress: ctx.ipAddress ?? undefined,
      userAgent: ctx.userAgent ?? undefined,
    })
  }),

  /** Sign out a specific session (defaults to the caller's). */
  signout: protectedProcedure.input(SignoutInput).mutation(async ({ input, ctx }) => {
    const token = input?.sessionToken
    if (token) {
      await revokeSession(token)
    } else if (ctx.session?.id && ctx.session.id !== 'preauthorized') {
      await ctx.prisma.session.deleteMany({ where: { id: ctx.session.id } }).catch(() => undefined)
    }
    return { ok: true as const }
  }),

  /** Revoke every session for the current user (security action). */
  signoutAll: protectedProcedure.mutation(async ({ ctx }) => {
    const revoked = await signoutAll(ctx.user.id, {
      ipAddress: ctx.ipAddress ?? undefined,
      userAgent: ctx.userAgent ?? undefined,
    })
    return { revoked }
  }),

  /** Returns the signed-in user (or null for anonymous callers). */
  me: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.user) return null
    return {
      id: ctx.user.id,
      email: ctx.user.email,
      name: ctx.user.name,
      role: ctx.user.role,
      plan: ctx.user.plan,
      avatarUrl: ctx.user.avatarUrl,
      emailVerifiedAt: ctx.user.emailVerifiedAt,
      totpEnabledAt: ctx.user.totpEnabledAt,
      createdAt: ctx.user.createdAt,
    }
  }),

  // ── Sessions ────────────────────────────────────────────────────────
  /** All active sessions for the calling user. */
  listSessions: protectedProcedure.query(async ({ ctx }) =>
    ctx.prisma.session.findMany({
      where: { userId: ctx.user.id, expires: { gt: new Date() } },
      orderBy: { lastSeenAt: 'desc' },
      select: {
        id: true,
        sessionToken: false,
        ipAddress: true,
        userAgent: true,
        createdAt: true,
        lastSeenAt: true,
        expires: true,
      },
    }),
  ),

  /** Revoke one specific session by id (the user can list them first). */
  revokeSession: protectedProcedure
    .input(z.object({ sessionId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.prisma.session.deleteMany({
        where: { id: input.sessionId, userId: ctx.user.id },
      })
      return { revoked: result.count }
    }),

  // ── Password reset ─────────────────────────────────────────────────
  requestPasswordReset: publicProcedure
    .input(PasswordResetRequestInput)
    .mutation(async ({ ctx, input }) => {
      await enforceAuthRateLimit('password_reset', ctx.ipAddress, input.email)
      const result = await requestPasswordReset({
        email: input.email,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
      })
      // Always tell the caller "ok" — never leak whether the email exists.
      // The transport layer (email service) decides what to actually send.
      return { ok: true as const, _enqueued: result.enqueued }
    }),

  confirmPasswordReset: publicProcedure
    .input(PasswordResetConfirmInput)
    .mutation(async ({ ctx, input }) =>
      consumePasswordReset({
        token: input.token,
        newPassword: input.newPassword,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
      }),
    ),

  // ── Email verification ─────────────────────────────────────────────
  /** Resend the verification link to the signed-in user's email. */
  resendEmailVerification: protectedProcedure.mutation(async ({ ctx }) =>
    sendEmailVerification(ctx.user.id),
  ),

  /** Public — clicked from an email link. */
  verifyEmail: publicProcedure.input(VerifyEmailInputSchema).mutation(async ({ ctx, input }) =>
    verifyEmail({
      token: input.token,
      email: input.email,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    }),
  ),

  // ── TOTP 2FA ──────────────────────────────────────────────────────
  beginTotpEnrollment: protectedProcedure.mutation(async ({ ctx }) =>
    beginTotpEnrollment(ctx.user.id),
  ),

  confirmTotpEnrollment: protectedProcedure
    .input(TotpCodeInput)
    .mutation(async ({ ctx, input }) => confirmTotpEnrollment(ctx.user.id, input.code)),

  disableTotp: protectedProcedure.input(TotpCodeInput).mutation(async ({ ctx, input }) => {
    // Require a valid current code to disable — defence-in-depth.
    const { verifyTotp } = await import('../auth/totp.js')
    const ok = await verifyTotp(ctx.user.id, input.code)
    if (!ok) {
      throw new (await import('../errors.js')).ForgelyError(
        'MFA_REQUIRED',
        'Invalid 2FA code.',
        401,
      )
    }
    await disableTotp(ctx.user.id)
    return { ok: true as const }
  }),
})
