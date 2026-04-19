/**
 * Product Moment — a 6-8 second loop describing the "perfect visual
 * heartbeat" of a hero product. See `docs/MASTER.md` §11 and Appendix B.
 */

export type MomentType =
  | 'M01'
  | 'M02'
  | 'M03'
  | 'M04'
  | 'M05'
  | 'M06'
  | 'M07'
  | 'M08'
  | 'M09'
  | 'M10'

export type MomentSlug =
  | 'liquid_bath'
  | 'levitation'
  | 'light_sweep'
  | 'breathing_still'
  | 'droplet_ripple'
  | 'mist_emergence'
  | 'fabric_drape'
  | 'ingredient_ballet'
  | 'surface_interaction'
  | 'environmental_embed'

export type ProductCategoryFlags = {
  isBeverage?: boolean
  isAlcohol?: boolean
  isSkincare?: boolean
  isFragrance?: boolean
  isSupplement?: boolean
  isWatch?: boolean
  isJewelry?: boolean
  isElectronics?: boolean
  isApparel?: boolean
  isFootwear?: boolean
  isCeramic?: boolean
  isLuxury?: boolean
  isFood?: boolean
  isLifestyle?: boolean
  isHome?: boolean
  isCosmetic?: boolean
}

export interface ProductData extends ProductCategoryFlags {
  id: string
  title: string
  description?: string
  category: string
  /** Optional dominant materials (e.g. "ceramic", "glass"). */
  materials?: string[]
  /** Optional surface keywords (linen, oak, water) used by templates. */
  surfaces?: string[]
  /** Free text describing the product visually for prompt interpolation. */
  visualDescription?: string
}

export interface MomentVariation {
  id: string
  description: string
  promptOverride?: string
}

export interface MomentPromptTemplate {
  id: MomentType
  slug: MomentSlug
  name: string
  description: string
  /** Categories this Moment is best suited for (free-form tags). */
  bestFor: string[]
  /** Markdown-grade base prompt with `{{placeholders}}`. */
  basePrompt: string
  /** Camera direction notes. */
  cameraHints: string
  durationSec: number
  /** How to keep the loop seamless (e.g. matching first / last frame). */
  loopStrategy: string
  /** Estimated success rate when running on Kling 2.0 (0-100). */
  successRate: number
  /** Variations to drive A/B picks in the user gallery. */
  variations: MomentVariation[]
  /** Fallback Moment to retry with if generation fails repeatedly. */
  failureFallback: MomentType
  /** Optional hosted reference URL (poster image / video). */
  referenceUrl?: string
}

/**
 * The minimal slice of a {@link VisualDNA} this package needs. Avoids a
 * runtime dependency on `@forgely/visual-dna` so the package stays
 * cheap to load and easy to test.
 */
export interface MomentDnaContext {
  id: string
  styleKeywords: string[]
  negativeKeywords: string[]
  colorGradeMood: string[]
  technicalSpecs?: string
}

/**
 * Slice of the BrandProfile produced by the Analyzer Agent that's
 * relevant to Moment selection.
 */
export interface MomentBrandContext {
  brandArchetype?: string
  toneOfVoice?: string[]
  priceSegment?: 'budget' | 'mid' | 'premium' | 'luxury'
}

export interface MomentSelectionResult {
  moment: MomentType
  reasoning: string
  alternatives: MomentType[]
}
