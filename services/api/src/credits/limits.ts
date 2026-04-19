/**
 * Spending policy primitives — single-operation cap, per-day cap by plan,
 * and the per-minute AI rate limit.
 *
 * Defaults come from CREDIT_LIMITS in src/db.ts; per-plan overrides live here
 * so adding "agency boost +50% daily" is one map update.
 *
 * @owner W3 (T24)
 */

import { CREDIT_LIMITS } from '../db.js';
import type { PlanSlug } from '../db.js';
import { ForgelyError } from '../errors.js';

/** Daily credit ceiling per plan. `Infinity` means uncapped. */
export const DAILY_CAP_BY_PLAN: Readonly<Record<PlanSlug, number>> = {
  free: 500,
  starter: CREDIT_LIMITS.perDayDefault,
  pro: 5_000,
  agency: 25_000,
  enterprise: Number.POSITIVE_INFINITY,
};

/** AI calls per minute per plan (used by ai.* routers + credits.consume). */
export const AI_RATE_PER_MIN_BY_PLAN: Readonly<Record<PlanSlug, number>> = {
  free: 5,
  starter: Number(process.env.RATE_LIMIT_AI_PER_MIN ?? 10),
  pro: 30,
  agency: 60,
  enterprise: 120,
};

export const PER_OPERATION_MAX = CREDIT_LIMITS.perOperationMax;
export const RESERVATION_TTL_MS = CREDIT_LIMITS.reservationTtlMs;

const isPlanSlug = (value: string): value is PlanSlug =>
  value === 'free' ||
  value === 'starter' ||
  value === 'pro' ||
  value === 'agency' ||
  value === 'enterprise';

export const planSlug = (raw: string): PlanSlug =>
  isPlanSlug(raw) ? raw : 'free';

/** Throw `CREDIT_OPERATION_TOO_LARGE` if amount exceeds the global per-op cap. */
export const assertWithinPerOperation = (amount: number): void => {
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new ForgelyError(
      'VALIDATION_ERROR',
      'Credit amount must be a positive integer.',
      400,
      { amount },
    );
  }
  if (amount > PER_OPERATION_MAX) {
    throw new ForgelyError(
      'CREDIT_OPERATION_TOO_LARGE',
      `Single operation may not exceed ${PER_OPERATION_MAX} credits.`,
      400,
      { amount, max: PER_OPERATION_MAX },
    );
  }
};

/** Throw `DAILY_CREDIT_LIMIT_EXCEEDED` if today's running total would overflow. */
export const assertWithinDailyCap = (params: {
  amount: number;
  spentToday: number;
  plan: PlanSlug;
}): void => {
  const cap = DAILY_CAP_BY_PLAN[params.plan];
  if (!Number.isFinite(cap)) return;
  if (params.spentToday + params.amount > cap) {
    throw new ForgelyError(
      'DAILY_CREDIT_LIMIT_EXCEEDED',
      `Daily limit reached (${cap} credits/day on the ${params.plan} plan).`,
      429,
      { plan: params.plan, cap, spentToday: params.spentToday, amount: params.amount },
    );
  }
};

/** UTC midnight of the given moment, returned as a Date. */
export const utcDayStart = (moment: Date = new Date()): Date => {
  const d = new Date(moment);
  d.setUTCHours(0, 0, 0, 0);
  return d;
};

/** Are two dates in the same UTC day? */
export const sameUtcDay = (a: Date | null | undefined, b: Date): boolean => {
  if (!a) return false;
  return a.getUTCFullYear() === b.getUTCFullYear()
    && a.getUTCMonth() === b.getUTCMonth()
    && a.getUTCDate() === b.getUTCDate();
};
