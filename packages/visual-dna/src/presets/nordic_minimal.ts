import type { VisualDNA } from '../types'

export const nordicMinimal: VisualDNA = {
  id: 'nordic_minimal',
  name: 'Nordic Minimal',
  description:
    'Cool whites, raw oak and linen, diffuse Scandinavian daylight — quiet utility for home and family brands.',
  bestFor: ['home', 'apparel_basics', 'kids_toys', 'lifestyle', 'craft_furniture', 'stationery'],
  referenceBrands: ['HAY', 'Muji', 'Stutterheim', 'PlanToys', 'Skagerak'],
  colors: {
    primary: '#1A1A1F',
    secondary: '#A89580',
    accent: '#D8B98C',
    bg: '#F7F4EE',
    fg: '#1A1A1F',
    muted: '#E2DAD0',
    semantic: {
      success: '#5C8467',
      warning: '#C39255',
      error: '#A04444',
    },
  },
  fonts: {
    display: { family: 'Inter Display', weights: [400, 600], source: 'google' },
    heading: { family: 'Inter Display', weights: [500, 700], source: 'google' },
    body: { family: 'Inter', weights: [400, 500], source: 'google' },
    mono: { family: 'JetBrains Mono', weights: [400], source: 'google' },
  },
  cameraLanguage: {
    pace: 'slow',
    style: 'floating',
    perspective: 'eye_level',
    avgShotDuration: 6,
  },
  colorGrade: {
    temperature: 'cool',
    saturation: 'desaturated',
    contrast: 'low',
    highlights: '#FAF7F1',
    shadows: '#1F1E1A',
    overallMood: ['quiet', 'honest', 'calm', 'natural'],
  },
  lighting: {
    source: 'natural_window',
    direction: 'diffused',
    intensity: 'soft',
  },
  texture: { filmGrain: 'subtle', motionBlur: 'none', depth: 'medium' },
  composition: { framing: 'rule_of_thirds', negativeSpace: 'abundant' },
  promptBuilder: {
    styleKeywords: [
      'scandinavian daylight',
      'matte linen textures',
      'raw oak surfaces',
      'minimal styling',
      'soft diffused light',
    ],
    negativeKeywords: ['saturated', 'busy', 'glamorous', 'neon', 'loud'],
    technicalSpecs: '24fps, 50mm lens, soft north-facing light, very subtle handheld float',
  },
}
