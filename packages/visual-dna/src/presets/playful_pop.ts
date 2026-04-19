import type { VisualDNA } from '../types'

export const playfulPop: VisualDNA = {
  id: 'playful_pop',
  name: 'Playful Pop',
  description:
    'High-saturation, high-energy candy palette with kinetic camera motion — Liquid Death meets Olipop.',
  bestFor: ['beverages', 'snacks', 'kids', 'streetwear', 'pop_culture', 'lifestyle'],
  referenceBrands: ['Recess', 'Poppi', 'Olipop', 'Liquid Death', 'Glossier Play'],
  colors: {
    primary: '#FF3D7F',
    secondary: '#33D6A6',
    accent: '#FFE066',
    bg: '#FFF6F0',
    fg: '#1A1A24',
    muted: '#FFD1E0',
    semantic: {
      success: '#33D6A6',
      warning: '#FFB347',
      error: '#FF4D4D',
    },
  },
  fonts: {
    display: { family: 'Poppins', weights: [700, 900], source: 'google' },
    heading: { family: 'Poppins', weights: [600, 700], source: 'google' },
    body: { family: 'DM Sans', weights: [400, 500], source: 'google' },
  },
  cameraLanguage: {
    pace: 'fast',
    style: 'dynamic',
    perspective: 'varied',
    avgShotDuration: 4,
  },
  colorGrade: {
    temperature: 'warm',
    saturation: 'vibrant',
    contrast: 'high',
    highlights: '#FFFCE8',
    shadows: '#23142B',
    overallMood: ['playful', 'bold', 'fun', 'energetic'],
  },
  lighting: {
    source: 'studio_soft',
    direction: 'front',
    intensity: 'hard',
  },
  texture: { filmGrain: 'none', motionBlur: 'subtle', depth: 'medium' },
  composition: { framing: 'centered', negativeSpace: 'minimal' },
  promptBuilder: {
    styleKeywords: [
      'high saturation candy colors',
      'splash dynamic motion',
      'pop art aesthetic',
      'crisp studio lighting',
      'bold geometric backdrop',
    ],
    negativeKeywords: ['muted', 'desaturated', 'serious', 'minimal', 'film grain'],
    technicalSpecs: '60fps, vibrant grade, hard rim light, snappy cuts',
  },
}
