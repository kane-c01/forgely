import type { MomentPromptTemplate } from '../types'

export const m04_breathing_still: MomentPromptTemplate = {
  id: 'M04',
  slug: 'breathing_still',
  name: 'Breathing Still',
  description:
    'Product sits in absolute stillness while soft light, dust motes or steam slowly drift across the scene.',
  bestFor: [
    'ceramics',
    'luxury_homewares',
    'tea_and_coffee',
    'fine_fragrance',
    'editorial_objects',
  ],
  basePrompt: `{{product_description}} placed on {{surface}}, soft {{light_source}} slowly shifting across the scene, subtle {{atmosphere_element}}, minimal motion, shallow depth of field, cinematic stillness, {{dna_style_keywords}}, completely static camera, ambient peaceful quality, 24fps`,
  cameraHints: 'completely static camera, no zoom, no pan',
  durationSec: 7,
  loopStrategy: 'start and end with identical light position',
  successRate: 97,
  variations: [
    {
      id: 'shadow_drift',
      description: 'Window blinds shadow drifts slowly across the scene',
    },
    {
      id: 'dust_motes',
      description: 'Dust particles float through a beam of side light',
    },
    {
      id: 'steam_curl',
      description: 'A single curl of steam rises and dissipates',
    },
  ],
  failureFallback: 'M10',
  referenceUrl: 'https://placehold.co/forgely/moments/breathing_still.mp4',
  referenceVideo: '/moment-references/breathing_still.mp4',
}
