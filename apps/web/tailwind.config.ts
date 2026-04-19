import type { Config } from 'tailwindcss'

/**
 * Forgely Design Tokens (临时内联，等 W2 完成 packages/design-tokens 后切换为 import preset)
 * 来源：docs/MASTER.md 17.2 - 17.4
 */
const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
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
          1: '#FF6B1A',
          2: '#00D9FF',
          3: '#A855F7',
          4: '#22C55E',
          5: '#EAB308',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'Fraunces', 'serif'],
        heading: ['var(--font-heading)', 'Inter', 'sans-serif'],
        body: ['var(--font-body)', 'Inter', 'sans-serif'],
        mono: ['var(--font-mono)', 'JetBrains Mono', 'monospace'],
      },
      fontSize: {
        'hero-mega': ['clamp(4rem, 10vw, 9rem)', { lineHeight: '0.95', letterSpacing: '-0.04em' }],
        display: ['clamp(3rem, 6vw, 5rem)', { lineHeight: '1', letterSpacing: '-0.03em' }],
        h1: ['clamp(2rem, 4vw, 3rem)', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        h2: ['clamp(1.5rem, 2.5vw, 2rem)', { lineHeight: '1.15', letterSpacing: '-0.01em' }],
        h3: ['1.25rem', { lineHeight: '1.3' }],
        'body-lg': ['1.125rem', { lineHeight: '1.6' }],
        body: ['1rem', { lineHeight: '1.6' }],
        small: ['0.875rem', { lineHeight: '1.5' }],
        caption: ['0.75rem', { lineHeight: '1.4', letterSpacing: '0.02em' }],
      },
      spacing: {
        18: '4.5rem',
        22: '5.5rem',
        30: '7.5rem',
      },
      borderRadius: {
        sm: '6px',
        md: '10px',
        lg: '14px',
        xl: '20px',
        '2xl': '28px',
      },
      boxShadow: {
        subtle:
          '0 1px 0 rgba(255,255,255,0.04) inset, 0 1px 2px rgba(0,0,0,0.4)',
        elevated:
          '0 1px 0 rgba(255,255,255,0.06) inset, 0 8px 24px rgba(0,0,0,0.6)',
        'glow-forge': '0 0 40px rgba(255,107,26,0.3)',
        'glow-data': '0 0 20px rgba(0,217,255,0.4)',
      },
      transitionTimingFunction: {
        standard: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
        decelerate: 'cubic-bezier(0.0, 0.0, 0.2, 1)',
        accelerate: 'cubic-bezier(0.4, 0.0, 1, 1)',
      },
      transitionDuration: {
        micro: '120ms',
        short: '200ms',
        medium: '400ms',
        long: '600ms',
        cinematic: '1000ms',
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
