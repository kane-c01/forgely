import type { DnaId, VisualDNA } from '../types'

import { boldRebellious } from './bold_rebellious'
import { californiaWellness } from './california_wellness'
import { clinicalWellness } from './clinical_wellness'
import { editorialFashion } from './editorial_fashion'
import { kyotoCeramic } from './kyoto_ceramic'
import { neonNight } from './neon_night'
import { nordicMinimal } from './nordic_minimal'
import { organicGarden } from './organic_garden'
import { playfulPop } from './playful_pop'
import { techPrecision } from './tech_precision'

/**
 * Ordered registry of every shipped Visual DNA. The order matches the
 * Appendix A spec and is used by the gallery in the user dashboard.
 */
export const visualDNAs: VisualDNA[] = [
  kyotoCeramic,
  clinicalWellness,
  playfulPop,
  nordicMinimal,
  techPrecision,
  editorialFashion,
  organicGarden,
  neonNight,
  californiaWellness,
  boldRebellious,
]

export const visualDNAById: Record<DnaId, VisualDNA> = visualDNAs.reduce(
  (acc, dna) => {
    acc[dna.id] = dna
    return acc
  },
  {} as Record<DnaId, VisualDNA>,
)

export {
  boldRebellious,
  californiaWellness,
  clinicalWellness,
  editorialFashion,
  kyotoCeramic,
  neonNight,
  nordicMinimal,
  organicGarden,
  playfulPop,
  techPrecision,
}
