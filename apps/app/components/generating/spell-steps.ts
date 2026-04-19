/**
 * The 12-step "施法" pipeline as it appears to the user.
 *
 * The actual `services/worker.PipelineStep` enum has 8 backend stages —
 * we expand them into 12 UI cards so the cinematic feel matches
 * docs/MASTER.md §13. Backend events (`step: 'analyzing' | 'planning' |
 * ...`) map onto the closest UI step via `STAGE_TO_INDEX`.
 */
export interface SpellStep {
  id: string
  label: string
  emoji: string
  /** Single line shown under the label while in-progress. */
  detail: string
}

export const SPELL_STEPS: SpellStep[] = [
  {
    id: 'connecting',
    label: 'Connecting to source',
    emoji: '🔌',
    detail: 'Establishing secure handshake.',
  },
  {
    id: 'scraping',
    label: 'Scraping catalogue',
    emoji: '🕸️',
    detail: 'Reading products, photos, prices.',
  },
  {
    id: 'analyzing',
    label: 'Analyzing brand',
    emoji: '🔍',
    detail: 'Inferring tone, palette, audience.',
  },
  { id: 'planning', label: 'Planning sections', emoji: '🧭', detail: 'Choosing layout + flow.' },
  { id: 'directing', label: 'Directing scenes', emoji: '🎬', detail: 'Storyboarding the hero.' },
  { id: 'copywriting', label: 'Writing copy', emoji: '✍️', detail: 'En + Zh-CN headlines.' },
  {
    id: 'generating_assets',
    label: 'Forging media',
    emoji: '🖼️',
    detail: 'Hero video, lifestyle stills.',
  },
  {
    id: 'compositing',
    label: 'Compositing',
    emoji: '🧵',
    detail: 'Stitching layers + colour grade.',
  },
  { id: 'compiling', label: 'Compiling site', emoji: '⚙️', detail: 'Tailwind, RSC, hydration.' },
  { id: 'optimising', label: 'Optimising', emoji: '⚡', detail: 'Image CDN + edge cache.' },
  { id: 'deploying', label: 'Deploying to edge', emoji: '🚀', detail: 'Cloudflare Pages.' },
  { id: 'finished', label: 'Forged', emoji: '✨', detail: 'Your site is live.' },
]

export type SpellStatus = 'pending' | 'running' | 'done' | 'error'

/** Map server `PipelineStep` events → UI step id. */
export const STAGE_TO_INDEX: Record<string, number> = {
  connecting: 0,
  scraping: 1,
  scraped: 1,
  analyzing: 2,
  planning: 3,
  directing: 4,
  copywriting: 5,
  generating_assets: 6,
  compositing: 7,
  compiling: 8,
  optimising: 9,
  deploying: 10,
  finished: 11,
}
