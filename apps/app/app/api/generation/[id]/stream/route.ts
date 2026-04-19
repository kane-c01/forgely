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
 * @owner W1 — Sprint 3
 */
import { readRecentEvents, tailEvents } from '@forgely/worker'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface RouteContext {
  params: { id: string }
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

      // 1. Catch-up — replay the last 50 events the client may have missed.
      try {
        const recent = await readRecentEvents(id, 50)
        for (const evt of recent) {
          send('step', evt)
        }
      } catch (err) {
        send('error', { message: 'failed to read recent events', error: (err as Error).message })
      }

      // 2. Live tail — block on the per-generation stream.
      try {
        for await (const evt of tailEvents(id)) {
          if (evt.step === 'heartbeat') {
            send('heartbeat', { ts: evt.ts })
          } else {
            send('step', evt)
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
