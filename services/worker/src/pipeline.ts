/**
 * Forgely end-to-end generation pipeline.
 *
 * 一个 BullMQ job kicks the full chain:
 *   ScrapedData → Analyze → Plan → Direct → Copywrite → Generate Assets
 *               → Compile → Deploy → notify user
 *
 * Source: docs/MASTER.md §13 (12 step "施法" pipeline) + AI-DEV-GUIDE Task 17.
 *
 * 这里给 W1 的 reference implementation — services/worker 的真实
 * BullMQ job handlers 接进去时只要 require this module + provide
 * runtime config (LLM keys, Cloudflare creds 等)。
 *
 * @owner W1 — T17 (docs/MASTER.md §13)
 */
import {
  analyze,
  ANALYZER_CREDIT_COST,
  type AnalyzerOptions,
  direct,
  DIRECTOR_CREDIT_PER_SCENE,
  type LlmProvider,
  planSite,
  PLANNER_CREDIT_COST,
  writeCopy,
  COPYWRITER_CREDIT_COST,
  generateAsset,
  type ArtistResult,
  type BrandProfile,
  type DirectorScript,
  type MomentSlot,
} from '@forgely/ai-agents'
import { compile, type CompiledProject, type SiteDsl } from '@forgely/dsl'
import { deploy, type DeployOptions, type DeployResult } from '@forgely/deploy'
import type { ScrapedData } from '@forgely/scraper'

export interface PipelineInput {
  scraped: ScrapedData
  siteId: string
  subdomain: string
  brandName: string
  /** Choose by user during the conversation. */
  selectedDnaId: string
  selectedHeroMomentId: string
  /** Locale of the *generated* site (overseas → 'en' default). */
  storeLocale?: 'en' | 'zh-CN' | 'zh-HK' | 'zh-TW'
  region?: 'cn' | 'global'
}

export interface PipelineHooks {
  llm: LlmProvider
  deployOpts: DeployOptions
  /** Called for every step transition — drives the 12-step "施法" UI. */
  onStep?: (step: PipelineStep, progress: number) => void
  /** Optional: skip asset generation (mock mode for tests). */
  mockArtist?: boolean
}

/**
 * 12 UI-facing step ids for the cinematic /generating page.
 *
 * The true backend work only happens in 7 of these (analyzing through
 * deploying) — connecting / scraping / compositing / optimising are UX
 * polish events we fire around the real work so the 12-card grid fills
 * in linearly.
 */
export type PipelineStep =
  | 'connecting'
  | 'scraping'
  | 'analyzing'
  | 'planning'
  | 'directing'
  | 'copywriting'
  | 'generating_assets'
  | 'compositing'
  | 'compiling'
  | 'optimising'
  | 'deploying'
  | 'finished'

export interface PipelineResult {
  brand: BrandProfile
  dsl: SiteDsl
  director: DirectorScript
  assets: ArtistResult[]
  compiled: CompiledProject
  deployment: DeployResult
  totalCreditsUsed: number
  totalDurationMs: number
}

const ASSET_CREDIT_PER_VIDEO = 150
const ASSET_CREDIT_PER_IMAGE = 5
const ASSET_CREDIT_PER_3D = 100

