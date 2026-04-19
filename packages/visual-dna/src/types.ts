/**
 * Visual DNA — a complete cinematic visual language (color, typography,
 * camera language, lighting, color grade, texture, composition, prompt
 * builder) shared by every surface of a generated site. See
 * `docs/MASTER.md` §10 and Appendix A.
 */

export type DnaId =
  | 'kyoto_ceramic'
  | 'clinical_wellness'
  | 'playful_pop'
  | 'nordic_minimal'
  | 'tech_precision'
  | 'editorial_fashion'
  | 'organic_garden'
  | 'neon_night'
  | 'california_wellness'
  | 'bold_rebellious'

export interface DnaColors {
  primary: string
  secondary: string
  accent: string
  bg: string
  fg: string
  muted: string
  semantic: {
    success: string
    warning: string
    error: string
  }
}

export type FontSource = 'google' | 'adobe' | 'custom'

export interface DnaFont {
  family: string
  weights: number[]
  source: FontSource
}

export interface DnaFonts {
  display: DnaFont
  heading: DnaFont
  body: DnaFont
  mono?: DnaFont
}

export interface DnaCameraLanguage {
  pace: 'slow' | 'medium' | 'fast'
  style: 'static' | 'floating' | 'dynamic'
  perspective: 'eye_level' | 'top_down' | 'low_angle' | 'varied'
  avgShotDuration: number
}

export interface DnaColorGrade {
  temperature: 'warm' | 'cool' | 'neutral'
  saturation: 'desaturated' | 'natural' | 'vibrant'
  contrast: 'low' | 'medium' | 'high'
  highlights: string
  shadows: string
  overallMood: string[]
}

export interface DnaLighting {
  source: 'natural_window' | 'studio_soft' | 'dramatic' | 'neon' | 'outdoor_sunset'
  direction: 'side' | 'top' | 'backlit' | 'diffused' | 'front'
  intensity: 'soft' | 'medium' | 'hard'
}

export interface DnaTexture {
  filmGrain: 'none' | 'subtle' | 'heavy'
  motionBlur: 'none' | 'subtle' | 'cinematic'
  depth: 'shallow' | 'medium' | 'deep'
}

export interface DnaComposition {
  framing: 'centered' | 'rule_of_thirds' | 'asymmetric' | 'symmetric'
  negativeSpace: 'minimal' | 'balanced' | 'abundant'
}

export interface DnaPromptBuilder {
  styleKeywords: string[]
  negativeKeywords: string[]
  technicalSpecs: string
}

export interface VisualDNA {
  id: DnaId
  name: string
  description: string
  /** Suitable product categories (free-form tags, used for matching). */
  bestFor: string[]
  /** Real-world brands this DNA echoes (for human reference). */
  referenceBrands: string[]
  colors: DnaColors
  fonts: DnaFonts
  cameraLanguage: DnaCameraLanguage
  colorGrade: DnaColorGrade
  lighting: DnaLighting
  texture: DnaTexture
  composition: DnaComposition
  promptBuilder: DnaPromptBuilder
}

/**
 * Lightweight slice of a {@link BrandProfile} used by {@link matchDNA}.
 * Mirrors the shape produced by the Analyzer Agent (T10) without forcing
 * a runtime dependency on `@forgely/ai-agents`.
 */
export interface DnaMatchInput {
  category?: string
  priceSegment?: 'budget' | 'mid' | 'premium' | 'luxury'
  brandArchetype?: string
  toneOfVoice?: string[]
  referenceBrands?: string[]
}

export interface DnaMatchResult {
  dnaId: DnaId
  score: number
  reasoning: string
}
