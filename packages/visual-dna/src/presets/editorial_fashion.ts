import type { VisualDNA } from '../types'

export const editorialFashion: VisualDNA = {
  id: 'editorial_fashion',
  name: 'Editorial Fashion',
  description:
    'Black-and-white film grain with a single oxblood accent — runway-grade composition for high fashion.',
  bestFor: [
    'apparel_luxury',
    'eyewear',
    'leather_goods',
    'fragrance_premium',
    'accessories',
    'art_publications',
  ],
  referenceBrands: ['Acne Studios', 'Jacquemus', 'The Row', 'Saint Laurent'],
  colors: {
    primary: '#0E0E0E',
    secondary: '#F2EFEA',
    accent: '#7A1F1F',
    bg: '#0E0E0E',
    fg: '#F2EFEA',
    muted: '#1F1F1F',
    semantic: {
      success: '#A7B594',
      warning: '#C49E63',
      error: '#7A1F1F',
    },
  },
  fonts: {
    display: { family: 'PP Editorial New', weights: [200, 400], source: 'adobe' },
    heading: { family: 'PP Editorial New', weights: [400], source: 'adobe' },
    body: { family: 'Inter', weights: [400, 500], source: 'google' },
  },
  cameraLanguage: {
    pace: 'slow',
    style: 'floating',
    perspective: 'low_angle',
    avgShotDuration: 7,
  },
  colorGrade: {
    temperature: 'neutral',
    saturation: 'desaturated',
    contrast: 'high',
    highlights: '#F4F1EC',
    shadows: '#050505',
    overallMood: ['editorial', 'cinematic', 'sensual', 'serious'],
  },
  lighting: {
    source: 'dramatic',
    direction: 'side',
    intensity: 'hard',
  },
  texture: { filmGrain: 'heavy', motionBlur: 'cinematic', depth: 'shallow' },
  composition: { framing: 'rule_of_thirds', negativeSpace: 'abundant' },
  promptBuilder: {
    styleKeywords: [
      'black and white film',
      'Vogue editorial',
      'dramatic side light',
      '35mm grain',
      'silhouette and contrast',
    ],
    negativeKeywords: ['cartoonish', 'saturated', 'cheerful', 'plastic'],
    technicalSpecs:
      '24fps, 85mm Cooke prime, soft key + hard rim, monochrome grade with selective accent',
  },
}
