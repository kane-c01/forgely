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

import { runPipeline, type PipelineHooks, type PipelineInput, type PipelineResult } from './pipeline'

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
export function startGenerationWorker(opts: StartWorkerOptions): Worker<PipelineInput, PipelineResult> {
  const conn = getConnection()
  const worker = new Worker<PipelineInput, PipelineResult>(
    QUEUE_NAME,
    async (job) => {
      const baseHooks = opts.hooksFor(job)
      const hooks: PipelineHooks = {
        ...baseHooks,
        onStep: async (step, progress) => {
          baseHooks.onStep?.(step, progress)
          await publishStep(conn, job.id ?? 'unknown', step, progress)
          await job.updateProgress({ step, progress })
        },
      }
      return runPipeline(job.data, hooks)
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

  return worker
}

/** Publish a step event to the per-generation Redis Stream. */
async function publishStep(
  conn: IORedisInstance,
  jobId: string,
  step: string,
  progress: number,
): Promise<void> {
  await conn.xadd(
    `forgely-generation:events:${jobId}`,
    'MAXLEN',
    '~',
    '500',
    '*',
    'step',
    step,
    'progress',
    String(progress),
    'ts',
    String(Date.now()),
  )
  // Mirror onto the global topic for super-admin LIVE feed.
  await conn.xadd(
    'forgely-generation:events',
    'MAXLEN',
    '~',
    '5000',
    '*',
    'jobId',
    jobId,
    'step',
    step,
    'progress',
    String(progress),
    'ts',
    String(Date.now()),
  )
}

/** Read recent events for one generation (for SSE catch-up on reconnect). */
export async function readRecentEvents(
  generationId: string,
  count = 50,
): Promise<Array<{ step: string; progress: number; ts: number }>> {
  const conn = getConnection()
  const entries = (await conn.xrevrange(
    `forgely-generation:events:${generationId}`,
    '+',
    '-',
    'COUNT',
    String(count),
  )) as Array<[string, string[]]>
  return entries
    .reverse()
    .map(([, fields]) => {
      const obj: Record<string, string> = {}
      for (let i = 0; i < fields.length; i += 2) {
        obj[fields[i]!] = fields[i + 1]!
      }
      return {
        step: obj.step ?? 'unknown',
        progress: Number(obj.progress ?? '0'),
        ts: Number(obj.ts ?? Date.now()),
      }
    })
}

/** Tail a per-generation event stream from `lastId` forward (blocking). */
export async function* tailEvents(
  generationId: string,
  lastId: string = '$',
): AsyncGenerator<{ id: string; step: string; progress: number; ts: number }> {
  const conn = getConnection()
  let cursor = lastId
  while (true) {
    const entries = (await conn.xread(
      'BLOCK',
      30_000,
      'STREAMS',
      `forgely-generation:events:${generationId}`,
      cursor,
    )) as Array<[string, Array<[string, string[]]>]> | null
    if (!entries || entries.length === 0) {
      yield { id: cursor, step: 'heartbeat', progress: 0, ts: Date.now() }
      continue
    }
    const stream = entries[0]?.[1] ?? []
    for (const [id, fields] of stream) {
      cursor = id
      const obj: Record<string, string> = {}
      for (let i = 0; i < fields.length; i += 2) {
        obj[fields[i]!] = fields[i + 1]!
      }
      yield {
        id,
        step: obj.step ?? 'unknown',
        progress: Number(obj.progress ?? '0'),
        ts: Number(obj.ts ?? Date.now()),
      }
    }
  }
}

/** Disconnect — used in tests and graceful shutdown. */
export async function shutdownQueue(): Promise<void> {
  await queue?.close()
  await connection?.quit()
  queue = undefined
  connection = undefined
}
