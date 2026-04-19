# @forgely/ui

Forgely's shared component library, themed with the
[`@forgely/design-tokens`](../design-tokens) Tailwind preset and built on
[shadcn/ui](https://ui.shadcn.com) primitives.

> **Sprint-0 surface (Task T03 – partial)**: 5 P0 components shipped.
> Remaining shadcn / Aceternity / Magic UI components land progressively in
> T03 (full) and T04. See `PROGRESS.md`.

## Components shipped today

| Name | Purpose |
|---|---|
| `Button` (+ `buttonVariants`) | Primary CTA with `primary / secondary / ghost / destructive` variants |
| `Input` | Native text input themed for the dark surface |
| `Card` (+ Header / Title / Description / Content / Footer) | Content surface module |
| `Badge` (+ `badgeVariants`) | Status / tier / plan label, mono-uppercase |
| `Dialog` (Radix-based, accessible) | Modal with overlay, close button and animation hooks |
| `cn` | `clsx` + `tailwind-merge` helper |

## Usage

```tsx
import { Button, Card, Badge, Dialog, DialogTrigger, DialogContent, DialogTitle } from '@forgely/ui'

export function Example() {
  return (
    <Card>
      <CardHeader>
        <Badge variant="forge">Pro</Badge>
        <CardTitle>Forge a brand site in minutes</CardTitle>
      </CardHeader>
    </Card>
  )
}
```

## Conventions

- All components use `React.forwardRef` so they compose with form libraries.
- Class lists are merged via the local `cn(...)` helper (`clsx` + `tailwind-merge`).
- Variants use `class-variance-authority`, never inline `className` switches.
- Tokens are referenced through Tailwind utilities (`bg-bg-void`, `text-forge-orange`) — never hard-coded hex.
- Dark mode is the default — light themes will land later as a `data-theme="light"` override.
