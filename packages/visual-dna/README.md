# @forgely/visual-dna

> 10 cinematic Visual DNA presets, the matcher used by the Analyzer Agent (T10), and the deterministic prompt-builder used by the Director / Artist Agents.

See `docs/MASTER.md` §10 and Appendix A for the full spec.

## Presets

| ID                    | Best for                                    |
| --------------------- | ------------------------------------------- |
| `kyoto_ceramic`       | Ceramics, tea, eastern aesthetic crafts     |
| `clinical_wellness`   | Premium skincare, supplements, biotech      |
| `playful_pop`         | Beverages, snacks, kids, streetwear         |
| `nordic_minimal`      | Home, basics apparel, family lifestyle      |
| `tech_precision`      | Electronics, audio, dev tools, hardware     |
| `editorial_fashion`   | Luxury fashion, eyewear, leather goods      |
| `organic_garden`      | Natural food, organic skincare, mother+baby |
| `neon_night`          | Energy drinks, gaming, nightlife brands     |
| `california_wellness` | Premium wellness, athleisure, travel        |
| `bold_rebellious`     | Streetwear drops, challenger brands         |

## Usage

```ts
import { visualDNAs, visualDNAById, recommendDNA, buildPromptSuffix } from '@forgely/visual-dna'

// gallery
visualDNAs.map((dna) => dna.name)

// matcher (Analyzer ↔ DNA)
const { dna, result } = recommendDNA({
  category: 'beverages',
  toneOfVoice: ['playful', 'bold'],
  priceSegment: 'mid',
  referenceBrands: ['Olipop'],
})

// Kling / Flux prompt fragments
const suffix = buildPromptSuffix(dna.id)
```
