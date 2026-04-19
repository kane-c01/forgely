/**
 * Analyzer Agent — turns a `ScrapedData` snapshot into a `BrandProfile`.
 *
 * Two parallel Claude calls:
 *   - Vision pass on the homepage screenshot (Claude Sonnet w/ vision)
 *   - Text pass on store + sample product descriptions (Claude Sonnet)
 *
 * The two outputs are merged into a single, validated `BrandProfile`.
 *
 * Source-of-truth for behaviour: docs/MASTER.md §5.1 + §12 + AI-DEV-GUIDE Task 10.
 *
 * Cost (real provider, Claude Sonnet 4):
 *   Vision pass  — ~ 1.6k input + 350 output tokens ≈ $0.01
 *   Text pass    — ~ 0.8k input + 350 output tokens ≈ $0.008
 *   Total        — ≈ $0.02 → invoiced at 20 credits per call (per docs §3.6).
 */
import { z } from 'zod'

import {
  type BrandProfile,
  BrandProfileSchema,
  type AnalyzerStats,
  isVisualDnaId,
  type VisionAnalysis,
  VisionAnalysisSchema,
} from '../types/brand-profile'
import { type LlmModel, type LlmProvider } from '../providers/types'
import {
  buildTextUserPayload,
  TEXT_SYSTEM,
  VISION_SYSTEM,
  type BrandTextSummary,
} from './analyzer-prompts'
import type { ScrapedData, ScrapedProduct } from '@forgely/scraper'

/** Default credits charged for one full analyze() call (matches docs §3.6). */
export const ANALYZER_CREDIT_COST = 20

export interface AnalyzerOptions {
  provider: LlmProvider
  /** Override the LLM model (default: Claude Sonnet — fits docs §5.1). */
  model?: LlmModel
  /** Skip the vision pass (e.g. when no screenshot exists). */
  skipVision?: boolean
  /** Allow callers to override the credit cost (e.g. for promo). */
  creditCost?: number
  /** Optional callback to receive cost telemetry per pass. */
  onTelemetry?: (info: AnalyzerTelemetry) => void
}

export interface AnalyzerTelemetry {
  pass: 'vision' | 'text'
  inputTokens: number
  outputTokens: number
  costUsd: number
  durationMs: number
}

export interface AnalyzeResult {
  profile: BrandProfile
  stats: AnalyzerStats
}

const TextResultSchema = z.object({
  brandArchetype: BrandProfileSchema.shape.brandArchetype,
  category: BrandProfileSchema.shape.category,
  priceSegment: BrandProfileSchema.shape.priceSegment,
  referenceBrands: BrandProfileSchema.shape.referenceBrands,
  toneOfVoice: BrandProfileSchema.shape.toneOfVoice,
  targetCustomer: BrandProfileSchema.shape.targetCustomer,
  /**
   * Accept any string here; the heuristic fallback in `mergeProfile`
   * will rescue unknown ids before final BrandProfileSchema validation.
   */
  recommendedDNA: z.string().min(2).max(60),
  opportunity: BrandProfileSchema.shape.opportunity,
})
type TextResult = z.infer<typeof TextResultSchema>

export async function analyze(
  scraped: ScrapedData,
  options: AnalyzerOptions,
): Promise<AnalyzeResult> {
  const model = options.model ?? 'claude-sonnet-4'
  const wantVision =
    !options.skipVision && Boolean(scraped.screenshots.homepage) && scraped.screenshots.homepage !== ''

  const summary = summariseForText(scraped)

  // Run both passes concurrently. Either falls back to a heuristic on
  // failure so a flaky vision call cannot bring down the whole agent.
  const visionPromise = wantVision
    ? runVision(scraped.screenshots.homepage as string, options).catch((err) => {
        console.warn('[analyzer] vision pass failed, using fallback:', err)
        return defaultVision()
      })
    : Promise.resolve(defaultVision())

  const textPromise = runText(summary, model, options)

  const startedAt = Date.now()
  const [vision, { result: text, durationMs: textMs }] = await Promise.all([
    visionPromise,
    textPromise,
  ])
  const visionMs = wantVision ? Date.now() - startedAt - textMs : 0

  const profile = mergeProfile({ vision, text, scraped, options })

  return {
    profile,
    stats: {
      visionMs,
      textMs,
      totalMs: Date.now() - startedAt,
      retries: 0,
    },
  }
}

interface MergeArgs {
  vision: VisionAnalysis
  text: TextResult
  scraped: ScrapedData
  options: AnalyzerOptions
}

