/**
 * Cron scheduler — wires up monthly-reset / otp-purge / stale-reservation-release
 * for the worker process.
 *
 * Jobs live in `@forgely/api/jobs`. We load them via dynamic import so the
 * worker package-level dependency graph stays acyclic (`@forgely/api`
 * already depends on `@forgely/worker` for the BullMQ queue export).
 *
 * Schedule (Asia/Shanghai, UTC+8):
 *   `1 0 1 * *`  — 01:00 on the 1st of each month → monthlyCreditReset
 *   `0 * * * *`  — top of every hour               → purgeExpiredOtps
 *   `*\/30 * * * *` — every 30 minutes             → releaseStaleReservations
 *
 * Set `FORGELY_CRON_AUTOBOOT=0` to disable (or the tests would hammer Postgres).
 *
 * @owner W4 — payments real
 */
import { CronJob } from 'cron'

import type * as ApiJobsModule from '@forgely/api/jobs'

type JobsModule = typeof ApiJobsModule
type ScheduledJob = { name: string; schedule: string; job: CronJob }

const TZ = 'Asia/Shanghai'

let SCHEDULED: ScheduledJob[] = []

const loadJobs = async (): Promise<JobsModule> => {
  // Dynamic import — evaluated only when cron actually starts, keeping the
  // worker package's module graph acyclic at top level.
  return (await import('@forgely/api/jobs')) as JobsModule
}

const wrapSafe =
  <T>(name: string, fn: () => Promise<T>) =>
  async (): Promise<void> => {
    const started = Date.now()
    try {
      const result = await fn()
      console.info(`[cron:${name}] ok (${Date.now() - started}ms)`, result)
    } catch (err) {
      console.error(`[cron:${name}] failed (${Date.now() - started}ms)`, err)
    }
  }

export interface StartCronOptions {
  /** Disable scheduling and just return the spec list (for tests). */
  dryRun?: boolean
}

export interface CronDescriptor {
  name: string
  schedule: string
}

/** Start all CN cron jobs. Idempotent — duplicate calls are a no-op. */
export const startCronJobs = async (opts: StartCronOptions = {}): Promise<CronDescriptor[]> => {
  if (SCHEDULED.length) {
    return SCHEDULED.map((j) => ({ name: j.name, schedule: j.schedule }))
  }

  const jobsMod = await loadJobs()

  const specs: Array<{ name: string; schedule: string; run: () => Promise<unknown> }> = [
    {
      name: 'monthlyCreditReset',
      schedule: '1 0 1 * *',
      run: () => jobsMod.monthlyCreditReset(),
    },
    {
      name: 'purgeExpiredOtps',
      schedule: '0 * * * *',
      run: () => jobsMod.purgeExpiredOtps(),
    },
    {
      name: 'releaseStaleReservations',
      schedule: '*/30 * * * *',
      run: () => jobsMod.releaseStaleReservations(),
    },
  ]

  if (opts.dryRun) {
    return specs.map((s) => ({ name: s.name, schedule: s.schedule }))
  }

  SCHEDULED = specs.map((spec) => {
    const job = new CronJob(spec.schedule, wrapSafe(spec.name, spec.run), null, true, TZ)
    return { name: spec.name, schedule: spec.schedule, job }
  })

  console.info(
    `[cron] scheduled ${SCHEDULED.length} jobs (${TZ}): ${SCHEDULED.map(
      (j) => `${j.name}@'${j.schedule}'`,
    ).join(', ')}`,
  )

  return SCHEDULED.map((j) => ({ name: j.name, schedule: j.schedule }))
}

/** Stop all scheduled jobs (test cleanup / graceful shutdown). */
export const stopCronJobs = (): void => {
  for (const j of SCHEDULED) {
    try {
      j.job.stop()
    } catch (err) {
      console.warn(`[cron] failed to stop ${j.name}`, err)
    }
  }
  SCHEDULED = []
}

/** Exposed for tests — synchronously fire one job by name (bypasses schedule). */
export const fireCronJobOnce = async (name: string): Promise<void> => {
  const jobsMod = await loadJobs()
  switch (name) {
    case 'monthlyCreditReset':
      await wrapSafe(name, () => jobsMod.monthlyCreditReset())()
      return
    case 'purgeExpiredOtps':
      await wrapSafe(name, () => jobsMod.purgeExpiredOtps())()
      return
    case 'releaseStaleReservations':
      await wrapSafe(name, () => jobsMod.releaseStaleReservations())()
      return
    default:
      throw new Error(`Unknown cron job: ${name}`)
  }
}
