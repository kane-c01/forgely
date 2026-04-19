# @forgely/product-moments

> 10 hero Product Moment templates, the rule-based selector used by the Director Agent (T13), and the Kling 2.0 prompt builder used by the Artist Agent (T16).

See `docs/MASTER.md` §11 and Appendix B for the full spec.

## Templates

| ID  | Slug                  | Best for                       | Success rate |
| --- | --------------------- | ------------------------------ | ------------ |
| M01 | `liquid_bath`         | Beverages, skincare, fragrance | 95 %         |
| M02 | `levitation`          | Electronics, watches, jewelry  | 92 %         |
| M03 | `light_sweep`         | Watches, jewelry, metal goods  | 94 %         |
| M04 | `breathing_still`     | Ceramics, luxury homewares     | 97 % ★       |
| M05 | `droplet_ripple`      | Skincare, beauty, beverages    | 88 %         |
| M06 | `mist_emergence`      | Fragrance, haircare, spa       | 85 %         |
| M07 | `fabric_drape`        | Apparel, accessories, home     | 82 %         |
| M08 | `ingredient_ballet`   | Supplements, skincare, gourmet | 80 %         |
| M09 | `surface_interaction` | Cosmetics, craft, food         | 87 %         |
| M10 | `environmental_embed` | Lifestyle, home, travel        | 93 %         |

★ M04 Breathing Still is the safe fallback when no rule matches.

## Usage

```ts
import { selectMomentTemplate, buildKlingPrompt } from '@forgely/product-moments'
import { recommendDNA, buildPromptFragments } from '@forgely/visual-dna'

const { dna } = recommendDNA({ category: 'fragrance' })
const dnaCtx = {
  id: dna.id,
  styleKeywords: dna.promptBuilder.styleKeywords,
  negativeKeywords: dna.promptBuilder.negativeKeywords,
  colorGradeMood: dna.colorGrade.overallMood,
  technicalSpecs: dna.promptBuilder.technicalSpecs,
}

const product = {
  id: 'p1',
  title: 'Aurora 30ml fragrance',
  category: 'fragrance',
  isFragrance: true,
  materials: ['glass'],
}

const sel = selectMomentTemplate(product, dnaCtx)
const payload = buildKlingPrompt({
  moment: sel.primary,
  product,
  dna: dnaCtx,
  variationIndex: 0,
})
```
