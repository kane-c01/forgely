import type { VisualDNA } from '../types'

export const clinicalWellness: VisualDNA = {
  id: 'clinical_wellness',
  name: 'Clinical Wellness',
  description:
    'Serious, scientific, premium — apothecary jars on dark surfaces with surgical lighting and metallic gold accents.',
  bestFor: ['supplements', 'skincare', 'beauty', 'biotech', 'pharmaceutical', 'wellness_premium'],
  referenceBrands: ['Aesop', 'La Mer', 'Augustinus Bader', 'BIOLOGIQUE RECHERCHE'],
  colors: {
    primary: '#0F1A14',
    secondary: '#C9A76A',
    accent: '#D8C58A',
    bg: '#F4F0EA',
    fg: '#0F1A14',
    muted: '#1F2B23',
    semantic: {
      success: '#4F7F5A',
      warning: '#C29449',
      error: '#9C2F2F',
    },
  },
  fonts: {
    display: { family: 'Tiempos Headline', weights: [400, 600], source: 'adobe' },
    heading: { family: 'Tiempos Headline', weights: [500, 600], source: 'adobe' },
    body: { family: 'Inter', weights: [400, 500], source: 'google' },
    mono: { family: 'JetBrains Mono', weights: [400], source: 'google' },
  },
  cameraLanguage: {
    pace: 'slow',
    style: 'static',
    perspective: 'eye_level',
    avgShotDuration: 6,
  },
  colorGrade: {
    temperature: 'cool',
    saturation: 'desaturated',
    contrast: 'high',
    highlights: '#E8DFC9',
    shadows: '#070D0A',
    overallMood: ['clinical', 'precise', 'feminine', 'premium'],
  },
  lighting: {
    source: 'studio_soft',
    direction: 'top',
    intensity: 'medium',
  },
  texture: { filmGrain: 'none', motionBlur: 'none', depth: 'shallow' },
  composition: { framing: 'centered', negativeSpace: 'balanced' },
  promptBuilder: {
    styleKeywords: [
      'apothecary aesthetic',
      'studio lighting',
      'glass and gold',
      'precise reflections',
      'editorial product photography',
      'cinematic depth',
    ],
    negativeKeywords: ['casual', 'busy', 'cartoonish', 'low contrast', 'plastic'],
    technicalSpecs: '24fps, macro lens 100mm, polarizer, dark moody studio look',
  },
}
