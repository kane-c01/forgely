import type { MomentPromptTemplate } from '../types'

export const m05_droplet_ripple: MomentPromptTemplate = {
  id: 'M05',
  slug: 'droplet_ripple',
  name: 'Droplet Ripple',
  description:
    'A single liquid droplet falls into still surface near the product, creating concentric ripples and a slow-motion crown.',
  bestFor: ['skincare', 'beauty_serums', 'beverages', 'home_fragrance'],
  basePrompt: `{{product_description}} positioned beside a still pool of {{liquid_type}}, single droplet falling in slow motion creating concentric ripples and a delicate crown splash, soft {{light_source}} casts caustics across the product, hyper-detailed surface tension, cinematic macro photography, {{dna_style_keywords}}, 24fps slow motion`,
  cameraHints: 'static macro camera, slow motion 240fps captured then conformed to 24fps',
  durationSec: 6,
  loopStrategy: 'ripple completes its expansion and water settles to mirror calm',
  successRate: 88,
  variations: [
    {
      id: 'oil_droplet',
      description: 'Golden oil drop with slower viscous spread',
    },
    {
      id: 'cream_drop',
      description: 'Thick cream droplet creating a soft crater',
    },
    {
      id: 'water_burst',
      description: 'Fast clear water droplet with dramatic crown',
    },
  ],
  failureFallback: 'M01',
  referenceUrl: 'https://placehold.co/forgely/moments/droplet_ripple.mp4',
}
