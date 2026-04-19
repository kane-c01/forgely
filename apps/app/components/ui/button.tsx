import { forwardRef, type ButtonHTMLAttributes } from 'react'

import { cn } from '@/lib/cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger'
type Size = 'xs' | 'sm' | 'md' | 'lg' | 'icon'

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-forge-orange text-bg-void hover:bg-forge-amber active:bg-forge-ember shadow-[0_0_24px_rgba(255,107,26,0.18)]',
  secondary:
    'bg-bg-elevated text-text-primary border border-border-strong hover:border-forge-orange/60 hover:text-forge-amber',
  ghost:
    'bg-transparent text-text-secondary hover:bg-bg-elevated hover:text-text-primary',
  outline:
    'bg-transparent text-text-primary border border-border-strong hover:border-forge-orange/60 hover:text-forge-amber',
  danger:
    'bg-error/15 text-error border border-error/30 hover:bg-error/25',
}

const SIZES: Record<Size, string> = {
  xs: 'h-7 px-2 text-caption gap-1',
  sm: 'h-8 px-3 text-small gap-1.5',
  md: 'h-10 px-4 text-small gap-2',
  lg: 'h-12 px-6 text-body gap-2',
  icon: 'h-9 w-9 p-0',
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { className, variant = 'primary', size = 'md', loading, disabled, children, ...rest },
    ref,
  ) {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center rounded-md font-medium transition-colors duration-[var(--motion-short,200ms)]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forge-orange/60 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-void',
          'disabled:cursor-not-allowed disabled:opacity-50',
          VARIANTS[variant],
          SIZES[size],
          className,
        )}
        {...rest}
      >
        {loading ? (
          <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : null}
        {children}
      </button>
    )
  },
)