export async function runPipeline(
  input: PipelineInput,
  hooks: PipelineHooks,
): Promise<PipelineResult> {
  const startedAt = Date.now()
  const tally = { credits: 0 }

  // 0a. Connecting — secure handshake to the source store.
  hooks.onStep?.('connecting', 0.02)
  await sleep(hooks.mockArtist ? 200 : 400)

  // 0b. Scraping — the data is already on `input.scraped` but we still
  // fire a UX-level event so the 12-card grid shows the step as done.
  hooks.onStep?.('scraping', 0.05)
  await sleep(hooks.mockArtist ? 200 : 400)

  // 1. Analyze
  hooks.onStep?.('analyzing', 0.1)
  const analyzerOpts: AnalyzerOptions = { provider: hooks.llm }
  const { profile: brand } = await analyze(input.scraped, analyzerOpts)
  tally.credits += ANALYZER_CREDIT_COST

  const products = input.scraped.products.slice(0, 12).map((p) => ({
    id: p.id,
    title: p.title,
    category: p.category,
    priceCents: p.priceFrom.amountCents,
    description: p.description ?? '',
    handle: p.handle,
    currency: p.priceFrom.currency,
    imageUrl: p.images[0]?.url ?? 'https://placehold.co/1024x1024.jpg',
  }))

  // 2. Plan SiteDSL
  hooks.onStep?.('planning', 0.25)
  const planResult = await planSite({
    provider: hooks.llm,
    brand,
    dna: input.selectedDnaId as never,
    heroMomentId: input.selectedHeroMomentId,
    products,
    siteId: input.siteId,
    brandName: input.brandName,
    region: input.region ?? 'global',
    locale: input.storeLocale ?? 'en',
  })
  tally.credits += PLANNER_CREDIT_COST

  // 3. Director — build per-Moment scripts (Hero + 3 Value Props for now).
  hooks.onStep?.('directing', 0.4)
  const moments: MomentSlot[] = [
    {
      momentId: input.selectedHeroMomentId,
      slot: 'hero',
      product: {
        id: products[0]!.id,
        title: products[0]!.title,
        description: products[0]!.description,
        category: products[0]!.category,
        imageUrls: [products[0]!.imageUrl],
      },
    },
    ...products.slice(1, 4).map(
      (p) =>
        ({
          momentId: input.selectedHeroMomentId,
          slot: 'value_prop' as const,
          product: {
            id: p.id,
            title: p.title,
            description: p.description,
            category: p.category,
            imageUrls: [p.imageUrl],
          },
        }) satisfies MomentSlot,
    ),
  ]
  const director = await direct({
    provider: hooks.llm,
    brand,
    dna: input.selectedDnaId as never,
    moments,
  })
  tally.credits += director.creditsUsed
  void DIRECTOR_CREDIT_PER_SCENE

  // 4. Copywriter — rewrite the prose.
  hooks.onStep?.('copywriting', 0.55)
  const { dsl } = await writeCopy({ provider: hooks.llm, brand, dsl: planResult.dsl })
  tally.credits += COPYWRITER_CREDIT_COST

  // 5. Artist — generate hero video + value-prop micro-videos in parallel.
  hooks.onStep?.('generating_assets', 0.7)
  const assets: ArtistResult[] = []
  if (!hooks.mockArtist) {
    const tasks = director.scenes.map(async (scene) => {
      const result = await generateAsset(
        {
          type: 'video',
          prompt: scene.videoPrompt,
          negative: scene.negative,
          durationSec: scene.durationSec,
        },
        { region: input.region ?? 'global' },
      )
      tally.credits += ASSET_CREDIT_PER_VIDEO
      return result
    })
    assets.push(...(await Promise.all(tasks)))
  }
  void ASSET_CREDIT_PER_IMAGE
  void ASSET_CREDIT_PER_3D

  // Wire generated video URLs back into the DSL so Hero plays them.
  if (assets[0]) {
    for (const section of dsl.sections) {
      if (section.type === 'Hero') {
        section.config.videoUrl = assets[0].url
        section.config.posterUrl = assets[0].thumbnailUrl
      }
    }
  }

  // 5b. Compositing — stitch generated media into the DSL (the loop
  // above already did the wiring; this event is UX-level).
  hooks.onStep?.('compositing', 0.8)
  await sleep(hooks.mockArtist ? 200 : 400)

  // 6. Compile DSL → Next.js project.
  hooks.onStep?.('compiling', 0.85)
  const compiled = compile({ dsl, subdomain: input.subdomain, products })

  // 6b. Optimising — CDN + edge cache plumbing (done by deploy() under
  // the hood; we surface it as a distinct UI step for clarity).
  hooks.onStep?.('optimising', 0.9)
  await sleep(hooks.mockArtist ? 200 : 400)

  // 7. Deploy to Cloudflare Pages.
  hooks.onStep?.('deploying', 0.95)
  const deployment = await deploy(compiled, hooks.deployOpts)

  hooks.onStep?.('finished', 1)
  return {
    brand,
    dsl,
    director,
    assets,
    compiled,
    deployment,
    totalCreditsUsed: tally.credits,
    totalDurationMs: Date.now() - startedAt,
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
