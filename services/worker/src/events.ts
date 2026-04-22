/**
 * Generation event bus — Redis Streams + GenerationStep projection.
 *
 * Shape of the contract (docs/SPRINT-3-DISPATCH.md):
 *   - Stream key:   `forgely:gen:{generationId}`
 *   - Fields:       step | status | ts | payload (JSON)
 *   - Steps (12):   scrape | analyze | plan | direct | copywrite |
 *                   gen-hero | gen-products | gen-brand-assets |
 *                   compile | deploy | seo | compliance
 *   - Statuses (5): queued | running | succeeded | failed | skipped
 *
 * Every call to `emitStep` atomically:
 *   1. Appends to the per-job Redis Stream (consumed by SSE).
 *   2. Mirrors onto the global `forgely:gen:all` stream for super-admin LIVE.
 *   3. Upserts the matching `GenerationStep` row so the UI can cold-start
 *      (or fall back to polling) without replaying the whole stream.
 *
 * Producers: `pipeline-wrapper.ts` — wraps `runPipeline` and emits
 * `running`/`succeeded`/`failed` around each of the 12 logical stages.
 * Consumers: the SSE route (`tailSteps`) and the status endpoint
 * (`readStepHistory` + Prisma lookup).
 *
 * @owner W3 — Sprint 3 (generation pipeline SSE)
 */
import { PrismaClient } from '@prisma/client'
import IORedis, { type Redis as IORedisInstance } from 'ioredis'

export const STEP_NAMES = [
  'scrape',
  'analyze',
  'plan',
  'direct',
  'copywrite',
  'gen-hero',
  'gen-products',
  'gen-brand-assets',
  'compile',
  'deploy',
  'seo',
  'compliance',
] as const

export type StepName = (typeof STEP_NAMES)[number]

export const STEP_STATUSES = ['queued', 'running', 'succeeded', 'failed', 'skipped'] as const
export type StepStatus = (typeof STEP_STATUSES)[number]

export interface StepEvent {
  /** Redis stream entry id (e.g. `1700000000000-0`). */
  id: string
  step: StepName | 'heartbeat' | string
  status: StepStatus | 'heartbeat'
  ts: number
  payload?: Record<string, unknown>
  /** Present for `failed` events. */
  errorMessage?: string
}

export function streamKey(generationId: string): string {
  return `forgely:gen:${generationId}`
}

/** Global topic (super-admin feed / live ops dashboard). */
export const GLOBAL_STREAM = 'forgely:gen:all'

// ─────────────────────────────────────────────────────────────────────────
//  Singletons — Redis + Prisma. Both are safe to share across workers.
// ─────────────────────────────────────────────────────────────────────────

let redis: IORedisInstance | undefined
let prisma: PrismaClient | undefined

function getRedis(): IORedisInstance {
  if (redis) return redis
  const url = process.env.REDIS_URL
  if (!url) {
    throw new Error(
      '[events] REDIS_URL not set — cannot publish AgentEvents. ' +
        'Set REDIS_URL to the worker env (services/worker).',
    )
  }
  redis = new IORedis(url, { maxRetriesPerRequest: null, enableReadyCheck: false })
  return redis
}

function getPrisma(): PrismaClient {
  if (prisma) return prisma
  prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'production' ? ['error'] : ['error', 'warn'],
  })
  return prisma
}

// ─────────────────────────────────────────────────────────────────────────
//  Writers
// ─────────────────────────────────────────────────────────────────────────

export interface EmitStepInput {
  generationId: string
  step: StepName
  status: StepStatus
  payload?: Record<string, unknown>
  errorMessage?: string
  /** Optional override (test helpers / replay). */
  ts?: number
}

/**
 * Publish a single step event.
 *
 * Stream fields are string-only (Redis Streams limitation). We JSON-encode
 * `payload` and `errorMessage` and decode on the read side.
 */
export async function emitStep(input: EmitStepInput): Promise<StepEvent> {
  const ts = input.ts ?? Date.now()
  const payloadJson = input.payload ? JSON.stringify(input.payload) : ''
  const fields: string[] = [
    'generationId',
    input.generationId,
    'step',
    input.step,
    'status',
    input.status,
    'ts',
    String(ts),
  ]
  if (payloadJson) fields.push('payload', payloadJson)
  if (input.errorMessage) fields.push('errorMessage', input.errorMessage)

  const r = getRedis()
  let id = ''
  try {
    id = (await r.xadd(streamKey(input.generationId), 'MAXLEN', '~', '1000', '*', ...fields)) ?? ''
    // Mirror onto the global feed (best-effort; capped to 20k entries).
    await r.xadd(GLOBAL_STREAM, 'MAXLEN', '~', '20000', '*', ...fields).catch(() => {})
  } catch (err) {
    console.warn(
      `[events] XADD failed for ${input.generationId} ${input.step}:`,
      (err as Error).message,
    )
    // Continue so the DB row still mirrors the state even if Redis is down.
  }

  await persistStep(input, ts).catch((err) => {
    console.warn(
      `[events] persistStep failed for ${input.generationId} ${input.step}:`,
      (err as Error).message,
    )
  })

  return {
    id,
    step: input.step,
    status: input.status,
    ts,
    payload: input.payload,
    errorMessage: input.errorMessage,
  }
}

