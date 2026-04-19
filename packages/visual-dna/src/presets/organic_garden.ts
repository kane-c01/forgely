import type { VisualDNA } from '../types'

export const organicGarden: VisualDNA = {
  id: 'organic_garden',
  name: 'Organic Garden',
  description:
    'Earth and moss palette layered with botanical detail — clean food and natural skincare on linen and oak.',
  bestFor: [
    'natural_food',
    'organic_skincare',
    'tea_and_herbs',
    'mother_and_baby',
    'kitchenware',
    'garden_lifestyle',
  ],
  referenceBrands: ['Our Place', 'Tata Harper', 'Erewhon', 'Vintner\u2019s Daughter'],
  colors: {
    primary: '#2F3A2A',
    secondary: '#7A8C5A',
    accent: '#C49063',
    bg: '#F6F1E7',
    fg: '#2F3A2A',
    muted: '#DDD2BD',
    semantic: {
      success: '#5F8B4C',
      warning: '#C29449',
      error: '#A0463F',
    },
  },
  fonts: {
    display: { family: 'Fraunces', weights: [400, 600], source: 'google' },
    heading: { family: 'Fraunces', weights: [500, 600], source: 'google' },
    body: { family: 'Inter', weights: [400, 500], source: 'google' },
  },
  cameraLanguage: {
    pace: 'slow',
    style: 'floating',
    perspective: 'eye_level',
    avgShotDuration: 6,
  },
  colorGrade: {
    temperature: 'warm',
    saturation: 'natural',
    contrast: 'medium',
    highlights: '#FBF5E5',
    shadows: '#1F2A1B',
    overallMood: ['organic', 'warm', 'wholesome', 'crafted'],
  },
  lighting: {
    source: 'natural_window',
    direction: 'side',
    intensity: 'soft',
  },
  texture: { filmGrain: 'subtle', motionBlur: 'subtle', depth: 'medium' },
  composition: { framing: 'asymmetric', negativeSpace: 'balanced' },
  promptBuilder: {
    styleKeywords: [
      'earth tones',
      'fresh botanicals',
      'linen and oak',
      'soft golden hour',
      'natural styling',
    ],
    negativeKeywords: ['plastic', 'synthetic', 'neon', 'polished', 'studio sterile'],
    technicalSpecs: '24fps, 50mm lens, golden-hour window light, gentle slider movement',
  },
}
