import type { VisualDNA } from '../types'

export const techPrecision: VisualDNA = {
  id: 'tech_precision',
  name: 'Tech Precision',
  description:
    'Cool grayscale, brushed metal and laser-precise type — Apple-keynote-grade hardware showcase.',
  bestFor: ['electronics', 'tools', 'audio', 'developer_tools', 'b2b_saas', 'industrial_design'],
  referenceBrands: ['Apple', 'Nothing', 'Framework', 'Teenage Engineering'],
  colors: {
    primary: '#0A0A0F',
    secondary: '#3D4754',
    accent: '#00D9FF',
    bg: '#0E1014',
    fg: '#F4F6FA',
    muted: '#1B1F25',
    semantic: {
      success: '#34D399',
      warning: '#FBBF24',
      error: '#F87171',
    },
  },
  fonts: {
    display: { family: 'Geist', weights: [500, 700], source: 'google' },
    heading: { family: 'Geist', weights: [500, 600], source: 'google' },
    body: { family: 'Geist', weights: [400, 500], source: 'google' },
    mono: { family: 'Geist Mono', weights: [400, 500], source: 'google' },
  },
  cameraLanguage: {
    pace: 'medium',
    style: 'floating',
    perspective: 'low_angle',
    avgShotDuration: 5,
  },
  colorGrade: {
    temperature: 'cool',
    saturation: 'desaturated',
    contrast: 'high',
    highlights: '#E1E8F1',
    shadows: '#040406',
    overallMood: ['precise', 'futuristic', 'industrial', 'serious'],
  },
  lighting: {
    source: 'studio_soft',
    direction: 'top',
    intensity: 'hard',
  },
  texture: { filmGrain: 'none', motionBlur: 'cinematic', depth: 'shallow' },
  composition: { framing: 'centered', negativeSpace: 'balanced' },
  promptBuilder: {
    styleKeywords: [
      'cool brushed metal',
      'precise highlights',
      'cinematic black backdrop',
      'subtle product rotation',
      'clean reflections',
    ],
    negativeKeywords: ['warm', 'organic', 'cluttered', 'pastel', 'crafted'],
    technicalSpecs: '24fps, 85mm lens, polarized hard light, motion-control rotation, ultra-clean',
  },
}
