# @forgely/ui

> Forgely shared component library — shadcn/ui primitives, Aceternity & Magic UI animated surfaces, themed end-to-end with `@forgely/design-tokens`.

Sprint 0 ships:

- **Primitives (T03 P0)** — Button, Input, Textarea, Label, Card, Badge, Alert, Dialog, Sheet, Drawer, Select, Dropdown Menu, Tooltip, Toaster (Sonner), Avatar, Separator, Tabs, Progress, Spinner, Skeleton, Table, Form (RHF + Zod), Checkbox, Switch, Popover, Stepper, Pagination, Empty State, Code Block, Command Menu (⌘K).
- **Animated surfaces (T04)** — Marquee, BorderBeam, ShineBorder, NumberTicker, AnimatedBeam (Magic UI) · 3D Card, StickyScroll, BentoGrid, Spotlight, TextGenerateEffect, HeroParallax, CanvasReveal, InfiniteMovingCards (Aceternity).

All components are dark-first, accessible, `forwardRef`-compatible and use Forgely tokens — no hard-coded colors, fonts or shadows.

## Install (workspace)

```ts
import { Button, Card, Spotlight, Marquee, toast } from '@forgely/ui'
import '@forgely/ui/styles.css'
```

In Tailwind, extend the preset from `@forgely/design-tokens`:

```ts
import { forgelyPreset } from '@forgely/design-tokens/tailwind.preset'

export default {
  presets: [forgelyPreset],
  content: ['./src/**/*.{ts,tsx}'],
}
```

## Storybook

```bash
pnpm --filter @forgely/ui storybook
```

The dark "Cinematic Industrial" backdrop is configured in `.storybook/preview.ts`.

Each component ships with at least one story; foundations (Design Tokens) live under `Foundations/Design Tokens` for non-engineering review.

## Adding components

1. Drop the source under `src/<kebab-name>.tsx`, follow the existing dark-first pattern.
2. Re-export from `src/index.ts`.
3. Add a `*.stories.tsx` next to it.
4. Run `pnpm --filter @forgely/ui typecheck`.
