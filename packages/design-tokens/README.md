# @forgely/design-tokens

Single source of truth for Forgely's **Cinematic Industrial** design language.
Consumed by `apps/web`, `apps/app`, `apps/storefront` and any package that
needs colour / typography / spacing constants in TypeScript.

Source: [`docs/MASTER.md` §17](../../docs/MASTER.md).

## Usage

### TypeScript / JS

```ts
import { colors, fonts, spacing, shadows, motion } from '@forgely/design-tokens'

console.log(colors.forge.orange) // #FF6B1A
```

### Tailwind preset

```ts
// tailwind.config.ts
import { forgelyPreset } from '@forgely/design-tokens/tailwind'

export default {
  presets: [forgelyPreset],
  content: ['./app/**/*.{ts,tsx}'],
}
```

This unlocks utilities such as `bg-bg-void`, `text-text-primary`,
`text-forge-orange`, `font-display`, `text-display`, `shadow-glow_forge`, etc.

### CSS variables

If you need raw CSS variables (e.g. inside an `<iframe>` storefront preview):

```ts
import '@forgely/design-tokens/css'
```

This imports `:root { --forgely-bg-void: …; --forgely-forge-orange: …; }` etc.
