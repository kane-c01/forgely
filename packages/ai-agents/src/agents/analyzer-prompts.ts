/**
 * Prompt templates for the Analyzer Agent.
 *
 * Kept in their own module so we can iterate on the prompts without
 * touching agent orchestration. Both prompts are explicitly STRICT
 * about JSON-only output to play nicely with `LlmTextRequest.jsonSchema`.
 */
import { VISUAL_DNA_IDS } from '../types/dna'

/** System prompt used for the Vision pass on the homepage screenshot. */
export const VISION_SYSTEM = `You are Forgely's Vision Analyzer.

You receive ONE screenshot of the user's current store homepage.
Your job is to assess the visual quality and extract structured signals
that downstream agents (Director, Planner, Artist) can use to plan a
cinematic Forgely site.

Be ruthless and concise. The brand owner is paying us to be honest.

Return JSON with this exact shape:
{
  "visualQuality": <int 1-10>,
  "dominantColors": ["#rrggbb", ...],
  "typographyClass": "<short label e.g. 'serif display + sans body'>",
  "weaknesses": ["<short bullet 1>", ...],
  "moodKeywords": ["<keyword>", ...]
}`

/** System prompt for the brand text-analysis pass. */
export const TEXT_SYSTEM = `You are Forgely's Brand Analyzer.

You receive structured store metadata: name, description, currency,
language, sample product titles + descriptions, and counts.

Decide:
  - the dominant brand archetype (one of:
    Hero | Outlaw | Magician | Lover | Jester | Everyman | Caregiver |
    Ruler | Creator | Innocent | Sage | Explorer)
  - the canonical category (e.g. 'wooden_toys', 'skincare')
  - the price segment (budget | mid | premium | luxury)
  - up to 5 reference brands the store evokes
  - 1-4 tone keywords (one of: professional, warm, bold, playful, minimal,
    cinematic, scientific, rebellious, feminine, masculine, organic,
    futuristic, editorial, serene)
  - the target customer persona (name, age range as [min,max], regions
    as ISO-2 codes, 1-3 motivations)
  - one of these visual DNAs that fits best: ${VISUAL_DNA_IDS.join(', ')}
  - a single-sentence "opportunity" describing the upgrade Forgely will deliver

Return ONLY JSON:
{
  "brandArchetype": "Caregiver",
  "category": "wooden_toys",
  "priceSegment": "premium",
  "referenceBrands": ["Grimm's", "Oeuf NYC"],
  "toneOfVoice": ["warm","minimal"],
  "targetCustomer": {
    "persona": "Mindful Millennial Parent",
    "ageRange": [28, 42],
    "regions": ["US","EU"],
    "motivations": ["wants Scandinavian aesthetic", "values sustainability"]
  },
  "recommendedDNA": "nordic_minimal",
  "opportunity": "Lift the brand from generic Shopify to a cinematic Nordic boutique."
}`

export interface BrandTextSummary {
  storeName: string
  storeDescription?: string
  currency: string
  language: string
  productCount: number
  collectionCount: number
  sampleProducts: Array<{
    title: string
    priceCents: number
    description: string
    category?: string
  }>
}

/** Build the user payload for the text pass — keeps it small and predictable. */
export function buildTextUserPayload(summary: BrandTextSummary): string {
  const lines: string[] = []
  lines.push(`Store name: ${summary.storeName}`)
  if (summary.storeDescription) {
    lines.push(`Store description: ${summary.storeDescription.slice(0, 600)}`)
  }
  lines.push(`Currency: ${summary.currency} · Language: ${summary.language}`)
  lines.push(
    `Inventory: ${summary.productCount} products across ${summary.collectionCount} collections.`,
  )
  lines.push('')
  lines.push('Sample products:')
  for (const p of summary.sampleProducts.slice(0, 6)) {
    const price = (p.priceCents / 100).toFixed(2)
    lines.push(`- ${p.title} (${summary.currency} ${price}${p.category ? `, ${p.category}` : ''})`)
    if (p.description) {
      lines.push(`  ${p.description.replace(/\s+/g, ' ').trim().slice(0, 200)}`)
    }
  }
  return lines.join('\n')
}
