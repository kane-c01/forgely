import { momentTemplateById } from '../templates'
import type { MomentDnaContext, MomentPromptTemplate, MomentType, ProductData } from '../types'

export interface BuildKlingPromptInput {
  moment: MomentType | MomentPromptTemplate
  product: ProductData
  dna: MomentDnaContext
  /** Variation index into the template's `variations` array. */
  variationIndex?: number
  /** Extra placeholder values that override the defaults below. */
  overrides?: Record<string, string>
}

export interface KlingPromptPayload {
  prompt: string
  negativePrompt: string
  durationSec: number
  loopStrategy: string
  variation?: { id: string; description: string }
  template: MomentPromptTemplate
}

const DEFAULT_PLACEHOLDERS: Record<string, string> = {
  surface: 'matte linen-draped table',
  light_source: 'natural window',
  light_color: 'warm amber',
  light_direction: 'top-left at 45 degrees',
  liquid_type: 'crystal-clear water',
  fabric_type: 'soft natural linen',
  backdrop_color: 'deep matte charcoal',
  accent_color: 'warm amber',
  atmosphere_element: 'soft drifting dust motes',
  ingredient_list: 'fresh botanicals and natural extracts',
  interaction_type: 'a single fingertip',
  material: 'brushed metal',
  environment_description: 'a quiet artisan workshop bathed in side morning light',
}

function resolvePlaceholders(template: string, values: Record<string, string>): string {
  return template.replace(/{{\s*([\w_]+)\s*}}/g, (_, key: string) => {
    const v = values[key]
    if (typeof v === 'string') return v
    return `[${key}]`
  })
}

function deriveProductDescription(p: ProductData): string {
  const parts = [p.title]
  if (p.materials?.length) parts.push(`(${p.materials.join(' & ')})`)
  if (p.visualDescription) parts.push(`— ${p.visualDescription}`)
  return parts.join(' ')
}

/**
 * buildKlingPrompt — turn a Moment template + product + DNA into a fully
 * resolved Kling 2.0 prompt payload (plus negative prompt, duration and
 * loop hints). Caller can append camera hints if desired.
 */
export function buildKlingPrompt(input: BuildKlingPromptInput): KlingPromptPayload {
  const template =
    typeof input.moment === 'string' ? momentTemplateById[input.moment] : input.moment
  if (!template) {
    throw new Error(
      `Unknown Moment id: ${typeof input.moment === 'string' ? input.moment : input.moment.id}`,
    )
  }

  const variation =
    typeof input.variationIndex === 'number' ? template.variations[input.variationIndex] : undefined

  const placeholders: Record<string, string> = {
    ...DEFAULT_PLACEHOLDERS,
    product_description: deriveProductDescription(input.product),
    dna_style_keywords: input.dna.styleKeywords.join(', '),
    dna_color_grade: input.dna.colorGradeMood.join(' / '),
    ...input.overrides,
  }

  const baseResolved =
    variation?.promptOverride ?? resolvePlaceholders(template.basePrompt, placeholders)
  const variationDescription = variation ? `, with variation: ${variation.description}` : ''

  const technical = input.dna.technicalSpecs ? `, ${input.dna.technicalSpecs}` : ''
  const cameraSegment = `, camera direction: ${template.cameraHints}`
  const negativePrompt = input.dna.negativeKeywords.join(', ')

  return {
    prompt: `${baseResolved}${variationDescription}${technical}${cameraSegment}`,
    negativePrompt,
    durationSec: template.durationSec,
    loopStrategy: template.loopStrategy,
    variation,
    template,
  }
}
