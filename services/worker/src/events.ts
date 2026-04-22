/**
 * Generation event bus — 12-step "施法" progress tracker.
 *
 * The UI cards in `/sites/[id]/generating/page.tsx` expect 12 discrete
 * step events. The underlying `runPipeline` emits only 8 real stages
 * (analyzing → deploying), so this module fills in the extras —
 * `connecting`, `scraping`, `compositing`, `optimising` — that the UX
 * spec calls for.
 *
 * Events are:
 *   1. persisted to Redis Stream `forgely-generation:events:{jobId}`
 *      via `services/worker/src/queue.ts#publishStep` (already wired).
 *   2. consumed by the SSE endpoint
 *      `apps/app/app/api/generation/[id]/stream/route.ts` which
 *      forwards them to `EventSource` in the browser.
 *
 * Persistence to the `GenerationStep` Prisma row happens inside the SSE
 * endpoint (which already has a Prisma client) so the worker keeps a
 * slim dependency surface (no Prisma).
 *
 * @owner W6 — Sprint 3 task #6 (SSE 12-step pipeline)
 */

/** Canonical 12 UI step ids (keep in sync with apps/app/components/generating/spell-steps.ts). */
export const SPELL_STEP_IDS = [
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

export type SpellStepId = (typeof SPELL_STEP_IDS)[number]

/**
 * Map backend `PipelineStep` strings to their UI spell step ordinal.
 * Keeps STAGE_TO_INDEX in spell-steps.ts as the UI-side source of truth.
 */
export const STAGE_TO_SPELL: Record<string, SpellStepId> = {
  analyzing: 'analyzing',
  planning: 'planning',
  directing: 'directing',
  copywriting: 'copywriting',
  generating_assets: 'generating_assets',
  compiling: 'compiling',
  deploying: 'deploying',
  finished: 'finished',
}

export function spellOrdinal(step: SpellStepId): number {
  return SPELL_STEP_IDS.indexOf(step)
}
