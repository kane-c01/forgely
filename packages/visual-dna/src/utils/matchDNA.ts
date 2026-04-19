import { visualDNAById, visualDNAs } from '../presets'
import type { DnaId, DnaMatchInput, DnaMatchResult, VisualDNA } from '../types'

/**
 * Map of free-form Analyzer category strings to canonical buckets used
 * by every DNA's `bestFor` tag list. Conservative — when in doubt the
 * function falls back to keyword matching.
 */
const CATEGORY_ALIASES: Record<string, string[]> = {
  ceramics: ['ceramics', 'pottery', 'tea', 'tableware'],
  beverages: ['beverage', 'drink', 'soda', 'juice', 'coffee'],
  electronics: ['electronics', 'gadgets', 'audio', 'devices'],
  apparel_basics: ['apparel', 'clothing', 'basics', 'tee', 'tees'],
  apparel_luxury: ['luxury_apparel', 'designer', 'fashion'],
  beauty: ['beauty', 'cosmetics', 'makeup'],
  skincare: ['skincare', 'serum', 'moisturizer'],
  supplements: ['supplement', 'vitamin', 'wellness_consumable'],
  natural_food: ['organic', 'natural_food', 'pantry'],
  home: ['home', 'homeware', 'furniture', 'kitchen'],
  streetwear_drop: ['streetwear', 'drop', 'fashion_streetwear'],
}

const TONE_AFFINITY: Partial<Record<DnaId, string[]>> = {
  kyoto_ceramic: ['quiet', 'meditative', 'craft', 'eastern', 'serene'],
  clinical_wellness: ['premium', 'scientific', 'precise', 'feminine', 'apothecary'],
  playful_pop: ['playful', 'bold', 'fun', 'energetic', 'irreverent'],
  nordic_minimal: ['quiet', 'honest', 'natural', 'family', 'minimal'],
  tech_precision: ['precise', 'futuristic', 'serious', 'industrial'],
  editorial_fashion: ['editorial', 'sensual', 'cinematic', 'serious'],
  organic_garden: ['organic', 'wholesome', 'crafted', 'feminine'],
  neon_night: ['rebellious', 'electric', 'nocturnal', 'futuristic'],
  california_wellness: ['warm', 'aspirational', 'sunlit', 'grounded'],
  bold_rebellious: ['rebellious', 'punk', 'loud', 'provocative'],
}

const PRICE_AFFINITY: Record<DnaId, Array<DnaMatchInput['priceSegment']>> = {
  kyoto_ceramic: ['mid', 'premium', 'luxury'],
  clinical_wellness: ['premium', 'luxury'],
  playful_pop: ['budget', 'mid'],
  nordic_minimal: ['mid', 'premium'],
  tech_precision: ['premium', 'luxury'],
  editorial_fashion: ['premium', 'luxury'],
  organic_garden: ['mid', 'premium'],
  neon_night: ['mid', 'premium'],
  california_wellness: ['mid', 'premium'],
  bold_rebellious: ['mid'],
}

function matchesCategory(dna: VisualDNA, category?: string): number {
  if (!category) return 0
  const normalized = category.toLowerCase().trim()
  const aliasHit = Object.entries(CATEGORY_ALIASES).find(([bucket, aliases]) =>
    [bucket, ...aliases].includes(normalized),
  )
  if (aliasHit && dna.bestFor.includes(aliasHit[0])) return 3
  if (dna.bestFor.some((tag) => tag.includes(normalized) || normalized.includes(tag))) return 2
  return 0
}

function matchesTone(dna: VisualDNA, toneOfVoice?: string[]): number {
  if (!toneOfVoice?.length) return 0
  const tones = (TONE_AFFINITY[dna.id] ?? []).map((t) => t.toLowerCase())
  let score = 0
  for (const tone of toneOfVoice) {
    if (tones.includes(tone.toLowerCase())) score += 1
  }
  return Math.min(score, 3)
}

function matchesPrice(dna: VisualDNA, priceSegment?: DnaMatchInput['priceSegment']): number {
  if (!priceSegment) return 0
  return PRICE_AFFINITY[dna.id].includes(priceSegment) ? 1 : 0
}

function matchesReferences(dna: VisualDNA, references?: string[]): number {
  if (!references?.length) return 0
  const dnaSet = new Set(dna.referenceBrands.map((b) => b.toLowerCase()))
  let hits = 0
  for (const ref of references) {
    if (dnaSet.has(ref.toLowerCase())) hits += 1
  }
  return Math.min(hits * 2, 4)
}

function explain(dna: VisualDNA, signals: string[]): string {
  if (!signals.length) return `Fallback to ${dna.name} (broad fit).`
  return `Matched ${dna.name} via ${signals.join(', ')}.`
}

/**
 * matchDNA — score every DNA against the provided BrandProfile slice and
 * return the ranked list. The first element is the recommended DNA; the
 * caller can show the next few as alternatives in the gallery.
 */
export function matchDNA(input: DnaMatchInput): DnaMatchResult[] {
  const ranked = visualDNAs.map<DnaMatchResult>((dna) => {
    const signals: string[] = []
    let score = 0

    const cat = matchesCategory(dna, input.category)
    if (cat) {
      score += cat
      signals.push(`category:${input.category}`)
    }
    const tone = matchesTone(dna, input.toneOfVoice)
    if (tone) {
      score += tone
      signals.push(`tone:${input.toneOfVoice?.join('|')}`)
    }
    const price = matchesPrice(dna, input.priceSegment)
    if (price) {
      score += price
      signals.push(`price:${input.priceSegment}`)
    }
    const refs = matchesReferences(dna, input.referenceBrands)
    if (refs) {
      score += refs
      signals.push('reference brand overlap')
    }

    return {
      dnaId: dna.id,
      score,
      reasoning: explain(dna, signals),
    }
  })

  ranked.sort((a, b) => b.score - a.score)
  const best = ranked[0]
  if (!best || best.score === 0) {
    return [
      {
        dnaId: 'nordic_minimal',
        score: 0,
        reasoning:
          'No strong signals — defaulted to Nordic Minimal as the safest visually-neutral fallback.',
      },
      ...ranked.filter((r) => r.dnaId !== 'nordic_minimal'),
    ]
  }
  return ranked
}

/**
 * recommendDNA — convenience wrapper returning only the top match plus
 * the resolved DNA payload. Throws if no DNAs are registered (impossible
 * at runtime but keeps the type narrowing honest).
 */
export function recommendDNA(input: DnaMatchInput): {
  result: DnaMatchResult
  dna: VisualDNA
} {
  const ranked = matchDNA(input)
  const top = ranked[0]
  if (!top) {
    throw new Error('matchDNA returned an empty ranking — no presets registered')
  }
  return { result: top, dna: visualDNAById[top.dnaId] }
}
