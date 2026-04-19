/**
 * 12-step AI pipeline (docs/MASTER.md §5.4 — "Visualised spell-casting").
 *
 * Each step is rendered as a typed-out reasoning bubble in the
 * `/generate` preview route. Durations are intentionally short so the
 * full reel finishes in under 90 seconds — long enough to feel real,
 * short enough that visitors stick around.
 */

export interface PipelineStep {
  index: number
  /** Public-facing label shown in the timeline. */
  label: string
  /** Short subtitle (the agent doing the work). */
  agent: string
  /** Lines of "thinking" output that stream during the step. */
  thoughts: string[]
  /** Total duration in ms (lines are streamed evenly inside it). */
  durationMs: number
  /** Cost displayed in the side panel. */
  credits: number
}

export const forgePipeline: PipelineStep[] = [
  {
    index: 1,
    label: 'Reading your world',
    agent: 'Scraper',
    durationMs: 5500,
    credits: 0,
    thoughts: [
      'Detected platform: Shopify (storefront API present)',
      'Fetched /products.json — 12 products across 3 collections',
      'Sampled 4 product pages + homepage screenshot (1440×900)',
      'Confidence 0.96 — ready for analysis',
    ],
  },
  {
    index: 2,
    label: 'Seeing your aesthetic',
    agent: 'Vision Analyzer · Claude Sonnet',
    durationMs: 5500,
    credits: 12,
    thoughts: [
      'Inspecting hero composition · negative space · light direction',
      'Visual quality 4 / 10 — generic Shopify Dawn theme · weak typography',
      'Color extraction: cream #F5EFE6 · walnut #8B5A3C · charcoal #2D2A26',
      'Style cues: handcrafted · Scandinavian · warm white window light',
    ],
  },
  {
    index: 3,
    label: 'Finding your tribe',
    agent: 'Brand Analyzer · Claude Sonnet',
    durationMs: 5500,
    credits: 8,
    thoughts: [
      'Tone of voice: warm · honest · slow',
      "Reference brands: Grimm's · Oeuf NYC · HAY",
      'Audience: design-conscious parents · 30-40 · disposable income',
      'Brand archetype: Caregiver + Artist',
    ],
  },
  {
    index: 4,
    label: 'Composing the vision',
    agent: 'Planner · Claude Opus',
    durationMs: 6500,
    credits: 20,
    thoughts: [
      'Drafting SiteDSL: 6-section homepage + product / FAQ / about',
      'Picking Visual DNA: Nordic Minimal (match score 0.87)',
      'Picking Hero Moment: M04 Breathing Still — 7s loop, static camera',
      'Allocating credits across copy + assets + 3D / video budget',
    ],
  },
  {
    index: 5,
    label: 'Writing the story',
    agent: 'Copywriter · Claude Sonnet',
    durationMs: 6500,
    credits: 30,
    thoughts: [
      'Hero headline: "Slow play, sturdy joy."',
      'Value props × 3 — Heritage materials · Quiet design · Parent-tested',
      'Brand story: 4 paragraphs, in your voice, FTC-friendly claims',
      'SEO title + description + 6 product summaries rewritten',
    ],
  },
  {
    index: 6,
    label: 'Forging the hero moment',
    agent: 'Artist · Kling 2.0',
    durationMs: 9500,
    credits: 150,
    thoughts: [
      'Prompt: "Wooden rainbow stacker on linen, warm window light…"',
      'Render attempt 1 of 2 — color graded to Nordic Minimal',
      'Loop check: first/last frames identical · 7.0 s · 24 fps',
      'Hero loop ready · 4.1 MB AV1 · 2.7 MB H.265 fallback',
    ],
  },
  {
    index: 7,
    label: 'Crafting the details',
    agent: 'Artist · Flux 1.1 Pro + Kling',
    durationMs: 9500,
    credits: 90,
    thoughts: [
      'Value Prop micro-loop 1 of 3 — artisan hands sanding wood',
      'Value Prop micro-loop 2 of 3 — macro grain texture · soft focus',
      'Value Prop micro-loop 3 of 3 — Scandinavian forest morning',
      '6 product Showcase clips queued · 25 credits each',
    ],
  },
  {
    index: 8,
    label: 'Capturing your soul',
    agent: 'Artist · Kling 2.0',
    durationMs: 7000,
    credits: 200,
    thoughts: [
      'Brand Story 12s loop — workshop at dawn, light through window',
      'Wood shavings drift in shaft of light · gentle camera push',
      'Render OK · uploading to R2 · linking to /story',
    ],
  },
  {
    index: 9,
    label: 'Checking the law',
    agent: 'Compliance Agent',
    durationMs: 5000,
    credits: 20,
    thoughts: [
      'Sweeping copy: FTC · CPSIA · GDPR · ASA · CASL',
      '0 critical findings · 1 advisory: clarify "naturally finished" claim',
      'Recommended fix applied · re-sweeping … pass',
    ],
  },
  {
    index: 10,
    label: 'Tuning for Google + AI',
    agent: 'SEO / GEO',
    durationMs: 5500,
    credits: 40,
    thoughts: [
      'sitemap.xml · robots.txt · canonical tags written',
      'Schema.org: Organization · Product × 12 · BreadcrumbList · FAQPage',
      'llms.txt + llms-full.txt generated for AI crawlers',
      'Image alt text inferred for 38 assets',
    ],
  },
  {
    index: 11,
    label: 'Building the machine',
    agent: 'Compiler',
    durationMs: 6000,
    credits: 50,
    thoughts: [
      'SiteDSL → Next.js 14 project (108 files)',
      'Inlined Visual DNA tokens · Tailwind preset · fonts subset',
      'Bundling assets into Cloudflare R2 · 8.7 MB total',
      'Build OK · ready to deploy',
    ],
  },
  {
    index: 12,
    label: 'Going live',
    agent: 'Deployer',
    durationMs: 5500,
    credits: 10,
    thoughts: [
      'Cloudflare Pages: provisioning toybloom.forgely.app',
      'Issuing SSL certificate · enabling cache · binding R2',
      'Initialising Medusa tenant · importing 12 products + 3 collections',
      'Live: https://toybloom.forgely.app — generated in 4m 38s',
    ],
  },
]

export function totalCredits(): number {
  return forgePipeline.reduce((sum, step) => sum + step.credits, 0)
}

export function totalDurationMs(): number {
  return forgePipeline.reduce((sum, step) => sum + step.durationMs, 0)
}
