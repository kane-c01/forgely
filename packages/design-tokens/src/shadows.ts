/**
 * Forgely shadow tokens — Cinematic Industrial elevation system.
 * Source: docs/MASTER.md §17.4.
 *
 * Naming follows Tailwind `shadow-*` conventions so consumers write
 * `shadow-elevated`, `shadow-glow-forge`, etc. via the preset.
 */
export const shadows = {
  none: 'none',
  subtle:
    '0 1px 0 rgba(255,255,255,0.04) inset, 0 1px 2px rgba(0,0,0,0.4)',
  elevated:
    '0 1px 0 rgba(255,255,255,0.06) inset, 0 8px 24px rgba(0,0,0,0.6)',
  overlay:
    '0 1px 0 rgba(255,255,255,0.08) inset, 0 24px 48px rgba(0,0,0,0.7)',
  'glow-forge': '0 0 40px rgba(255,107,26,0.30)',
  'glow-forge-soft': '0 0 24px rgba(255,107,26,0.18)',
  'glow-data': '0 0 20px rgba(0,217,255,0.40)',
  'glow-success': '0 0 20px rgba(34,197,94,0.35)',
  'glow-error': '0 0 20px rgba(239,68,68,0.35)',
  'inner-stroke': 'inset 0 0 0 1px rgba(255,255,255,0.06)',
} as const

export type Shadows = typeof shadows
