import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from './utils'

/**
 * Badge — compact label used for status, pricing tiers, plan markers, etc.
 */
export const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 font-mono text-caption uppercase tracking-[0.18em] transition-colors',
  {
    variants: {
      variant: {
        default:
          'border-border-strong bg-bg-elevated text-text-secondary',
        forge:
          'border-forge-ember/60 bg-forge-orange/10 text-forge-amber',
        success: 'border-success/40 bg-success/10 text-success',
        warning: 'border-warning/40 bg-warning/10 text-warning',
        error: 'border-error/40 bg-error/10 text-error',
        info: 'border-info/40 bg-info/10 text-info',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  function Badge({ className, variant, ...props }, ref) {
    return (
      <span
        ref={ref}
        className={cn(badgeVariants({ variant }), className)}
        {...props}
      />
    )
  },
)
