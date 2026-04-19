import type { VisualDNA } from '../types'

export const neonNight: VisualDNA = {
  id: 'neon_night',
  name: 'Neon Night',
  description:
    'After-hours synthwave palette of deep ink, neon magenta and cyber teal — performance and nightlife brands.',
  bestFor: [
    'streetwear_night',
    'energy_drinks',
    'gaming',
    'music_clubs',
    'crypto',
    'tech_lifestyle',
  ],
  referenceBrands: ['Liquid Death (after dark)', 'Nothing Audio', 'Ghost Energy'],
  colors: {
    primary: '#0B0B14',
    secondary: '#FF2EC4',
    accent: '#00F0FF',
    bg: '#06060C',
    fg: '#F4F4F7',
    muted: '#161623',
    semantic: {
      success: '#00F0AA',
      warning: '#FFD23F',
      error: '#FF3366',
    },
  },
  fonts: {
    display: { family: 'Monument Extended', weights: [800, 900], source: 'adobe' },
    heading: { family: 'Monument Extended', weights: [700], source: 'adobe' },
    body: { family: 'Inter', weights: [400, 500], source: 'google' },
    mono: { family: 'JetBrains Mono', weights: [500], source: 'google' },
  },
  cameraLanguage: {
    pace: 'fast',
    style: 'dynamic',
    perspective: 'low_angle',
    avgShotDuration: 4,
  },
  colorGrade: {
    temperature: 'cool',
    saturation: 'vibrant',
    contrast: 'high',
    highlights: '#9B66FF',
    shadows: '#04040A',
    overallMood: ['nocturnal', 'electric', 'rebellious', 'futuristic'],
  },
  lighting: {
    source: 'neon',
    direction: 'side',
    intensity: 'hard',
  },
  texture: { filmGrain: 'subtle', motionBlur: 'cinematic', depth: 'medium' },
  composition: { framing: 'asymmetric', negativeSpace: 'minimal' },
  promptBuilder: {
    styleKeywords: [
      'neon signage',
      'synthwave palette',
      'wet asphalt reflections',
      'volumetric light haze',
      'cinematic night photography',
    ],
    negativeKeywords: ['pastel', 'natural daylight', 'warm cozy', 'minimalist beige'],
    technicalSpecs: '24fps anamorphic lens, neon practicals, slight motion blur, deep blacks',
  },
}
