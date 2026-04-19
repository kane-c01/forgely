import type { MomentPromptTemplate } from '../types'

export const m03_light_sweep: MomentPromptTemplate = {
  id: 'M03',
  slug: 'light_sweep',
  name: 'Light Sweep',
  description:
    'A focused beam of light arcs across the product surface, catching brushed metal or polished detail.',
  bestFor: ['watch', 'jewelry', 'electronics', 'metal_goods', 'tools'],
  basePrompt: `{{product_description}} on {{surface}}, single focused light beam slowly sweeping across the {{material}} surface from {{light_direction}}, revealing metallic highlights and fine engraving detail, ultra clean studio backdrop, cinematic product photography, {{dna_style_keywords}}, 24fps`,
  cameraHints: 'static low-angle camera, light is the only motion',
  durationSec: 6,
  loopStrategy: 'sweep returns to origin with matching highlight position',
  successRate: 94,
  variations: [
    {
      id: 'horizontal_sweep',
      description: 'Light bar slides horizontally left-to-right',
    },
    {
      id: 'vertical_sweep',
      description: 'Light cascade falls top to bottom over engraved detail',
    },
    {
      id: 'orbit_sweep',
      description: 'Light orbits the product 360° catching every facet',
    },
  ],
  failureFallback: 'M04',
  referenceUrl: 'https://placehold.co/forgely/moments/light_sweep.mp4',
}
