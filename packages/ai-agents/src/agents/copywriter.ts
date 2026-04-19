/**
 * Copywriter Agent — T15.
 *
 * Reads a `SiteDsl` skeleton (Planner-emitted) + BrandProfile and rewrites
 * every prose field — headlines, body copy, CTA labels, FAQ answers,
 * SEO meta — in the brand voice and the target locale.
 *
 * The Planner emits an OK first draft already; the Copywriter is what
 * turns it into "actually shippable" copy in tone and length.
 *
 * Cost (real provider, Claude Sonnet 4 / Qwen-Plus):
 *   ≈ 1.6k input + 1.2k output ≈ $0.024 → 30 credits.
 */
import { type SiteDsl, SiteDslSchema } from '@forgely/dsl'
import { z } from 'zod'

import type { LlmModel, LlmProvider } from '../providers/types'
import type { BrandProfile } from '../types/brand-profile'

export const COPYWRITER_CREDIT_COST = 30

export interface CopywriterOptions {
  provider: LlmProvider
  brand: BrandProfile
  dsl: SiteDsl
  /** Override target language. Defaults to dsl.locale. */
  locale?: 'zh-CN' | 'zh-HK' | 'zh-TW' | 'en'
  model?: LlmModel
  mock?: boolean
  onTelemetry?: (info: { durationMs: number; costUsd: number; outputTokens: number }) => void
}

export interface CopyResult {
  dsl: SiteDsl
  creditsUsed: number
}

const SYSTEM = `You are Forgely's Copywriter Agent.

You receive a draft SiteDSL (JSON) plus a brand snapshot. Rewrite every
prose field so it:
  - matches the brand archetype + tone of voice
  - feels native to the locale (write Chinese for zh-* locales, English otherwise)
  - is concrete and benefit-led, not generic adjective soup
  - obeys character budgets defined by the schema

DO NOT change:
  - JSON structure / keys
  - product ids
  - section order
  - heroProductId / momentId / dnaId

Return the FULL updated SiteDSL JSON only.`

export async function writeCopy(options: CopywriterOptions): Promise<CopyResult> {
  if (options.mock) {
    return { dsl: options.dsl, creditsUsed: COPYWRITER_CREDIT_COST }
  }
  const startedAt = Date.now()
  const userPayload = buildUserPayload(options)
  const res = await options.provider.text<unknown>({
    model: options.model ?? 'claude-sonnet-4',
    system: SYSTEM,
    user: userPayload,
    jsonSchema: 'object',
    maxTokens: 4000,
    temperature: 0.55,
  })
  // Force-keep structural keys to prevent the LLM from accidentally
  // regenerating ids / dna / momentId.
  const merged = mergeKeepIds(options.dsl, res.data as Record<string, unknown>)
  const dsl = SiteDslSchema.parse(merged)
  options.onTelemetry?.({
    durationMs: Date.now() - startedAt,
    costUsd: res.costUsd,
    outputTokens: res.outputTokens,
  })
  return { dsl, creditsUsed: COPYWRITER_CREDIT_COST }
}

function buildUserPayload(options: CopywriterOptions): string {
  return [
    `Brand: ${options.dsl.brand.name}`,
    `Archetype: ${options.brand.brandArchetype}`,
    `Tone: ${options.brand.toneOfVoice.join(', ')}`,
    `Target customer: ${options.brand.targetCustomer.persona}`,
    `Locale: ${options.locale ?? options.dsl.locale}`,
    '',
    'Draft SiteDSL:',
    JSON.stringify(options.dsl, null, 2),
  ].join('\n')
}

function mergeKeepIds(original: SiteDsl, edited: Record<string, unknown>): SiteDsl {
  const out = JSON.parse(JSON.stringify(edited)) as SiteDsl
  out.version = 1
  out.siteId = original.siteId
  out.dnaId = original.dnaId
  out.heroMomentId = original.heroMomentId
  out.region = original.region
  // Preserve productIds + heroProductId order
  for (let i = 0; i < out.sections.length; i += 1) {
    const orig = original.sections[i]
    const ed = out.sections[i]
    if (!orig || !ed || orig.type !== ed.type) continue
    if (orig.type === 'Hero' && ed.type === 'Hero') {
      ed.config.heroProductId = orig.config.heroProductId
      ed.config.momentId = orig.config.momentId
    }
    if (orig.type === 'ProductShowcase' && ed.type === 'ProductShowcase') {
      ed.config.productIds = orig.config.productIds
    }
  }
  return out
}

// Re-export Zod for downstream test convenience.
export { z }
