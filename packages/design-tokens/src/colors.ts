/**
 * Forgely color tokens — Cinematic Industrial palette.
 * Source: docs/MASTER.md §17.2.
 */
export const colors = {
  bg: {
    void: '#08080A',
    deep: '#0E0E11',
    surface: '#14141A',
    elevated: '#1C1C24',
  },
  border: {
    subtle: '#1F1F28',
    strong: '#2D2D3A',
  },
  text: {
    primary: '#F4F4F7',
    secondary: '#A8A8B4',
    muted: '#6B6B78',
    subtle: '#45454F',
  },
  forge: {
    orange: '#FF6B1A',
    amber: '#FFA040',
    gold: '#FFD166',
    ember: '#C74A0A',
  },
  semantic: {
    success: '#22C55E',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#00D9FF',
  },
  data: {
    series1: '#FF6B1A',
    series2: '#00D9FF',
    series3: '#A855F7',
    series4: '#22C55E',
    series5: '#EAB308',
  },
} as const

export type Colors = typeof colors
