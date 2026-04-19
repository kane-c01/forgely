import type { MomentPromptTemplate } from '../types'

export const m07_fabric_drape: MomentPromptTemplate = {
  id: 'M07',
  slug: 'fabric_drape',
  name: 'Fabric Drape',
  description:
    'A flowing length of fabric (silk, linen, gauze) drifts across or behind the product, exposing it gracefully.',
  bestFor: ['apparel', 'accessories', 'home_textiles', 'fragrance'],
  basePrompt: `{{product_description}} placed in soft {{light_source}} light, length of {{fabric_type}} fabric flowing through the frame, gently sliding past or revealing the product, slow ballet-like motion, micro-detailed weave texture, cinematic fashion photography, {{dna_style_keywords}}, 24fps`,
  cameraHints: 'subtle camera drift in counter direction to fabric motion',
  durationSec: 7,
  loopStrategy: 'fabric exits the frame mirroring the entrance silhouette',
  successRate: 82,
  variations: [
    {
      id: 'silk_white',
      description: 'White silk catching warm side light',
    },
    {
      id: 'linen_natural',
      description: 'Loose natural linen with rough hand-feel weave',
    },
    {
      id: 'gauze_pastel',
      description: 'Translucent pastel gauze blurring the product softly',
    },
  ],
  failureFallback: 'M04',
  referenceUrl: 'https://placehold.co/forgely/moments/fabric_drape.mp4',
  referenceVideo: '/moment-references/fabric_drape.mp4',
}
