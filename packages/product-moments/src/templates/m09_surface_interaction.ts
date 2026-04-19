import type { MomentPromptTemplate } from '../types'

export const m09_surface_interaction: MomentPromptTemplate = {
  id: 'M09',
  slug: 'surface_interaction',
  name: 'Surface Interaction',
  description:
    'A hand, finger, brush or water gently interacts with the product surface, demonstrating texture and finish.',
  bestFor: ['cosmetics', 'craft', 'skincare', 'food', 'leather_goods'],
  basePrompt: `close-up macro of {{product_description}}, {{interaction_type}} interacting with the {{material}} surface, slow tactile motion, ultra-detailed texture and reflections, soft {{light_source}} light, cinematic beauty commercial style, {{dna_style_keywords}}, 24fps`,
  cameraHints: 'macro lens, very slight handheld breathing for organic feel',
  durationSec: 7,
  loopStrategy: 'interaction completes and surface restores to neutral state',
  successRate: 87,
  variations: [
    {
      id: 'finger_swipe',
      description: 'Finger slowly swipes through cream / paste',
    },
    {
      id: 'water_pour',
      description: 'Water pouring slowly over the product surface',
    },
    {
      id: 'brush_dust',
      description: 'Brush sweeping powder or dust off the surface',
    },
  ],
  failureFallback: 'M03',
  referenceUrl: 'https://placehold.co/forgely/moments/surface_interaction.mp4',
  referenceVideo: '/moment-references/surface_interaction.mp4',
}
