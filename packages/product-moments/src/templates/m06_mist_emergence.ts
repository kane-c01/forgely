import type { MomentPromptTemplate } from '../types'

export const m06_mist_emergence: MomentPromptTemplate = {
  id: 'M06',
  slug: 'mist_emergence',
  name: 'Mist Emergence',
  description:
    'Soft fog clears to reveal the product, with delicate light beams cutting through the dispersing vapor.',
  bestFor: ['fragrance', 'haircare', 'spa_lifestyle', 'aromatherapy'],
  basePrompt: `dense soft mist filling the frame, slowly dissipating to reveal {{product_description}} centered against {{backdrop_color}} backdrop, volumetric {{light_color}} light beams cutting through the vapor, atmospheric depth, cinematic perfume commercial style, {{dna_style_keywords}}, 24fps`,
  cameraHints: 'almost-still camera, slow forward dolly of 5cm during reveal',
  durationSec: 7,
  loopStrategy: 'product fades back into mist near loop end',
  successRate: 85,
  variations: [
    {
      id: 'cool_morning',
      description: 'Cool blue morning fog with crisp light shafts',
    },
    {
      id: 'warm_amber',
      description: 'Warm amber haze with golden light beams',
    },
    {
      id: 'pink_dusk',
      description: 'Pink dusk vapor with soft directional light',
    },
  ],
  failureFallback: 'M04',
  referenceUrl: 'https://placehold.co/forgely/moments/mist_emergence.mp4',
  referenceVideo: '/moment-references/mist_emergence.mp4',
}
