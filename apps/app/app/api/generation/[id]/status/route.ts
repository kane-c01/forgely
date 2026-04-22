/**
 * REST fallback — `/api/generation/[id]/status`
 *
 * Returns a snapshot of the generation + all 12 step rows from Postgres.
 * The frontend `useGenerationStream` hook polls this every 2s when the
 * SSE channel is unavailable (Redis down / proxy strips text/event-stream)
 * so the "施法" UI degrades gracefully.
 *
 * @owner W3 — Sprint 3
 */
import { prisma } from '@forgely/api/db'

import { STEP_NAMES } from '@forgely/worker/events'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface RouteContext {
  params: { id: string }
}

interface StepSnapshot {
  stepName: string
  status: string
  ordinal: number
  startedAt: string | null
  completedAt: string | null
  durationMs: number | null
  errorMessage: string | null
  payload: unknown
}

export async function GET(_req: Request, ctx: RouteContext): Promise<Response> {
  const { id } = ctx.params
  const gen = await prisma.generation.findUnique({
    where: { id },
    include: {
      stepRows: { orderBy: { ordinal: 'asc' } },
    },
  })
  if (!gen) {
    return Response.json({ error: 'generation not found' }, { status: 404 })
  }
  const rowsByName = new Map(gen.stepRows.map((s) => [s.stepName, s]))
  const steps: StepSnapshot[] = STEP_NAMES.map((name, ordinal) => {
    const row = rowsByName.get(name)
    return {
      stepName: name,
      ordinal,
      status: row?.status ?? 'queued',
      startedAt: row?.startedAt?.toISOString() ?? null,
      completedAt: row?.completedAt?.toISOString() ?? null,
      durationMs: row?.durationMs ?? null,
      errorMessage: row?.errorMessage ?? null,
      payload: row?.payload ?? null,
    }
  })

  return Response.json({
    generationId: gen.id,
    siteId: gen.siteId,
    userId: gen.userId,
    status: gen.status,
    startedAt: gen.startedAt?.toISOString() ?? null,
    completedAt: gen.completedAt?.toISOString() ?? null,
    errorMessage: gen.errorMessage,
    steps,
  })
}
