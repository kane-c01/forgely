/**
 * Public surface of `@forgely/api/credits`.
 *
 * @owner W3 (T24)
 */

export {
  AI_RATE_PER_MIN_BY_PLAN,
  DAILY_CAP_BY_PLAN,
  PER_OPERATION_MAX,
  RESERVATION_TTL_MS,
  assertWithinDailyCap,
  assertWithinPerOperation,
  planSlug,
  sameUtcDay,
  utcDayStart,
} from './limits.js';

export {
  creditWallet,
  getBalance,
  getOrCreateWallet,
  listTransactions,
  resetDailyCounterIfNewDay,
} from './wallet.js';
export type { CreditWalletInput, ListTransactionsArgs } from './wallet.js';

export { consumeCredits, consumeCreditsSafe } from './consume.js';
export type {
  ConsumeCreditsInput,
  ConsumeCreditsResult,
} from './consume.js';

export {
  commitReservation,
  expireOverdueReservations,
  releaseReservation,
  reserveCredits,
  runWithReservation,
} from './reserve.js';
export type {
  ReserveCreditsInput,
  ReservedCredits,
} from './reserve.js';

export {
  consumeRateLimit,
  purgeOldRateLimitWindows,
} from './rate-limit.js';
export type { RateLimitArgs, RateLimitResult } from './rate-limit.js';
