import type { NextRequest } from 'next/server'
import { generateLiveEvent } from '@/lib/super'

/**
 * Server-Sent Events endpoint for the /super Overview live activity feed.
 *
 * MVP behaviour: emits a synthetic ActivityEvent every 2-4 seconds. When
 * `services/api` (W3) ships its real BullMQ event bus, swap the body of the
 * `pump()` loop for a `subscribe('activity')` consumer and forward each
 * event verbatim — the client contract (event name + JSON payload) won't
 * change.
 *
 * Edge runtime: keeps the stream cheap on Cloudflare Pages.
 */
export const runtime = 'edge'
export const dynamic = 'force-dynamic'

const ENCODER = new TextEncoder()

function sse(event: string, data: unknown): Uint8Array {
  return ENCODER.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
}

export async function GET(request: NextRequest): Promise<Response> {
  let timer: ReturnType<typeof setTimeout> | undefined
  let seed = Date.now() & 0xffffffff

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(sse('hello', { ok: true, ts: Date.now() }))

      const pump = () => {
        if (request.signal.aborted) return
        seed = (seed * 16807 + 1) >>> 0
        const event = generateLiveEvent(seed)
        controller.enqueue(sse('activity', event))
        const nextDelay = 2000 + Math.floor(Math.random() * 2000)
        timer = setTimeout(pump, nextDelay)
      }

      timer = setTimeout(pump, 1500)

      request.signal.addEventListener('abort', () => {
        if (timer) clearTimeout(timer)
        try {
          controller.close()
        } catch {
          // controller already closed
        }
      })
    },
    cancel() {
      if (timer) clearTimeout(timer)
    },
  })

  return new Response(stream, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
