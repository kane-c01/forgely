/**
 * Forgely corner radius scale.
 * Source: docs/MASTER.md §17.4.
 */
export const radius = {
  none: '0px',
  sm: '6px',
  md: '10px',
  lg: '14px',
  xl: '20px',
  '2xl': '28px',
  full: '9999px',
} as const

export type Radius = typeof radius
