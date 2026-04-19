/**
 * Persistent fixed-window rate limiter backed by `RateLimitWindow`.
 *
 * For per-second hot paths Redis would be the right tool — this DB-backed
 * implementation is the safe default during MVP, and is good enough for
 * "10 AI calls per minute" style limits.
 *
 * @owner W3 (T24)
 */

import type { Prisma, PrismaClient } from '@prisma/client';

import { prisma as defaultPrisma } from '../db.js';
import { errors } from '../errors.js';

type Tx = PrismaClient | Prisma.TransactionClient;

export interface RateLimitArgs {
  bucketKey: string;
  windowMs: number;
  max: number;
}

export interface RateLimitResult {
  remaining: number;
  resetAt: Date;
  /** Total requests recorded in the active window (post-this-call). */
  count: number;
}

const windowStart = (now: Date, windowMs: number): Date =>
  new Date(Math.floor(now.getTime() / windowMs) * windowMs);

/**
 * Increment the bucket for the current window. Throws RATE_LIMITED when
 * the post-increment count exceeds `max`. Otherwise returns counters.
 */
export const consumeRateLimit = async (
  args: RateLimitArgs,
  client: Tx = defaultPrisma,
  now: Date = new Date(),
): Promise<RateLimitResult> => {
  const start = windowStart(now, args.windowMs);
  const resetAt = new Date(start.getTime() + args.windowMs);

  const updated = await client.rateLimitWindow.upsert({
    where: { bucketKey_windowStart: { bucketKey: args.bucketKey, windowStart: start } },
    create: { bucketKey: args.bucketKey, windowStart: start, count: 1 },
    update: { count: { increment: 1 } },
  });

  if (updated.count > args.max) {
    const retryAfter = Math.max(1, Math.ceil((resetAt.getTime() - now.getTime()) / 1000));
    throw errors.rateLimited(retryAfter);
  }

  return {
    remaining: Math.max(0, args.max - updated.count),
    resetAt,
    count: updated.count,
  };
};

/** Cron-friendly cleanup. Drops windows older than `keepMs`. */
export const purgeOldRateLimitWindows = async (
  keepMs: number = 24 * 60 * 60 * 1000,
  client: Tx = defaultPrisma,
): Promise<number> => {
  const cutoff = new Date(Date.now() - keepMs);
  const { count } = await client.rateLimitWindow.deleteMany({
    where: { windowStart: { lt: cutoff } },
  });
  return count;
};
