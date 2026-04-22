/**
 * @forgely/worker — entry point.
 *
 * Sprint 0 stub kept Worker as a placeholder; T17 wired runPipeline;
 * Sprint 3 adds the BullMQ queue producer / consumer + Redis Streams
 * event bus + SSE-ready event tailers.
 *
 * Production wires this from a long-lived process (`pnpm --filter
 * @forgely/worker start`). The default `boot()` reads ENV and chooses
 * the providers automatically.
 */
import { captureException, flushSentry } from './observability/sentry'

export {
  runPipeline,
  type PipelineInput,
  type PipelineResult,
  type PipelineStep,
  type PipelineHooks,
} from './pipeline'

export {
  QUEUE_NAME,
  enqueueGeneration,
  getQueue,
  startGenerationWorker,
  signalQueued,
  readRecentEvents,
  tailEvents,
  shutdownQueue,
} from './queue'

export {
  STEP_NAMES,
  STEP_STATUSES,
  streamKey,
  GLOBAL_STREAM,
  emitStep,
  seedSteps,
  readStepHistory,
  readStepsAfter,
  tailSteps,
  shutdownEvents,
  type StepName,
  type StepStatus,
  type StepEvent,
} from './events'

export { runPipelineWithEvents } from './pipeline-wrapper'

import { resolveProvider } from '@forgely/ai-agents'

import { startCronJobs, stopCronJobs } from './cron'
import { startGenerationWorker } from './queue'

export { startCronJobs, stopCronJobs, fireCronJobOnce } from './cron'
export type { CronDescriptor, StartCronOptions } from './cron'

/** One-shot bootstrap: start the worker with sane defaults. */
export function boot(): void {
  const cfAccountId = process.env.CLOUDFLARE_ACCOUNT_ID
  const cfApiToken = process.env.CLOUDFLARE_API_TOKEN
  if (!cfAccountId || !cfApiToken) {
    console.warn(
      '[worker] CLOUDFLARE_ACCOUNT_ID/CLOUDFLARE_API_TOKEN missing — deploy step will throw at runtime.',
    )
  }
  startGenerationWorker({
    hooksFor: (job) => ({
      llm: resolveProvider(),
      deployOpts: {
        accountId: cfAccountId ?? 'unconfigured',
        apiToken: cfApiToken ?? 'unconfigured',
        projectName: `forgely-tenant-${job.data.subdomain}`,
        subdomain: job.data.subdomain,
        region: (job.data.region ?? 'global') === 'cn' ? 'cn-built' : 'global-built',
      },
      mockArtist: process.env.FORGELY_MOCK_ARTIST === '1',
    }),
    concurrency: Number(process.env.FORGELY_WORKER_CONCURRENCY ?? '2'),
  })
  console.info(
    `[worker] generation worker started · concurrency=${process.env.FORGELY_WORKER_CONCURRENCY ?? '2'}`,
  )

  if (process.env.FORGELY_CRON_AUTOBOOT !== '0') {
    startCronJobs().catch((err) => {
      console.error('[worker] cron bootstrap failed', err)
    })
  }
}

if (process.env.FORGELY_WORKER_AUTOBOOT === '1') {
  boot()
}

const flushAndExit = async (signal: NodeJS.Signals) => {
  console.info(`[worker] received ${signal}, flushing Sentry…`)
  stopCronJobs()
  await flushSentry(2000)
  process.exit(0)
}

process.on('SIGTERM', flushAndExit)
process.on('SIGINT', flushAndExit)
process.on('uncaughtException', (err) => {
  captureException(err, { handler: 'uncaughtException' })
  console.error('[worker] uncaughtException', err)
})
process.on('unhandledRejection', (reason) => {
  captureException(reason, { handler: 'unhandledRejection' })
  console.error('[worker] unhandledRejection', reason)
})
