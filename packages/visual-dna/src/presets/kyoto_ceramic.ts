import type { VisualDNA } from '../types'

export const kyotoCeramic: VisualDNA = {
  id: 'kyoto_ceramic',
  name: 'Kyoto Ceramic',
  description:
    'Quiet, warm, hand-made minimalism — morning window light over wabi-sabi ceramics, slow camera, abundant negative space.',
  bestFor: ['ceramics', 'tea', 'incense', 'artisan_homewares', 'eastern_aesthetic', 'craft'],
  referenceBrands: ['Toast', 'Postalco', 'Niwaki', 'Kettl Tea', 'Ippodo'],
  colors: {
    primary: '#2D2A26',
    secondary: '#8B5A3C',
    accent: '#C4A179',
    bg: '#FEFDFB',
    fg: '#2D2A26',
    muted: '#E8E2D9',
    semantic: {
      success: '#7A8B5C',
      warning: '#B98B3A',
      error: '#A0463F',
    },
  },
  fonts: {
    display: { family: 'Fraunces', weights: [300, 400], source: 'google' },
    heading: { family: 'Fraunces', weights: [500, 600], source: 'google' },
    body: { family: 'Inter', weights: [400, 500], source: 'google' },
    mono: { family: 'JetBrains Mono', weights: [400], source: 'google' },
  },
  cameraLanguage: {
    pace: 'slow',
    style: 'static',
    perspective: 'eye_level',
    avgShotDuration: 7,
  },
  colorGrade: {
    temperature: 'warm',
    saturation: 'desaturated',
    contrast: 'low',
    highlights: '#FBF3E5',
    shadows: '#27241F',
    overallMood: ['warm', 'soft', 'organic', 'meditative'],
  },
  lighting: {
    source: 'natural_window',
    direction: 'side',
    intensity: 'soft',
  },
  texture: { filmGrain: 'subtle', motionBlur: 'none', depth: 'shallow' },
  composition: { framing: 'asymmetric', negativeSpace: 'abundant' },
  promptBuilder: {
    styleKeywords: [
      'soft morning light',
      'natural wood tones',
      'wabi-sabi ceramics',
      'cinematic stillness',
      'shallow depth of field',
      'zen minimalism',
    ],
    negativeKeywords: ['bright', 'saturated', 'busy', 'chaotic', 'plastic', 'neon'],
    technicalSpecs: '24fps, Arri Alexa look, soft Rembrandt lighting, 50mm prime',
  },
}
