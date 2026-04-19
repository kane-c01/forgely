/**
 * Brute-force lockout — counts consecutive failed logins per user and
 * locks the account for `lockoutSeconds` after `maxFailedLogins` strikes.
 *
 * Counts and lock state live on `User.failedLoginCount` / `User.lockedUntil`
 * to avoid hard dependency on Redis (still safe under transactional updates).
 *
 * @owner W3 (T06)
 */

import type { User } from '@prisma/client';

import { prisma } from '../db.js';
import { ForgelyError } from '../errors.js';

import { getAuthConfig } from './config.js';

/** Throws ACCOUNT_LOCKED if the user is currently locked. */
export const assertNotLocked = (user: Pick<User, 'lockedUntil'>): void => {
  if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
    const seconds = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 1000);
    throw new ForgelyError(
      'ACCOUNT_LOCKED',
      `Account locked. Try again in ${seconds}s.`,
      423,
      { retryAfterSeconds: seconds },
    );
  }
};

/**
 * Increment failed-login counter; lock account if past threshold.
 * Returns the post-update user.
 */
export const recordFailedLogin = async (
  userId: string,
): Promise<{ failedLoginCount: number; lockedUntil: Date | null }> => {
  const cfg = getAuthConfig();

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { failedLoginCount: { increment: 1 } },
    select: { failedLoginCount: true, lockedUntil: true },
  });

  if (updated.failedLoginCount >= cfg.maxFailedLogins) {
    const lockedUntil = new Date(Date.now() + cfg.lockoutSeconds * 1000);
    await prisma.user.update({
      where: { id: userId },
      data: { lockedUntil, failedLoginCount: 0 },
    });
    return { failedLoginCount: 0, lockedUntil };
  }

  return updated;
};

/** Reset counters after a successful login. */
export const recordSuccessfulLogin = async (userId: string): Promise<void> => {
  await prisma.user.update({
    where: { id: userId },
    data: { failedLoginCount: 0, lockedUntil: null },
  });
};