function mergeProfile({ vision, text, scraped, options }: MergeArgs): BrandProfile {
  const recommendedDNA = isVisualDnaId(text.recommendedDNA)
    ? text.recommendedDNA
    : pickFallbackDna(scraped, text)

  const merged = {
    visualQuality: vision.visualQuality,
    brandArchetype: text.brandArchetype,
    category: text.category,
    priceSegment: text.priceSegment,
    referenceBrands: text.referenceBrands,
    toneOfVoice: text.toneOfVoice,
    targetCustomer: text.targetCustomer,
    recommendedDNA,
    opportunity: text.opportunity,
    vision,
    creditsUsed: options.creditCost ?? ANALYZER_CREDIT_COST,
  }

  return BrandProfileSchema.parse(merged)
}

function summariseForText(scraped: ScrapedData): BrandTextSummary {
  const sampleProducts = pickSampleProducts(scraped.products, 6).map((p) => ({
    title: p.title,
    priceCents: p.priceFrom.amountCents,
    description: stripHtml(p.description ?? '').slice(0, 400),
    category: p.category,
  }))
  return {
    storeName: scraped.store.name,
    storeDescription: scraped.store.description,
    currency: scraped.store.currency,
    language: scraped.store.language,
    productCount: scraped.products.length,
    collectionCount: scraped.collections.length,
    sampleProducts,
  }
}

function pickSampleProducts(products: readonly ScrapedProduct[], n: number): ScrapedProduct[] {
  if (products.length <= n) return [...products]
  // Deterministic stride sample so the same scrape yields the same prompt.
  const step = Math.max(1, Math.floor(products.length / n))
  const out: ScrapedProduct[] = []
  for (let i = 0; i < products.length && out.length < n; i += step) {
    const p = products[i]
    if (p) out.push(p)
  }
  return out
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

async function runVision(
  imageUrl: string,
  options: AnalyzerOptions,
): Promise<VisionAnalysis> {
  const startedAt = Date.now()
  const res = await options.provider.vision({
    model: options.model ?? 'claude-sonnet-4',
    system: VISION_SYSTEM,
    user: 'Analyze this store homepage screenshot.',
    images: [{ url: imageUrl }],
    jsonSchema: 'object',
    maxTokens: 600,
    temperature: 0.2,
  })
  options.onTelemetry?.({
    pass: 'vision',
    inputTokens: res.inputTokens,
    outputTokens: res.outputTokens,
    costUsd: res.costUsd,
    durationMs: Date.now() - startedAt,
  })
  return VisionAnalysisSchema.parse(res.data)
}

async function runText(
  summary: BrandTextSummary,
  model: LlmModel,
  options: AnalyzerOptions,
): Promise<{ result: TextResult; durationMs: number }> {
  const startedAt = Date.now()
  const res = await options.provider.text({
    model,
    system: TEXT_SYSTEM,
    user: buildTextUserPayload(summary),
    jsonSchema: 'object',
    maxTokens: 800,
    temperature: 0.4,
  })
  const durationMs = Date.now() - startedAt
  options.onTelemetry?.({
    pass: 'text',
    inputTokens: res.inputTokens,
    outputTokens: res.outputTokens,
    costUsd: res.costUsd,
    durationMs,
  })
  return { result: TextResultSchema.parse(res.data), durationMs }
}

function defaultVision(): VisionAnalysis {
  return {
    visualQuality: 5,
    dominantColors: ['#FFFFFF', '#000000'],
    typographyClass: 'unknown',
    weaknesses: ['no screenshot was provided to the vision pass'],
    moodKeywords: [],
  }
}

/** Heuristic fallback if the LLM returns a DNA id outside the known set. */
function pickFallbackDna(
  scraped: ScrapedData,
  text: TextResult,
): BrandProfile['recommendedDNA'] {
  const cat = text.category.toLowerCase()
  if (cat.includes('skincare') || cat.includes('wellness')) return 'clinical_wellness'
  if (cat.includes('apparel') || cat.includes('fashion')) return 'editorial_fashion'
  if (cat.includes('toy') || cat.includes('kid')) return 'nordic_minimal'
  if (cat.includes('food') || cat.includes('drink') || cat.includes('beverage')) return 'playful_pop'
  if (cat.includes('tech') || cat.includes('electron')) return 'tech_precision'
  if (cat.includes('ceramic') || cat.includes('home')) return 'kyoto_ceramic'
  if (cat.includes('organic') || cat.includes('garden')) return 'organic_garden'
  if (text.priceSegment === 'luxury') return 'editorial_fashion'
  if (text.toneOfVoice.includes('rebellious') || text.toneOfVoice.includes('bold')) {
    return 'bold_rebellious'
  }
  if (text.toneOfVoice.includes('serene') || scraped.store.name.toLowerCase().includes('zen')) {
    return 'kyoto_ceramic'
  }
  return 'nordic_minimal'
}

export type { BrandProfile } from '../types/brand-profile'
