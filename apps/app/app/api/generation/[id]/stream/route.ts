/**
 * SSE — `/api/generation/[id]/stream`
 *
 * Streams 12-step pipeline progress to the frontend. The wire protocol
 * (see `@forgely/worker/events`):
 *
 *   event: step
 *   id:    <redis-stream-id>      ← lets the browser resume after reconnect
 *   data:  { id, step, status, ts, payload?, errorMessage? }
 *
 * Reconnect semantics:
 *   - EventSource automatically sends `Last-Event-Id` on reconnect. We
 *     resume from that cursor so the UI never skips events.
 *   - When no cursor is supplied, we first replay the last 100 entries
 *     so a fresh navigation rehydrates the full state at once, then
 *     switch into a blocking `XREAD` tail.
 *
 * Degradation: when Redis is unavailable, the route closes immediately
 * with an `error` event — the client then falls back to polling
 * `/api/generation/[id]/status` (which hits Postgres only).
 *
 * @owner W3 — Sprint 3
 */
import { tailSteps, readStepHistory, STEP_NAMES } from '@forgely/worker/events'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const TERMINAL_STEP = STEP_NAMES[STEP_NAMES.length - 1] // 'compliance'

interface RouteContext {
  params: { id: string }
}

export async function GET(req: Request, ctx: RouteContext): Promise<Response> {
  const { id } = ctx.params
  const encoder = new TextEncoder()
  const lastEventId = req.headers.get('last-event-id') ?? ''

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let closed = false
      const push = (chunk: string): void => {
        if (closed) return
        try {
          controller.enqueue(encoder.encode(chunk))
        } catch {
          closed = true
        }
      }
      const sendEvent = (event: string, data: unknown, eventId?: string): void => {
        if (eventId) push(`id: ${eventId}\n`)
        push(`event: ${event}\n`)
        push(`data: ${JSON.stringify(data)}\n\n`)
      }

      // Initial comment lets proxies flush headers immediately.
      push(': connected\n\n')

      try {
        // Replay on cold start — never on reconnect (the client already has them).
        if (!lastEventId) {
          const history = await readStepHistory(id, 100)
          for (const evt of history) {
            sendEvent('step', evt, evt.id)
          }
        }

        let succeededSteps = 0
        let failedStep = false

        for await (const evt of tailSteps(id, {
          fromId: lastEventId || '$',
          blockMs: 15_000,
        })) {
          if (evt.step === 'heartbeat') {
            sendEvent('heartbeat', { ts: evt.ts })
            continue
          }
          sendEvent('step', evt, evt.id)
          if (evt.status === 'succeeded' || evt.status === 'skipped') succeededSteps += 1
          if (evt.status === 'failed') failedStep = true

          if (
            (evt.step === TERMINAL_STEP &&
              (evt.status === 'succeeded' || evt.status === 'skipped')) ||
            (failedStep && evt.step === TERMINAL_STEP)
          ) {
            sendEvent('done', { ts: evt.ts, succeededSteps, failedStep })
            break
          }
          if (evt.status === 'failed') {
            // Keep streaming (so the skipped markers drain) but flag overall failure.
          }
        }
      } catch (err) {
        sendEvent('error', {
          message: 'stream interrupted',
          error: (err as Error).message,
        })
      } finally {
        closed = true
        try {
          controller.close()
        } catch {
          /* already closed */
        }
      }
    },
    cancel() {
      // Client aborted (navigated away). The generator holds a blocking
      // XREAD — it unblocks on the next heartbeat (every 15s) and exits.
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
