import type { MomentPromptTemplate } from '../types'

export const m10_environmental_embed: MomentPromptTemplate = {
  id: 'M10',
  slug: 'environmental_embed',
  name: 'Environmental Embed',
  description:
    'Product nests inside a richly atmospheric environment with naturally moving elements (wind, candlelight, foliage).',
  bestFor: ['lifestyle', 'home', 'apparel', 'food', 'travel', 'craft'],
  basePrompt: `{{product_description}} naturally placed inside {{environment_description}}, ambient elements like {{atmosphere_element}} moving subtly, {{light_source}} casting story-rich shadows, lifestyle cinematography with believable depth, {{dna_style_keywords}}, 24fps`,
  cameraHints: 'slow dolly or extremely subtle drift; depth-of-field locks on product',
  durationSec: 8,
  loopStrategy: 'ambient motion (wind, candles, leaves) returns to opening pose',
  successRate: 93,
  variations: [
    {
      id: 'morning_kitchen',
      description: 'Sunlit kitchen counter with steam from coffee curling',
    },
    {
      id: 'forest_floor',
      description: 'Forest floor at dawn with falling leaves and dappled light',
    },
    {
      id: 'studio_workshop',
      description: 'Artisan workshop with floating dust in the side light',
    },
  ],
  failureFallback: 'M04',
  referenceUrl: 'https://placehold.co/forgely/moments/environmental_embed.mp4',
}
