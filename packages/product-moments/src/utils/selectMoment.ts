import { momentTemplateById, momentTemplates } from '../templates'
import type {
  MomentBrandContext,
  MomentDnaContext,
  MomentPromptTemplate,
  MomentSelectionResult,
  MomentType,
  ProductData,
} from '../types'

interface Rule {
  description: string
  matches: (p: ProductData, dna: MomentDnaContext, brand?: MomentBrandContext) => boolean
  pick: MomentType
  weight?: number
}

const RULES: Rule[] = [
  {
    description: 'Beverages → Liquid Bath',
    matches: (p) => Boolean(p.isBeverage) || /beverage|drink|soda|juice/i.test(p.category),
    pick: 'M01',
    weight: 5,
  },
  {
    description: 'Skincare with clinical / scientific tone → Droplet Ripple',
    matches: (p, _dna, brand) =>
      Boolean(p.isSkincare) &&
      Boolean(brand?.toneOfVoice?.some((t) => /clinical|scientific|premium/i.test(t))),
    pick: 'M05',
    weight: 5,
  },
  {
    description: 'Skincare with feminine / sensory tone → Droplet Ripple',
    matches: (p, _dna, brand) =>
      Boolean(p.isSkincare) &&
      Boolean(brand?.toneOfVoice?.some((t) => /feminine|sensory|sensual/i.test(t))),
    pick: 'M05',
    weight: 4,
  },
  {
    description: 'Skincare default → Surface Interaction',
    matches: (p) => Boolean(p.isSkincare) || /skincare|serum|moisturizer/i.test(p.category),
    pick: 'M09',
    weight: 3,
  },
  {
    description: 'Fragrance → Mist Emergence',
    matches: (p) => Boolean(p.isFragrance) || /fragrance|perfume|cologne/i.test(p.category),
    pick: 'M06',
    weight: 5,
  },
  {
    description: 'Supplements → Ingredient Ballet',
    matches: (p) => Boolean(p.isSupplement) || /supplement|vitamin/i.test(p.category),
    pick: 'M08',
    weight: 5,
  },
  {
    description: 'Watches / Jewelry → Light Sweep',
    matches: (p) =>
      Boolean(p.isWatch) || Boolean(p.isJewelry) || /watch|jewelry|jewellery/i.test(p.category),
    pick: 'M03',
    weight: 5,
  },
  {
    description: 'Electronics → Levitation',
    matches: (p) => Boolean(p.isElectronics) || /electronics|gadget|audio|device/i.test(p.category),
    pick: 'M02',
    weight: 5,
  },
  {
    description: 'Apparel → Fabric Drape',
    matches: (p) => Boolean(p.isApparel) || /apparel|clothing|tee|shirt|dress/i.test(p.category),
    pick: 'M07',
    weight: 5,
  },
  {
    description: 'Ceramics / Luxury homewares → Breathing Still',
    matches: (p) =>
      Boolean(p.isCeramic) || Boolean(p.isLuxury) || /ceramic|porcelain|homeware/i.test(p.category),
    pick: 'M04',
    weight: 4,
  },
  {
    description: 'Lifestyle / Home → Environmental Embed',
    matches: (p) =>
      Boolean(p.isLifestyle) ||
      Boolean(p.isHome) ||
      /lifestyle|home|kitchen|garden/i.test(p.category),
    pick: 'M10',
    weight: 4,
  },
  {
    description: 'Cosmetics with playful tone → Liquid Bath',
    matches: (p, _dna, brand) =>
      Boolean(p.isCosmetic) &&
      Boolean(brand?.toneOfVoice?.some((t) => /playful|fun|bold/i.test(t))),
    pick: 'M01',
    weight: 3,
  },
]

const FALLBACK: MomentType = 'M04'

/**
 * selectMoment — apply the rule engine described in `docs/MASTER.md` §11.3
 * to pick the optimal Moment for a product. Returns the chosen Moment, a
 * short reasoning string, and up to two alternates (each rule's pick that
 * also matched, deduped, in scoring order).
 */
export function selectMoment(
  product: ProductData,
  dna: MomentDnaContext,
  brand?: MomentBrandContext,
): MomentSelectionResult {
  const matched = RULES.filter((rule) => rule.matches(product, dna, brand)).sort(
    (a, b) => (b.weight ?? 1) - (a.weight ?? 1),
  )

  const winner = matched[0]
  if (!winner) {
    return {
      moment: FALLBACK,
      reasoning: `No rule matched product "${product.title}" — defaulted to ${momentTemplateById[FALLBACK].name} for safety.`,
      alternatives: ['M10', 'M02'],
    }
  }

  const moment = winner.pick
  const alternatives = Array.from(
    new Set(
      matched
        .slice(1)
        .map((r) => r.pick)
        .filter((id) => id !== moment),
    ),
  ).slice(0, 2)

  return {
    moment,
    reasoning: winner.description,
    alternatives,
  }
}

/**
 * Convenience: resolve a {@link MomentSelectionResult} to its full
 * template payload alongside the alternative templates for the gallery.
 */
export function selectMomentTemplate(
  product: ProductData,
  dna: MomentDnaContext,
  brand?: MomentBrandContext,
): {
  primary: MomentPromptTemplate
  alternatives: MomentPromptTemplate[]
  reasoning: string
} {
  const sel = selectMoment(product, dna, brand)
  return {
    primary: momentTemplateById[sel.moment],
    alternatives: sel.alternatives.map((id) => momentTemplateById[id]),
    reasoning: sel.reasoning,
  }
}

export { momentTemplates, momentTemplateById }
