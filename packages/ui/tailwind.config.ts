import type { Config } from 'tailwindcss'
import animatePlugin from 'tailwindcss-animate'

import { forgelyPreset } from '@forgely/design-tokens/tailwind.preset'

const config = {
  presets: [forgelyPreset],
  content: ['./src/**/*.{ts,tsx,js,jsx,mdx}', './.storybook/**/*.{ts,tsx,js,jsx,mdx}'],
  plugins: [animatePlugin],
} satisfies Config

export default config
