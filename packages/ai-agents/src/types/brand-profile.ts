import { z } from 'zod'

import { VISUAL_DNA_IDS, type VisualDnaId } from './dna'

/**
 * Output of the Analyzer Agent — a structured snapshot of the brand
 * extracted from the scraped store. Every downstream agent (Director,
 * Planner, Copywriter, Artist, Compliance) takes this as input.
 *
 * Source: `docs/MASTER.md` §5.1 and §12.
 */
export const BrandArchetypeSchema = z.enum([
  'Hero',
  'Outlaw',
  'Magician',
  'Lover',
  'Jester',
  'Everyman',
  'Caregiver',
  'Ruler',
  'Creator',
  'Innocent',
  'Sage',
  'Explorer',
])
export type BrandArchetype = z.infer<typeof BrandArchetypeSchema>

export const PriceSegmentSchema = z.enum(['budget', 'mid', 'premium', 'luxury'])
export type PriceSegment = z.infer<typeof PriceSegmentSchema>

export const ToneSchema = z.enum([
  'professional',
  'warm',
  'bold',
  'playful',
  'minimal',
  'cinematic',
  'scientific',
  'rebellious',
  'feminine',
  'masculine',
  'organic',
  'futuristic',
  'editorial',
  'serene',
])
export type Tone = z.infer<typeof ToneSchema>

export const TargetCustomerSchema = z.object({
  /** Free-form persona name e.g. "Mindful Millennial Parent". */
  persona: z.string().min(2).max(120),
  ageRange: z.tuple([z.number().int().min(13), z.number().int().max(99)]),
  /** Two-letter region codes (`US`, `EU`, `CN`, `GB`, ...). */
  regions: z.array(z.string().length(2)).min(1),
  /** Three short sentences describing motivations / pain points. */
  motivations: z.array(z.string().min(4).max(180)).min(1).max(5),
})
export type TargetCustomer = z.infer<typeof TargetCustomerSchema>

export const VisionAnalysisSchema = z.object({
  /** 1–10 — current homepage visual quality. */
  visualQuality: z.number().int().min(1).max(10),
  /** Dominant colours hex (max 6, ordered by area). */
  dominantColors: z.array(z.string().regex(/^#[0-9a-fA-F]{6}$/)).max(6),
  /** Typography classification — sans / serif / display / etc. */
  typographyClass: z.string().min(2).max(48),
  /** 0–3 short critique bullets explaining the score. */
  weaknesses: z.array(z.string().min(4).max(200)).max(3),
  /** Optional moodboard keywords distilled from the screenshot. */
  moodKeywords: z.array(z.string().min(2).max(40)).max(8),
})
export type VisionAnalysis = z.infer<typeof VisionAnalysisSchema>

export const BrandProfileSchema = z.object({
  visualQuality: z.number().int().min(1).max(10),
  brandArchetype: BrandArchetypeSchema,
  /** High-level category e.g. `wooden_toys`, `skincare`, `coffee`, `apparel`. */
  category: z.string().min(2).max(60),
  priceSegment: PriceSegmentSchema,
  /** Up to 5 brands the analysed store reminds of. */
  referenceBrands: z.array(z.string().min(2).max(80)).max(5),
  toneOfVoice: z.array(ToneSchema).min(1).max(4),
  targetCustomer: TargetCustomerSchema,
  recommendedDNA: z.enum(VISUAL_DNA_IDS),
  /** A single sentence describing the upgrade opportunity. */
  opportunity: z.string().min(10).max(280),
  vision: VisionAnalysisSchema,
  /** Total credits the analyzer reports as consumed (for billing). */
  creditsUsed: z.number().int().nonnegative(),
})
export type BrandProfile = z.infer<typeof BrandProfileSchema>

export interface AnalyzerStats {
  visionMs: number
  textMs: number
  totalMs: number
  retries: number
}

/** Helper: assert that a `recommendedDNA` is one of the known ids. */
export function isVisualDnaId(value: string): value is VisualDnaId {
  return (VISUAL_DNA_IDS as readonly string[]).includes(value)
}
