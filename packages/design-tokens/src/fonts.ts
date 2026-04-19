/**
 * Forgely typography tokens.
 * Source: docs/MASTER.md §17.3.
 *
 * The display family targets Adobe `PP Editorial New` in production but
 * we ship with Google `Fraunces` as a free fallback that ships out of the
 * box with `next/font/google`.
 */
export const fonts = {
  display: {
    family: "'PP Editorial New', 'Fraunces', serif",
    cssVariable: '--font-display',
    weights: [200, 400] as const,
    source: 'adobe-with-google-fallback',
  },
  heading: {
    family: "'Inter Display', 'Geist', 'Inter', sans-serif",
    cssVariable: '--font-heading',
    weights: [500, 600, 700, 800] as const,
    source: 'google',
  },
  body: {
    family: "'Inter', 'Geist', sans-serif",
    cssVariable: '--font-body',
    weights: [400, 500, 600] as const,
    source: 'google',
  },
  mono: {
    family: "'JetBrains Mono', 'Geist Mono', monospace",
    cssVariable: '--font-mono',
    weights: [400, 500] as const,
    source: 'google',
  },
} as const

/**
 * Fluid font scale via `clamp()` so headings respond to viewport width
 * without breakpoints. Source: docs/MASTER.md §17.3.
 */
export const fontSize = {
  'hero-mega': 'clamp(4rem, 10vw, 9rem)',
  display: 'clamp(3rem, 6vw, 5rem)',
  h1: 'clamp(2rem, 4vw, 3rem)',
  h2: 'clamp(1.5rem, 2.5vw, 2rem)',
  h3: '1.25rem',
  'body-lg': '1.125rem',
  body: '1rem',
  small: '0.875rem',
  caption: '0.75rem',
} as const

export type Fonts = typeof fonts
export type FontSize = typeof fontSize
