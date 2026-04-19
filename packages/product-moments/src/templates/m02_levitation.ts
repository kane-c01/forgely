import type { MomentPromptTemplate } from '../types'

export const m02_levitation: MomentPromptTemplate = {
  id: 'M02',
  slug: 'levitation',
  name: 'Levitation',
  description:
    'Product floats and slowly rotates against a clean studio backdrop with a single hard rim light.',
  bestFor: ['electronics', 'cosmetics', 'watch', 'jewelry', 'industrial_design'],
  basePrompt: `{{product_description}} levitating against {{backdrop_color}} backdrop, slowly rotating on a vertical axis, lit by single hard rim light from {{light_direction}}, sharp catch-lights along edges, no visible support, cinematic product photography, {{dna_style_keywords}}, 24fps`,
  cameraHints: 'static camera, slight focus pull as product rotates 360°',
  durationSec: 8,
  loopStrategy: 'product completes a full rotation back to starting orientation',
  successRate: 92,
  variations: [
    {
      id: 'monochrome_studio',
      description: 'Pure black backdrop, single white rim light',
    },
    {
      id: 'colored_gradient',
      description: 'Smooth color gradient backdrop matching brand accent',
    },
    {
      id: 'mirror_floor',
      description: 'Mirrored floor catching reflection of the levitating product',
    },
  ],
  failureFallback: 'M03',
  referenceUrl: 'https://placehold.co/forgely/moments/levitation.mp4',
  referenceVideo: '/moment-references/levitation.mp4',
}
