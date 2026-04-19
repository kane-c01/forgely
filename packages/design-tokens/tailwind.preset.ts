import type { Config } from 'tailwindcss'

import { colors } from './src/colors'
import { fontSize, fonts } from './src/fonts'
import { motion } from './src/motion'
import { radius } from './src/radius'
import { shadows } from './src/shadows'
import { spacing } from './src/spacing'

/**
 * Forgely Tailwind preset — share the Cinematic Industrial design tokens
 * across `apps/web`, `apps/app` and `apps/storefront`. Consumers add this
 * preset and provide their own `content` glob.
 */
export const forgelyPreset = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'bg-void': colors.bg.void,
        'bg-deep': colors.bg.deep,
        'bg-surface': colors.bg.surface,
        'bg-elevated': colors.bg.elevated,
        'border-subtle': colors.border.subtle,
        'border-strong': colors.border.strong,
        'text-primary': colors.text.primary,
        'text-secondary': colors.text.secondary,
        'text-muted': colors.text.muted,
        'text-subtle': colors.text.subtle,
        'forge-orange': colors.forge.orange,
        'forge-amber': colors.forge.amber,
        'forge-gold': colors.forge.gold,
        'forge-ember': colors.forge.ember,
        success: colors.semantic.success,
        warning: colors.semantic.warning,
        error: colors.semantic.error,
        info: colors.semantic.info,
        'data-1': colors.data.series1,
        'data-2': colors.data.series2,
        'data-3': colors.data.series3,
        'data-4': colors.data.series4,
        'data-5': colors.data.series5,
      },
      fontFamily: {
        display: [
          `var(${fonts.display.cssVariable})`,
          ...fonts.display.family.split(',').map((s) => s.trim()),
        ],
        heading: [
          `var(${fonts.heading.cssVariable})`,
          ...fonts.heading.family.split(',').map((s) => s.trim()),
        ],
        body: [
          `var(${fonts.body.cssVariable})`,
          ...fonts.body.family.split(',').map((s) => s.trim()),
        ],
        mono: [
          `var(${fonts.mono.cssVariable})`,
          ...fonts.mono.family.split(',').map((s) => s.trim()),
        ],
      },
      fontSize: {
        'hero-mega': fontSize['hero-mega'],
        display: fontSize.display,
        h1: fontSize.h1,
        h2: fontSize.h2,
        h3: fontSize.h3,
        'body-lg': fontSize['body-lg'],
        body: fontSize.body,
        small: fontSize.small,
        caption: fontSize.caption,
      },
      spacing: spacing as Record<string, string>,
      borderRadius: radius,
      boxShadow: shadows,
      transitionTimingFunction: motion.easing,
      transitionDuration: motion.duration,
      keyframes: {
        marquee: {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(calc(-100% - var(--gap, 0px)))' },
        },
        'marquee-vertical': {
          from: { transform: 'translateY(0)' },
          to: { transform: 'translateY(calc(-100% - var(--gap, 0px)))' },
        },
        'border-beam': {
          '100%': { 'offset-distance': '100%' },
        },
        'shine-pulse': {
          '0%, 100%': { 'background-position': '0% 0%' },
          '50%': { 'background-position': '100% 100%' },
        },
        'spotlight-drift': {
          '0%, 100%': { '--spot-x': '20%', '--spot-y': '30%' },
          '50%': { '--spot-x': '70%', '--spot-y': '60%' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        'fade-in-0': { from: { opacity: '0' }, to: { opacity: '1' } },
        'fade-out-0': { from: { opacity: '1' }, to: { opacity: '0' } },
        'zoom-in-95': {
          from: { transform: 'scale(0.95)' },
          to: { transform: 'scale(1)' },
        },
        'zoom-out-95': {
          from: { transform: 'scale(1)' },
          to: { transform: 'scale(0.95)' },
        },
      },
      animation: {
        marquee: 'marquee var(--marquee-duration, 30s) linear infinite',
        'marquee-vertical': 'marquee-vertical var(--marquee-duration, 30s) linear infinite',
        'border-beam': 'border-beam calc(var(--duration, 14s)) infinite linear',
        shimmer: 'shimmer 1.6s infinite',
      },
    },
  },
  plugins: [],
} satisfies Partial<Config>

export default forgelyPreset