async function persistStep(input: EmitStepInput, ts: number): Promise<void> {
  const db = getPrisma()
  const ordinal = STEP_NAMES.indexOf(input.step)
  const now = new Date(ts)

  const existing = await db.generationStep.findUnique({
    where: {
      generationId_stepName: {
        generationId: input.generationId,
        stepName: input.step,
      },
    },
    select: { startedAt: true },
  })

  const startedAt =
    input.status === 'running' && !existing?.startedAt ? now : (existing?.startedAt ?? null)
  const completedAt =
    input.status === 'succeeded' || input.status === 'failed' || input.status === 'skipped'
      ? now
      : null
  const durationMs = completedAt && startedAt ? completedAt.getTime() - startedAt.getTime() : null

  await db.generationStep.upsert({
    where: {
      generationId_stepName: {
        generationId: input.generationId,
        stepName: input.step,
      },
    },
    update: {
      status: input.status,
      ordinal: ordinal >= 0 ? ordinal : 0,
      startedAt: startedAt ?? undefined,
      completedAt: completedAt ?? undefined,
      durationMs: durationMs ?? undefined,
      errorMessage: input.errorMessage ?? undefined,
      payload: (input.payload as object | undefined) ?? undefined,
    },
    create: {
      generationId: input.generationId,
      stepName: input.step,
      status: input.status,
      ordinal: ordinal >= 0 ? ordinal : 0,
      startedAt: startedAt ?? undefined,
      completedAt: completedAt ?? undefined,
      durationMs: durationMs ?? undefined,
      errorMessage: input.errorMessage ?? undefined,
      payload: (input.payload as object | undefined) ?? undefined,
    },
  })
}

/**
 * Pre-create all 12 step rows (status=queued) so the UI can render
 * the full list even before the worker picks up the job. Safe to call
 * multiple times — relies on the `@@unique([generationId, stepName])`.
 */
export async function seedSteps(generationId: string): Promise<void> {
  const db = getPrisma()
  await db.$transaction(
    STEP_NAMES.map((step, ordinal) =>
      db.generationStep.upsert({
        where: { generationId_stepName: { generationId, stepName: step } },
        update: {},
        create: {
          generationId,
          stepName: step,
          status: 'queued',
          ordinal,
        },
      }),
    ),
  )
}

// ─────────────────────────────────────────────────────────────────────────
//  Readers — SSE replay + polling fallback + super-admin global tail.
// ─────────────────────────────────────────────────────────────────────────

function decodeEntry(id: string, fields: string[]): StepEvent {
  const obj: Record<string, string> = {}
  for (let i = 0; i < fields.length; i += 2) {
    obj[fields[i]!] = fields[i + 1]!
  }
  const rawPayload = obj.payload
  let payload: Record<string, unknown> | undefined
  if (rawPayload) {
    try {
      payload = JSON.parse(rawPayload) as Record<string, unknown>
    } catch {
      payload = { raw: rawPayload }
    }
  }
  return {
    id,
    step: obj.step ?? 'unknown',
    status: (obj.status as StepStatus) ?? 'running',
    ts: Number(obj.ts ?? Date.now()),
    payload,
    errorMessage: obj.errorMessage,
  }
}

/** Read recent events (oldest→newest). Used by SSE catch-up + debugging. */
export async function readStepHistory(generationId: string, count = 100): Promise<StepEvent[]> {
  const r = getRedis()
  const entries = (await r.xrange(streamKey(generationId), '-', '+', 'COUNT', count)) as Array<
    [string, string[]]
  >
  return entries.map(([id, fields]) => decodeEntry(id, fields))
}

/** Read events strictly after `lastId` (used when client sends Last-Event-Id). */
export async function readStepsAfter(
  generationId: string,
  lastId: string,
  count = 200,
): Promise<StepEvent[]> {
  const r = getRedis()
  const after = lastId && lastId !== '0' ? `(${lastId}` : '-'
  const entries = (await r.xrange(streamKey(generationId), after, '+', 'COUNT', count)) as Array<
    [string, string[]]
  >
  return entries.map(([id, fields]) => decodeEntry(id, fields))
}

export interface TailOptions {
  /** Resume cursor. `$` = only new events; `0` = from beginning. */
  fromId?: string
  /** XREAD BLOCK ms. Controls the heartbeat cadence. Default 15000. */
  blockMs?: number
}

/**
 * Long-lived async generator — yields new events as they arrive, with a
 * synthetic heartbeat yielded each time XREAD times out so the SSE route
 * can keep the connection warm against aggressive proxies.
 */
export async function* tailSteps(
  generationId: string,
  opts: TailOptions = {},
): AsyncGenerator<StepEvent> {
  const r = getRedis()
  let cursor = opts.fromId ?? '$'
  const block = opts.blockMs ?? 15_000
  // When the caller passed an explicit historical cursor, drain the
  // backlog immediately before blocking so the consumer sees everything
  // in order even if the Redis stream moved on between calls.
  if (cursor !== '$' && cursor !== '0') {
    const backlog = await readStepsAfter(generationId, cursor, 500)
    for (const ev of backlog) {
      cursor = ev.id
      yield ev
    }
  } else if (cursor === '0') {
    const backlog = await readStepHistory(generationId, 500)
    for (const ev of backlog) {
      cursor = ev.id
      yield ev
    }
  }

  while (true) {
    const reply = (await r.xread(
      'BLOCK',
      block,
      'STREAMS',
      streamKey(generationId),
      cursor,
    )) as Array<[string, Array<[string, string[]]>]> | null
    if (!reply || reply.length === 0) {
      yield {
        id: cursor,
        step: 'heartbeat',
        status: 'heartbeat',
        ts: Date.now(),
      }
      continue
    }
    const stream = reply[0]?.[1] ?? []
    for (const [id, fields] of stream) {
      cursor = id
      yield decodeEntry(id, fields)
    }
  }
}

/** Graceful shutdown (tests / hot-reload). */
export async function shutdownEvents(): Promise<void> {
  await redis?.quit().catch(() => {})
  await prisma?.$disconnect().catch(() => {})
  redis = undefined
  prisma = undefined
}
