/**
 * BullMQ queue + worker bindings for the Forgely generation pipeline.
 *
 * Provides a single named queue `forgely-generation` plus a worker that
 * pulls jobs and runs `runPipeline` against the per-job payload. Other
 * services dispatch by importing `queue.add(...)`.
 *
 * Source: docs/MASTER.md §5.3 + §13. Region-agnostic — Redis credentials
 * point at Upstash (海外) or 阿里云 Redis 标准版 (国内) via REDIS_URL.
 *
 * @owner W1 — Sprint 3 (queue + SSE)
 */
import IORedis, { type Redis as IORedisInstance } from 'ioredis'
import { Queue, Worker, type Job, type WorkerOptions } from 'bullmq'

import { type PipelineHooks, type PipelineInput, type PipelineResult } from './pipeline'
import { runPipelineWithEvents } from './pipeline-wrapper'
import { emitStep, seedSteps } from './events'

export const QUEUE_NAME = 'forgely-generation'

let connection: IORedisInstance | undefined
let queue: Queue<PipelineInput, PipelineResult> | undefined

function getConnection(): IORedisInstance {
  if (connection) return connection
  const url = process.env.REDIS_URL
  if (!url) {
    throw new Error(
      'REDIS_URL not set — cannot initialise BullMQ. Set REDIS_URL to a redis:// or rediss:// URL.',
    )
  }
  connection = new IORedis(url, {
    maxRetriesPerRequest: null, // BullMQ requires this
    enableReadyCheck: false,
  })
  return connection
}

/** Lazy-init the producer queue. Safe to call from any HTTP handler. */
export function getQueue(): Queue<PipelineInput, PipelineResult> {
  if (queue) return queue
  queue = new Queue<PipelineInput, PipelineResult>(QUEUE_NAME, {
    connection: getConnection(),
    defaultJobOptions: {
      attempts: 2,
      backoff: { type: 'exponential', delay: 30_000 },
      removeOnComplete: 200,
      removeOnFail: 500,
    },
  })
  return queue
}

/** Enqueue a pipeline run. Returns the job id (also used as Generation.id). */
export async function enqueueGeneration(
  input: PipelineInput,
  opts: { generationId: string; priority?: number } = { generationId: '' },
): Promise<string> {
  const q = getQueue()
  const job = await q.add(opts.generationId || `gen_${Date.now()}`, input, {
    jobId: opts.generationId || undefined,
    priority: opts.priority ?? 5,
  })
  return job.id ?? opts.generationId
}

export interface StartWorkerOptions {
  /** Optional override of pipeline hooks per worker instance. */
  hooksFor: (job: Job<PipelineInput>) => PipelineHooks
  /** Number of jobs processed in parallel. Default 2 — generation is heavy. */
  concurrency?: number
  /** Standard BullMQ worker options pass-through. */
  workerOptions?: Partial<WorkerOptions>
}

/**
 * Start the queue worker. Long-lived; call once from `services/worker`
 * boot script. The worker auto-publishes pipeline `onStep` events to
 * the `forgely-generation:events` Redis Stream so SSE clients can tail it.
 */
export function startGenerationWorker(
  opts: StartWorkerOptions,
): Worker<PipelineInput, PipelineResult> {
  const conn = getConnection()
  const worker = new Worker<PipelineInput, PipelineResult>(
    QUEUE_NAME,
    async (job) => {
      const generationId = job.id ?? `gen_${Date.now()}`
      const baseHooks = opts.hooksFor(job)
      const hooks: PipelineHooks = {
        ...baseHooks,
        onStep: async (step, progress) => {
          baseHooks.onStep?.(step, progress)
          // Keep legacy BullMQ progress reporting for the admin Bull Board.
          await job.updateProgress({ step, progress })
        },
      }
      // The wrapper emits `failed` on the active step before throwing;
      // we simply surface the exception so BullMQ records + retries.
      return runPipelineWithEvents(job.data, hooks, { generationId })
    },
    {
      connection: conn,
      concurrency: opts.concurrency ?? 2,
      ...opts.workerOptions,
    },
  )

  worker.on('failed', (job, err) => {
    console.error(`[worker] job ${job?.id ?? '?'} failed:`, err.message)
  })
  worker.on('completed', (job) => {
    console.info(`[worker] job ${job.id} completed in ${job.processedOn ?? 0}ms`)
  })
  worker.on('active', (job) => {
    // Mark the `scrape` step as queued→running as early as possible so
    // the SSE UI sees activity within milliseconds of `generate.commit`.
    void seedSteps(job.id ?? 'unknown').catch(() => {})
  })

  return worker
}

/** Emit a pre-queue event so the UI sees `queued` status immediately on commit. */
export async function signalQueued(generationId: string): Promise<void> {
  await seedSteps(generationId)
  await emitStep({ generationId, step: 'scrape', status: 'queued' })
}

/** Disconnect — used in tests and graceful shutdown. */
export async function shutdownQueue(): Promise<void> {
  await queue?.close()
  await connection?.quit()
  queue = undefined
  connection = undefined
}

// Backwards-compat named re-exports so existing importers
// (`@forgely/worker/queue`) still type-check while Sprint 3 migrates them
// to `@forgely/worker/events`.
export { readStepHistory as readRecentEvents, tailSteps as tailEvents } from './events'
