import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from './utils'

/**
 * Button variants tuned for the Cinematic Industrial palette.
 * - `primary` is the default Forge Orange CTA.
 * - `secondary` sits on `bg-elevated` with a subtle border.
 * - `ghost` is the lowest-weight click-target.
 * - `destructive` uses the semantic error red.
 */
export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-heading text-small font-medium transition-colors duration-short ease-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forge-orange focus-visible:ring-offset-2 focus-visible:ring-offset-bg-void disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary:
          'bg-forge-orange text-bg-void hover:bg-forge-amber active:bg-forge-ember shadow-elevated',
        secondary:
          'border border-border-strong bg-bg-elevated text-text-primary hover:border-forge-orange hover:text-forge-orange',
        ghost:
          'text-text-secondary hover:bg-bg-elevated hover:text-text-primary',
        destructive:
          'bg-error text-text-primary hover:opacity-90',
      },
      size: {
        sm: 'h-8 px-3 text-caption',
        md: 'h-10 px-4',
        lg: 'h-12 px-6 text-body',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button({ className, variant, size, asChild = false, ...props }, ref) {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    )
  },
)
