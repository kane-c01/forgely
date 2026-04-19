import type { Config } from 'tailwindcss'
import { forgelyPreset } from '@forgely/design-tokens/tailwind'

/**
 * apps/web Tailwind config — extends the shared `@forgely/design-tokens`
 * preset and layers on web-only keyframes / hero typography refinements.
 *
 * The preset already provides:
 *   - colors (bg-* / text-* / forge-* / success / warning / error / info / data-*)
 *   - fontFamily (display / heading / body / mono via CSS variables)
 *   - fontSize (hero-mega / display / h1..h3 / body-lg / body / small / caption)
 *   - spacing / borderRadius
 *   - boxShadow (subtle / elevated / glow-forge / glow-data)
 *   - transitionTimingFunction (standard / decelerate / accelerate)
 *   - transitionDuration (micro / short / medium / long / cinematic)
 *
 * If the shared preset evolves, override here only what is unique to the
 * marketing site (hero kerning, marquee animation, etc.).
 */
const config: Config = {
  presets: [forgelyPreset],
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      letterSpacing: {
        'hero-mega': '-0.04em',
        display: '-0.03em',
      },
      lineHeight: {
        'hero-mega': '0.95',
        display: '1',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'forge-pulse': {
          '0%, 100%': { boxShadow: '0 0 0 rgba(255,107,26,0)' },
          '50%': { boxShadow: '0 0 40px rgba(255,107,26,0.4)' },
        },
        marquee: {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-50%)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 600ms cubic-bezier(0.0,0.0,0.2,1) both',
        'forge-pulse': 'forge-pulse 2.4s cubic-bezier(0.4,0.0,0.2,1) infinite',
        marquee: 'marquee 40s linear infinite',
      },
    },
  },
  plugins: [],
}

export default config
