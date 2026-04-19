/**
 * Cron / worker entry points.
 *
 * Each function is idempotent and short-running; they're meant to be
 * invoked by:
 *   - services/worker (BullMQ recurring) — production
 *   - a small CLI in `tsx prisma/cron-once.ts` — manual ops
 *   - vitest — unit tests
 *
 * The dispatch table at the bottom maps stable job-name → handler so the
 * worker process doesn't need to know the implementations.
 *
 * @owner W3
 */

import { expireOverdueReservations, runMonthlyCreditReset } from '../credits/index.js'
import { purgeOldRateLimitWindows } from '../credits/rate-limit.js'
import { purgeExpiredPasswordResets } from '../auth/password-reset.js'
import { purgeExpiredVerificationTokens } from '../auth/email-verify.js'
import { purgeExpiredSessions } from '../auth/sessions.js'

export interface JobResult {
  job: string
  durationMs: number
  details: Record<string, unknown>
}

const time = async <T extends Record<string, unknown>>(
  job: string,
  fn: () => Promise<T> | T,
): Promise<JobResult> => {
  const t0 = Date.now()
  const details = await fn()
  return { job, durationMs: Date.now() - t0, details }
}

export const jobs = {
  /** Hourly. Drops session rows past their `expires`. */
  purgeExpiredSessions: () =>
    time('purgeExpiredSessions', async () => ({
      removed: await purgeExpiredSessions(),
    })),

  /** Hourly. Drops verification + password-reset rows past their `expires`. */
  purgeExpiredAuthTokens: () =>
    time('purgeExpiredAuthTokens', async () => ({
      verificationsRemoved: await purgeExpiredVerificationTokens(),
      passwordResetsRemoved: await purgeExpiredPasswordResets(),
    })),

  /** Every 5 min. Releases credit reservations past their TTL. */
  expireOverdueReservations: () =>
    time('expireOverdueReservations', async () => ({
      released: await expireOverdueReservations(),
    })),

  /** Daily. GCs RateLimitWindow rows older than 24h. */
  purgeRateLimitWindows: () =>
    time('purgeRateLimitWindows', async () => ({
      removed: await purgeOldRateLimitWindows(),
    })),

  /** Daily. Topup fallback for monthly subscription credits. */
  monthlyCreditReset: () => time('monthlyCreditReset', async () => runMonthlyCreditReset()),
} as const

export type JobName = keyof typeof jobs

/** Execute every job sequentially; safe for an "ops smoke test" workflow. */
export const runAllJobs = async (): Promise<JobResult[]> => {
  const results: JobResult[] = []
  for (const name of Object.keys(jobs) as JobName[]) {
    try {
      results.push(await jobs[name]())
    } catch (err) {
      results.push({
        job: name,
        durationMs: 0,
        details: { error: err instanceof Error ? err.message : String(err) },
      })
    }
  }
  return results
}
