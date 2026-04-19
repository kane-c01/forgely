import type { Config } from 'tailwindcss'
import { forgelyPreset } from '@forgely/design-tokens/tailwind.preset'

export default {
  presets: [forgelyPreset],
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
  ],
} satisfies Config
