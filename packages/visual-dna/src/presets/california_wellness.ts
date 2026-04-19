import type { VisualDNA } from '../types'

export const californiaWellness: VisualDNA = {
  id: 'california_wellness',
  name: 'California Wellness',
  description:
    'Sun-soaked Venice Beach palette of bone, terracotta and gold — softly aspirational lifestyle brands.',
  bestFor: [
    'wellness_lifestyle',
    'yoga',
    'supplements_premium',
    'beauty_clean',
    'travel',
    'apparel_athleisure',
  ],
  referenceBrands: ['Ritual', 'AG1', 'Rhode', 'Vuori', 'Arrae'],
  colors: {
    primary: '#3B2A1E',
    secondary: '#E0A95F',
    accent: '#F2D9B6',
    bg: '#FBF5EC',
    fg: '#3B2A1E',
    muted: '#EBDDC9',
    semantic: {
      success: '#7FA66B',
      warning: '#E0A95F',
      error: '#B25438',
    },
  },
  fonts: {
    display: { family: 'Fraunces', weights: [400, 600], source: 'google' },
    heading: { family: 'Fraunces', weights: [500, 700], source: 'google' },
    body: { family: 'Inter', weights: [400, 500], source: 'google' },
  },
  cameraLanguage: {
    pace: 'medium',
    style: 'floating',
    perspective: 'eye_level',
    avgShotDuration: 6,
  },
  colorGrade: {
    temperature: 'warm',
    saturation: 'natural',
    contrast: 'medium',
    highlights: '#FCEFD5',
    shadows: '#241712',
    overallMood: ['warm', 'aspirational', 'sunlit', 'grounded'],
  },
  lighting: {
    source: 'outdoor_sunset',
    direction: 'backlit',
    intensity: 'soft',
  },
  texture: { filmGrain: 'subtle', motionBlur: 'subtle', depth: 'medium' },
  composition: { framing: 'rule_of_thirds', negativeSpace: 'balanced' },
  promptBuilder: {
    styleKeywords: [
      'golden hour California sun',
      'soft terracotta',
      'beach linen',
      'warm rim light',
      'aspirational wellness lifestyle',
    ],
    negativeKeywords: ['cold', 'clinical', 'neon', 'industrial', 'gritty'],
    technicalSpecs: '24fps, 35mm lens, backlit golden hour, soft slider drift',
  },
}
