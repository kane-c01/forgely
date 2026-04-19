import type { MomentPromptTemplate } from '../types'

export const m01_liquid_bath: MomentPromptTemplate = {
  id: 'M01',
  slug: 'liquid_bath',
  name: 'Liquid Bath',
  description:
    'Hero product suspended inside a slowly rotating liquid (water, oil, ink, juice) with backlit color and rising bubbles.',
  bestFor: ['beverages', 'skincare', 'fragrance', 'liquid_supplements'],
  basePrompt: `{{product_description}} suspended inside {{liquid_type}}, slowly rotating in zero gravity, backlit with soft {{accent_color}} light, fine bubbles rising gently around the surface, cinematic product photography, {{dna_style_keywords}}, shallow depth of field, completely static camera, 24fps`,
  cameraHints: 'locked-off macro shot, no pan, no zoom; product centered',
  durationSec: 7,
  loopStrategy: 'start and end with identical bubble distribution and rotation phase',
  successRate: 95,
  variations: [
    {
      id: 'cold_drink',
      description: 'Iced tinted liquid with chunky ice cubes drifting past',
    },
    {
      id: 'oil_serum',
      description: 'Golden oil with slow viscous swirls',
    },
    {
      id: 'ink_diffuse',
      description: 'Single colored ink plume diffusing behind the product',
    },
  ],
  failureFallback: 'M04',
  referenceUrl: 'https://placehold.co/forgely/moments/liquid_bath.mp4',
}
