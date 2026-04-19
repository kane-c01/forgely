/**
 * Director Agent — T13.
 *
 * Inputs: BrandProfile + selected Visual DNA + Hero Product + chosen Moment.
 * Outputs: a `DirectorScript` per Moment slot describing the shot, lighting,
 * camera language, atmosphere and the final Kling / Vidu prompt.
 *
 * Source-of-truth for behaviour: docs/MASTER.md §5.1, §11 (Product Moments),
 * AI-DEV-GUIDE Task 13.
 *
 * Cost (real provider, Claude Sonnet 4 / Qwen-Plus):
 *   Director  — ~ 1.2k input + 600 output tokens per Moment ≈ $0.012
 *   Per generation (5-7 Moments) ≈ $0.06-0.10 → 30 credits.
 */
import { z } from 'zod'

import type { LlmModel, LlmProvider } from '../providers/types'
import type { BrandProfile } from '../types/brand-profile'
import type { VisualDnaId } from '../types/dna'

export interface ProductInput {
  id: string
  title: string
  description: string
  category?: string
  imageUrls: string[]
}

export interface MomentSlot {
  /** Moment id, e.g. `M01` … `M10`. */
  momentId: string
  /** Where the moment lives on the site. */
  slot: 'hero' | 'value_prop' | 'product_showcase' | 'brand_story'
  product: ProductInput
}

export const DirectorSceneSchema = z.object({
  momentId: z.string(),
  slot: z.enum(['hero', 'value_prop', 'product_showcase', 'brand_story']),
  /** Single-sentence storyboard summary the planner can show in the施法 UI. */
  summary: z.string().min(10).max(200),
  /** Final ready-to-send Kling / Vidu prompt. */
  videoPrompt: z.string().min(20).max(900),
  /** Optional fallback Flux still-image prompt if video fails. */
  fallbackImagePrompt: z.string().min(20).max(600),
  /** Camera language for downstream UI (e.g. "static, no zoom"). */
  cameraNotes: z.string().min(2).max(120),
  /** Total seconds of the loop. */
  durationSec: z.number().int().min(4).max(12),
  /** Negative prompt keywords to avoid. */
  negative: z.array(z.string()).max(8),
})
export type DirectorScene = z.infer<typeof DirectorSceneSchema>

export const DirectorScriptSchema = z.object({
  scenes: z.array(DirectorSceneSchema).min(1).max(8),
  creditsUsed: z.number().int().nonnegative(),
})
export type DirectorScript = z.infer<typeof DirectorScriptSchema>

export const DIRECTOR_CREDIT_PER_SCENE = 30

export interface DirectorOptions {
  provider: LlmProvider
  brand: BrandProfile
  dna: VisualDnaId
  moments: MomentSlot[]
  /** Override LLM model (default Claude Sonnet 4 / DeepSeek chat / Qwen plus). */
  model?: LlmModel
  /** Skip the LLM call and emit a deterministic mock (dev / CI). */
  mock?: boolean
  onTelemetry?: (info: { momentId: string; durationMs: number; costUsd: number }) => void
}

const SYSTEM = `You are Forgely's Director Agent.

For each Product Moment slot you receive (Hero / Value Prop / Product Showcase /
Brand Story), produce a tight cinematic shot description suitable for a 6–8 second
LOOP video on Kling 2.0 / Vidu / 即梦 (no people walking out of frame).

Honour the Visual DNA: lighting, palette, pace, lens character.
Honour the brand archetype + tone of voice.

Each scene MUST include:
  - momentId  (echo back exactly)
  - slot      (echo back exactly)
  - summary           one sentence storyboard
  - videoPrompt       final ready-to-send video prompt (English)
  - fallbackImagePrompt   single still-image prompt (English) for Flux fallback
  - cameraNotes       concise camera language
  - durationSec       integer 4-12
  - negative          array of negative keywords

Return ONLY a JSON object: { scenes: [...], creditsUsed: <int> }.`

export async function direct(options: DirectorOptions): Promise<DirectorScript> {
  if (options.mock || options.moments.length === 0) {
    return mockScript(options)
  }
  const userPayload = buildUserPayload(options)
  const startedAt = Date.now()
  const res = await options.provider.text<unknown>({
    model: options.model ?? 'claude-sonnet-4',
    system: SYSTEM,
    user: userPayload,
    jsonSchema: 'object',
    maxTokens: 1800,
    temperature: 0.5,
  })
  const parsed = DirectorScriptSchema.parse({
    ...(res.data as object),
    creditsUsed: options.moments.length * DIRECTOR_CREDIT_PER_SCENE,
  })
  options.onTelemetry?.({
    momentId: 'all',
    durationMs: Date.now() - startedAt,
    costUsd: res.costUsd,
  })
  return parsed
}

function buildUserPayload(options: DirectorOptions): string {
  const lines: string[] = []
  lines.push(`Brand archetype: ${options.brand.brandArchetype}`)
  lines.push(`Tone: ${options.brand.toneOfVoice.join(', ')}`)
  lines.push(`Reference brands: ${options.brand.referenceBrands.join(', ')}`)
  lines.push(`Visual DNA: ${options.dna}`)
  lines.push(`Price segment: ${options.brand.priceSegment}`)
  lines.push(`Target customer: ${options.brand.targetCustomer.persona}`)
  lines.push('')
  lines.push('Moments:')
  for (const m of options.moments) {
    lines.push(`- momentId=${m.momentId} slot=${m.slot} product="${m.product.title}" category=${m.product.category ?? '-'}`)
    lines.push(`  description: ${m.product.description.slice(0, 200)}`)
  }
  return lines.join('\n')
}

function mockScript(options: DirectorOptions): DirectorScript {
  const scenes: DirectorScene[] = options.moments.map((m, idx) => ({
    momentId: m.momentId,
    slot: m.slot,
    summary: `Mock scene ${idx + 1}: ${m.product.title}.`,
    videoPrompt: `${m.product.title}, ${options.dna} aesthetic, ${options.brand.toneOfVoice.join(' & ')} mood, 24fps shallow DOF, cinematic stillness.`,
    fallbackImagePrompt: `${m.product.title} hero still, ${options.dna} aesthetic, no text.`,
    cameraNotes: 'static camera, no zoom, no pan',
    durationSec: 7,
    negative: ['busy', 'people walking', 'text'],
  }))
  return {
    scenes,
    creditsUsed: scenes.length * DIRECTOR_CREDIT_PER_SCENE,
  }
}
