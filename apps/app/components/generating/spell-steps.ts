/**
 * The 12-step "施法" pipeline as presented to the user.
 *
 * Step ids are authoritative — the worker emits the same strings via
 * `emitStep(generationId, step, status, payload)` (see
 * `@forgely/worker/events.STEP_NAMES`). Keep this file and the worker
 * constant in lock-step.
 */
export interface SpellStep {
  /** Matches `@forgely/worker/events.STEP_NAMES[i]`. */
  id: StepId
  label: string
  emoji: string
  /** Single line shown under the label while queued / running. */
  detail: string
}

export type StepId =
  | 'scrape'
  | 'analyze'
  | 'plan'
  | 'direct'
  | 'copywrite'
  | 'gen-hero'
  | 'gen-products'
  | 'gen-brand-assets'
  | 'compile'
  | 'deploy'
  | 'seo'
  | 'compliance'

export const SPELL_STEPS: SpellStep[] = [
  {
    id: 'scrape',
    label: 'Scraping catalogue',
    emoji: '🕸️',
    detail: 'Reading products, photos, prices.',
  },
  {
    id: 'analyze',
    label: 'Analyzing brand',
    emoji: '🔍',
    detail: 'Inferring tone, palette, audience.',
  },
  { id: 'plan', label: 'Planning sections', emoji: '🧭', detail: 'Choosing layout + flow.' },
  { id: 'direct', label: 'Directing scenes', emoji: '🎬', detail: 'Storyboarding the hero.' },
  { id: 'copywrite', label: 'Writing copy', emoji: '✍️', detail: 'En + Zh-CN headlines.' },
  {
    id: 'gen-hero',
    label: 'Forging hero video',
    emoji: '🎞️',
    detail: 'Cinematic 24fps hero.',
  },
  {
    id: 'gen-products',
    label: 'Rendering products',
    emoji: '🛍️',
    detail: 'Lifestyle stills per SKU.',
  },
  {
    id: 'gen-brand-assets',
    label: 'Brand assets',
    emoji: '🎨',
    detail: 'Logo variants, palette locks.',
  },
  { id: 'compile', label: 'Compiling site', emoji: '⚙️', detail: 'Tailwind, RSC, hydration.' },
  { id: 'deploy', label: 'Deploying to edge', emoji: '🚀', detail: 'Cloudflare Pages.' },
  { id: 'seo', label: 'SEO pass', emoji: '🗺️', detail: 'Schema.org + sitemap.' },
  { id: 'compliance', label: 'Compliance scan', emoji: '🛡️', detail: 'Final review + audit.' },
]

/** Status vocabulary shared across worker, SSE, DB and UI. */
export type SpellStatus = 'queued' | 'running' | 'succeeded' | 'failed' | 'skipped'

/** Fast id → index lookup. */
export const STEP_INDEX: Record<StepId, number> = Object.fromEntries(
  SPELL_STEPS.map((s, i) => [s.id, i]),
) as Record<StepId, number>
