/**
 * Server-side session lifecycle backed by the `Session` Prisma model.
 *
 * - `createSession(userId, …)` returns the opaque token to set as a cookie
 *   AND a signed short-lived JWT for stateless API calls.
 * - `validateSession(token)` looks up the row, returns the user (or null),
 *   and refreshes `lastSeenAt`.
 * - `revokeSession` / `revokeAllSessionsForUser` are used by sign-out and
 *   "log me out everywhere" UX.
 *
 * @owner W3 (T06)
 */

import type { User } from '@prisma/client';

import { prisma } from '../db.js';
import type { UserRole } from '../db.js';

import { getAuthConfig } from './config.js';
import { signJwt } from './jwt.js';
import { generateToken } from './tokens.js';

export interface SessionDevice {
  ipAddress?: string;
  userAgent?: string;
}

export interface CreatedSession {
  /** Opaque token — store in HttpOnly cookie. */
  sessionToken: string;
  /** Signed JWT — short-lived bearer for the API. */
  accessToken: string;
  expiresAt: Date;
  user: User;
}

const daysFromNow = (days: number): Date =>
  new Date(Date.now() + days * 24 * 60 * 60 * 1000);

/** Create a new server-side session + matching short-lived JWT. */
export const createSession = async (
  user: User,
  device: SessionDevice = {},
): Promise<CreatedSession> => {
  const cfg = getAuthConfig();
  const sessionToken = generateToken();
  const expiresAt = daysFromNow(cfg.sessionTtlDays);

  const session = await prisma.session.create({
    data: {
      sessionToken,
      userId: user.id,
      expires: expiresAt,
      ipAddress: device.ipAddress ?? null,
      userAgent: device.userAgent ?? null,
    },
  });

  const accessToken = await signJwt({
    sub: user.id,
    role: (user.role as UserRole) ?? 'user',
    sid: session.id,
    plan: user.plan,
  });

  return { sessionToken, accessToken, expiresAt, user };
};

/**
 * Validate an opaque session cookie.
 *
 * - Returns `null` if missing, expired, or unknown.
 * - Refreshes `lastSeenAt` lazily (≤ once per minute) to avoid write storms.
 */
export const validateSession = async (
  sessionToken: string,
): Promise<{ session: { id: string; userId: string }; user: User } | null> => {
  if (!sessionToken) return null;

  const session = await prisma.session.findUnique({
    where: { sessionToken },
    include: { user: true },
  });

  if (!session) return null;
  if (session.expires.getTime() <= Date.now()) {
    await prisma.session.delete({ where: { id: session.id } }).catch(() => undefined);
    return null;
  }
  if (session.user.deletedAt) return null;

  if (Date.now() - session.lastSeenAt.getTime() > 60_000) {
    await prisma.session
      .update({ where: { id: session.id }, data: { lastSeenAt: new Date() } })
      .catch(() => undefined);
  }

  return { session: { id: session.id, userId: session.userId }, user: session.user };
};

/** Revoke a single session (sign-out). */
export const revokeSession = async (sessionToken: string): Promise<void> => {
  await prisma.session
    .deleteMany({ where: { sessionToken } })
    .catch(() => undefined);
};

/** Revoke every session for a user — "log me out everywhere". */
export const revokeAllSessionsForUser = async (userId: string): Promise<number> => {
  const { count } = await prisma.session.deleteMany({ where: { userId } });
  return count;
};

/** Periodic cleanup — call from a cron / worker (not on the request path). */
export const purgeExpiredSessions = async (): Promise<number> => {
  const { count } = await prisma.session.deleteMany({
    where: { expires: { lte: new Date() } },
  });
  return count;
};
