import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { forwardRef } from 'react'
import { cn } from './cn'

export type SuperButtonVariant =
  | 'primary'
  | 'secondary'
  | 'ghost'
  | 'danger'
  | 'outline'

export type SuperButtonSize = 'sm' | 'md'

const VARIANT: Record<SuperButtonVariant, string> = {
  primary:
    'bg-forge-orange text-bg-void hover:bg-forge-amber disabled:bg-forge-ember/40',
  secondary:
    'border border-border-strong bg-bg-elevated text-text-primary hover:border-forge-amber hover:text-forge-amber',
  ghost:
    'text-text-secondary hover:bg-bg-elevated hover:text-text-primary',
  danger:
    'border border-error/40 bg-error/10 text-error hover:bg-error/20',
  outline:
    'border border-border-subtle text-text-secondary hover:border-border-strong hover:text-text-primary',
}

const SIZE: Record<SuperButtonSize, string> = {
  sm: 'h-7 px-2.5 text-caption',
  md: 'h-9 px-3.5 text-small',
}

export interface SuperButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: SuperButtonVariant
  size?: SuperButtonSize
  leadingIcon?: ReactNode
  trailingIcon?: ReactNode
}

export const SuperButton = forwardRef<HTMLButtonElement, SuperButtonProps>(
  function SuperButton(
    {
      variant = 'secondary',
      size = 'md',
      leadingIcon,
      trailingIcon,
      className,
      children,
      type = 'button',
      ...rest
    },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          'inline-flex items-center justify-center gap-2 font-mono uppercase tracking-[0.14em]',
          'transition-colors disabled:cursor-not-allowed disabled:opacity-60',
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forge-amber',
          VARIANT[variant],
          SIZE[size],
          className,
        )}
        {...rest}
      >
        {leadingIcon && <span className="shrink-0">{leadingIcon}</span>}
        {children}
        {trailingIcon && <span className="shrink-0">{trailingIcon}</span>}
      </button>
    )
  },
)
