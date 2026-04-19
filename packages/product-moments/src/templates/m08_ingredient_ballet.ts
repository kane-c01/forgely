import type { MomentPromptTemplate } from '../types'

export const m08_ingredient_ballet: MomentPromptTemplate = {
  id: 'M08',
  slug: 'ingredient_ballet',
  name: 'Ingredient Ballet',
  description:
    'Hero ingredients (botanicals, capsules, herbs, spices) orbit the product in slow motion, choreographed and weightless.',
  bestFor: ['supplements', 'skincare', 'cosmetics', 'gourmet_food', 'tea'],
  basePrompt: `{{product_description}} centered, surrounded by {{ingredient_list}} floating in slow motion at varying depths, gently orbiting in zero gravity, soft {{light_source}} casting cinematic shadows, hyper-detailed macro textures, premium supplement / skincare commercial style, {{dna_style_keywords}}, 24fps`,
  cameraHints: 'slow vertical dolly, parallax against orbiting ingredients',
  durationSec: 8,
  loopStrategy: 'ingredients return to starting positions with synchronized phase',
  successRate: 80,
  variations: [
    {
      id: 'botanical_orbit',
      description: 'Fresh herbs and petals orbiting at three depth layers',
    },
    {
      id: 'capsule_spiral',
      description: 'Capsules spiraling around the bottle in DNA helix',
    },
    {
      id: 'spice_cloud',
      description: 'Ground spices forming a soft cinematic cloud',
    },
  ],
  failureFallback: 'M05',
  referenceUrl: 'https://placehold.co/forgely/moments/ingredient_ballet.mp4',
  referenceVideo: '/moment-references/ingredient_ballet.mp4',
}
