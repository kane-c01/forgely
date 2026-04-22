/**
 * SSE — `/api/generation/[id]/stream`
 *
 * Streams 12-step pipeline progress events to the frontend so the
 * "施法" UI can show live status without polling. Backed by the per-job
 * Redis Stream populated by services/worker.
 *
 * EventSource client:
 *   const es = new EventSource(`/api/generation/${id}/stream`)
 *   es.onmessage = (e) => { const evt = JSON.parse(e.data); ... }
 *
 * Side-effect: every event is upserted to the `GenerationStep` Prisma
 * table so super-admins can see historical pipelines even after the
 * Redis Stream rolls over (it's capped at 500 events per job).
 *
 * @owner W1 — Sprint 3 · W6 — DB persistence + catch-up
 */
import { readRecentEvents, tailEvents } from '@forgely/worker'
import { prisma } from '@forgely/api/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface RouteContext {
  params: { id: string }
}

type StepEvent = { step: string; progress?: number; ts?: number; message?: string }

/** 12 ordinal slots — must match services/worker events + spell-steps.ts. */
const SPELL_STEP_IDS = [
  'connecting',
  'scraping',
  'analyzing',
  'planning',
  'directing',
  'copywriting',
  'generating_assets',
  'compositing',
  'compiling',
  'optimising',
  'deploying',
  'finished',
] as const

async function recordStep(generationId: string, evt: StepEvent): Promise<void> {
  try {
    const ordinal = SPELL_STEP_IDS.indexOf(evt.step as (typeof SPELL_STEP_IDS)[number])
    if (ordinal < 0) return

    const existing = await prisma.generationStep.findFirst({
      where: { generationId, stepName: evt.step },
    })

    const now = new Date(evt.ts ?? Date.now())
    const isTerminal = evt.step === 'finished' || (evt.progress ?? 0) >= 1

    if (existing) {
      await prisma.generationStep.update({
        where: { id: existing.id },
        data: {
          status: isTerminal ? 'completed' : 'running',
          completedAt: isTerminal ? now : existing.completedAt,
          ordinal,
        },
      })
    } else {
      await prisma.generationStep.create({
        data: {
          generationId,
          stepName: evt.step,
          ordinal,
          status: isTerminal ? 'completed' : 'running',
          startedAt: now,
          ...(isTerminal ? { completedAt: now } : {}),
        },
      })
    }

    // Cascade: when a step becomes running, mark all earlier steps as
    // completed (the pipeline is strictly sequential so by definition
    // they must be).
    if (!isTerminal) {
      await prisma.generationStep.updateMany({
        where: {
          generationId,
          status: { in: ['pending', 'running'] },
          ordinal: { lt: ordinal },
          stepName: { not: evt.step },
        },
        data: { status: 'completed', completedAt: now },
      })
    }

    // Mirror the overall Generation row status.
    if (evt.step === 'finished') {
      await prisma.generation.update({
        where: { id: generationId },
        data: { status: 'completed', completedAt: now },
      })
    }
  } catch {
    // DB persistence is best-effort — never break the SSE stream on
    // a failed upsert (the Redis Stream is the source of truth).
  }
}

export async function GET(_req: Request, ctx: RouteContext): Promise<Response> {
  const { id } = ctx.params
  const encoder = new TextEncoder()
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: string, data: unknown): void => {
        controller.enqueue(encoder.encode(`event: ${event}\n`))
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
      }

      // Immediately send a handshake event so the client's EventSource
      // `onopen` fires and the Topbar badge flips to "live".
      send('hello', { jobId: id, ts: Date.now() })

      // 1. Catch-up — replay the last 50 events the client may have missed.
      try {
        const recent = await readRecentEvents(id, 50)
        for (const evt of recent) {
          send('step', evt)
          void recordStep(id, evt as StepEvent)
        }
      } catch (err) {
        // Redis unavailable — fall back to reading the DB snapshot so
        // the UI still shows whatever persisted state we have.
        try {
          const rows = await prisma.generationStep.findMany({
            where: { generationId: id },
            orderBy: { ordinal: 'asc' },
          })
          for (const row of rows) {
            send('step', {
              step: row.stepName,
              progress: row.status === 'completed' ? 1 : 0.5,
              ts: (row.completedAt ?? row.startedAt ?? new Date()).getTime(),
            })
          }
          if (rows.length === 0) {
            send('error', {
              message: 'stream unavailable and no persisted steps yet',
              error: (err as Error).message,
            })
          }
        } catch (dbErr) {
          send('error', {
            message: 'failed to read events (redis + db both unreachable)',
            error: (dbErr as Error).message,
          })
        }
      }

      // 2. Live tail — block on the per-generation stream.
      try {
        for await (const evt of tailEvents(id)) {
          if (evt.step === 'heartbeat') {
            send('heartbeat', { ts: evt.ts })
          } else {
            send('step', evt)
            void recordStep(id, evt as StepEvent)
            if (evt.step === 'finished') {
              send('done', { ts: evt.ts })
              controller.close()
              break
            }
          }
        }
      } catch (err) {
        send('error', { message: 'stream interrupted', error: (err as Error).message })
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'content-type': 'text/event-stream; charset=utf-8',
      'cache-control': 'no-cache, no-transform',
      connection: 'keep-alive',
      'x-accel-buffering': 'no',
    },
  })
}
