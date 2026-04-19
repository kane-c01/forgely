/**
 * `auth.*` tRPC procedures.
 *
 * Returned `session.sessionToken` should be set as a HttpOnly cookie by the
 * Next.js Route Handler (the API never sets cookies directly to keep tRPC
 * usable from non-HTTP transports too).
 *
 * @owner W3 (T06)
 */

import { z } from 'zod';

import {
  SigninInput,
  SignupInput,
  signinWithPassword,
  signoutAll,
  signupWithPassword,
} from '../auth/index.js';
import { revokeSession } from '../auth/index.js';

import {
  protectedProcedure,
  publicProcedure,
  router,
} from './trpc.js';

const SignoutInput = z
  .object({
    sessionToken: z.string().min(1).optional(),
  })
  .optional();

export const authRouter = router({
  /** Email + password signup. Logs the user in immediately and returns a session. */
  signup: publicProcedure
    .input(SignupInput)
    .mutation(async ({ input, ctx }) => {
      return signupWithPassword(input, {
        ipAddress: ctx.ipAddress ?? undefined,
        userAgent: ctx.userAgent ?? undefined,
      });
    }),

  /** Email + password signin. */
  signin: publicProcedure
    .input(SigninInput)
    .mutation(async ({ input, ctx }) => {
      return signinWithPassword(input, {
        ipAddress: ctx.ipAddress ?? undefined,
        userAgent: ctx.userAgent ?? undefined,
      });
    }),

  /** Sign out a specific session (defaults to the caller's). */
  signout: protectedProcedure
    .input(SignoutInput)
    .mutation(async ({ input, ctx }) => {
      const token = input?.sessionToken;
      if (token) {
        await revokeSession(token);
      } else if (ctx.session?.id && ctx.session.id !== 'preauthorized') {
        await ctx.prisma.session
          .deleteMany({ where: { id: ctx.session.id } })
          .catch(() => undefined);
      }
      return { ok: true as const };
    }),

  /** Revoke every session for the current user (security action). */
  signoutAll: protectedProcedure.mutation(async ({ ctx }) => {
    const revoked = await signoutAll(ctx.user.id, {
      ipAddress: ctx.ipAddress ?? undefined,
      userAgent: ctx.userAgent ?? undefined,
    });
    return { revoked };
  }),

  /** Returns the signed-in user (or null for anonymous callers). */
  me: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.user) return null;
    return {
      id: ctx.user.id,
      email: ctx.user.email,
      name: ctx.user.name,
      role: ctx.user.role,
      plan: ctx.user.plan,
      avatarUrl: ctx.user.avatarUrl,
      emailVerifiedAt: ctx.user.emailVerifiedAt,
      createdAt: ctx.user.createdAt,
    };
  }),
});
