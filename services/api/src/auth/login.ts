/**
 * High-level signup / signin flows.
 *
 * Uses argon2 password hashing, lockout protection, and writes both a
 * `LoginEvent` (per attempt) and an `AuditLog` row (for super-admin review).
 *
 * @owner W3 (T06)
 */

import type { User } from '@prisma/client';
import { z } from 'zod';

import { prisma } from '../db.js';
import { ForgelyError, errors } from '../errors.js';

import { recordAuthAudit, recordLoginEvent } from './audit.js';
import { assertNotLocked, recordFailedLogin, recordSuccessfulLogin } from './lockout.js';
import { hashPassword, verifyPassword } from './password.js';
import { createSession, type CreatedSession, type SessionDevice } from './sessions.js';

export const SignupInput = z.object({
  email: z.string().trim().toLowerCase().email(),
  name: z.string().trim().min(1).max(80).optional(),
  password: z.string().min(1).max(256),
});
export type SignupInput = z.infer<typeof SignupInput>;

export const SigninInput = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1).max(256),
});
export type SigninInput = z.infer<typeof SigninInput>;

export interface AuthResult {
  user: Pick<User, 'id' | 'email' | 'name' | 'role' | 'plan' | 'avatarUrl'>;
  session: CreatedSession;
}

const publicUser = (user: User): AuthResult['user'] => ({
  id: user.id,
  email: user.email,
  name: user.name,
  role: user.role,
  plan: user.plan,
  avatarUrl: user.avatarUrl,
});

/**
 * Create a new user (email + password) and immediately sign them in.
 *
 * Race-safe: relies on the `User.email` unique constraint.
 */
export const signupWithPassword = async (
  raw: SignupInput,
  device: SessionDevice = {},
): Promise<AuthResult> => {
  const input = SignupInput.parse(raw);
  const passwordHash = await hashPassword(input.password);

  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new ForgelyError(
      'EMAIL_TAKEN',
      'An account with that email already exists.',
      409,
    );
  }

  const user = await prisma.user.create({
    data: {
      email: input.email,
      name: input.name,
      passwordHash,
      role: 'user',
      plan: 'free',
      credits: { create: { balance: 500, lifetimeEarned: 500 } },
    },
  });

  const session = await createSession(user, device);

  await recordLoginEvent({
    userId: user.id,
    email: user.email,
    outcome: 'success',
    ipAddress: device.ipAddress,
    userAgent: device.userAgent,
  });

  await recordAuthAudit({
    actorId: user.id,
    action: 'auth.signup',
    after: { email: user.email, plan: user.plan },
    ipAddress: device.ipAddress,
    userAgent: device.userAgent,
  });

  return { user: publicUser(user), session };
};

/**
 * Verify credentials and create a session.
 *
 * Failure modes are normalised to `INVALID_CREDENTIALS` so we do not leak
 * which side of the credential pair was wrong (classic enumeration defence).
 * Lockout state is surfaced explicitly because the UI must display it.
 */
export const signinWithPassword = async (
  raw: SigninInput,
  device: SessionDevice = {},
): Promise<AuthResult> => {
  const input = SigninInput.parse(raw);

  const user = await prisma.user.findUnique({ where: { email: input.email } });

  if (!user || !user.passwordHash) {
    await recordLoginEvent({
      userId: user?.id ?? null,
      email: input.email,
      outcome: user ? 'bad_password' : 'unknown_user',
      ipAddress: device.ipAddress,
      userAgent: device.userAgent,
    });
    throw new ForgelyError(
      'INVALID_CREDENTIALS',
      'Email or password is incorrect.',
      401,
    );
  }

  try {
    assertNotLocked(user);
  } catch (err) {
    await recordLoginEvent({
      userId: user.id,
      email: user.email,
      outcome: 'locked',
      ipAddress: device.ipAddress,
      userAgent: device.userAgent,
    });
    throw err;
  }

  const ok = await verifyPassword(input.password, user.passwordHash);
  if (!ok) {
    await recordFailedLogin(user.id);
    await recordLoginEvent({
      userId: user.id,
      email: user.email,
      outcome: 'bad_password',
      ipAddress: device.ipAddress,
      userAgent: device.userAgent,
    });
    throw new ForgelyError(
      'INVALID_CREDENTIALS',
      'Email or password is incorrect.',
      401,
    );
  }

  await recordSuccessfulLogin(user.id);
  const session = await createSession(user, device);

  await recordLoginEvent({
    userId: user.id,
    email: user.email,
    outcome: 'success',
    ipAddress: device.ipAddress,
    userAgent: device.userAgent,
  });

  await recordAuthAudit({
    actorId: user.id,
    action: 'auth.signin',
    ipAddress: device.ipAddress,
    userAgent: device.userAgent,
  });

  return { user: publicUser(user), session };
};

/** Sign out a single session. */
export const signout = async (
  sessionToken: string,
  actorId: string | null,
  device: SessionDevice = {},
): Promise<void> => {
  await prisma.session.deleteMany({ where: { sessionToken } });
  if (actorId) {
    await recordAuthAudit({
      actorId,
      action: 'auth.signout',
      ipAddress: device.ipAddress,
      userAgent: device.userAgent,
    });
  }
};

/** Sign out everywhere (password change, "log me out everywhere"). */
export const signoutAll = async (
  userId: string,
  device: SessionDevice = {},
): Promise<number> => {
  const { count } = await prisma.session.deleteMany({ where: { userId } });
  await recordAuthAudit({
    actorId: userId,
    action: 'auth.signout_all',
    after: { revokedSessions: count },
    ipAddress: device.ipAddress,
    userAgent: device.userAgent,
  });
  return count;
};

/** Convenience guard for any signed-in surface that requires email verification. */
export const assertEmailVerified = (user: User): void => {
  if (!user.emailVerifiedAt) {
    throw errors.forbidden('Please verify your email before continuing.');
  }
};
