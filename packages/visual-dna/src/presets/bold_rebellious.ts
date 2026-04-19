import type { VisualDNA } from '../types'

export const boldRebellious: VisualDNA = {
  id: 'bold_rebellious',
  name: 'Bold Rebellious',
  description:
    'Brutalist black-and-white with hot red accents and aggressive type — disruptive challenger brands.',
  bestFor: [
    'streetwear_drop',
    'energy_drinks',
    'subculture_lifestyle',
    'protein_brands',
    'merch',
    'manifesto_brands',
  ],
  referenceBrands: ['Off-White', 'Liquid Death', 'Diesel', 'Public Enemy merch'],
  referenceImage: '/dna-references/bold_rebellious.jpg',
  colors: {
    primary: '#0B0B0B',
    secondary: '#F4F4F4',
    accent: '#FF1F1F',
    bg: '#F4F4F4',
    fg: '#0B0B0B',
    muted: '#E0E0E0',
    semantic: {
      success: '#22C55E',
      warning: '#FFB800',
      error: '#FF1F1F',
    },
  },
  fonts: {
    display: { family: 'Druk Wide', weights: [800], source: 'adobe' },
    heading: { family: 'Druk Wide', weights: [700], source: 'adobe' },
    body: { family: 'Inter', weights: [500, 700], source: 'google' },
    mono: { family: 'JetBrains Mono', weights: [500, 700], source: 'google' },
  },
  cameraLanguage: {
    pace: 'fast',
    style: 'dynamic',
    perspective: 'varied',
    avgShotDuration: 4,
  },
  colorGrade: {
    temperature: 'neutral',
    saturation: 'vibrant',
    contrast: 'high',
    highlights: '#FFFFFF',
    shadows: '#000000',
    overallMood: ['rebellious', 'punk', 'loud', 'provocative'],
  },
  lighting: {
    source: 'dramatic',
    direction: 'top',
    intensity: 'hard',
  },
  texture: { filmGrain: 'heavy', motionBlur: 'cinematic', depth: 'medium' },
  composition: { framing: 'symmetric', negativeSpace: 'minimal' },
  promptBuilder: {
    styleKeywords: [
      'high contrast black and white',
      'red blood accent',
      'brutalist composition',
      'punk poster aesthetic',
      'photocopy grain',
    ],
    negativeKeywords: ['pastel', 'minimal corporate', 'soft', 'feminine glow'],
    technicalSpecs: '24fps, hard direct flash, harsh shadows, photocopy halftone overlay',
  },
}
