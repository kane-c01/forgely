import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/lib/cn'

export type ButtonVariant = 'forge' | 'primary' | 'secondary' | 'ghost' | 'outline'
export type ButtonSize = 'sm' | 'md' | 'lg'

const baseClasses =
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-heading font-medium tracking-tight transition duration-short ease-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forge-orange focus-visible:ring-offset-2 focus-visible:ring-offset-bg-void disabled:pointer-events-none disabled:opacity-50'

const variantClasses: Record<ButtonVariant, string> = {
  forge:
    'bg-forge-orange text-bg-void shadow-glow-forge hover:bg-forge-amber hover:shadow-[0_0_60px_rgba(255,107,26,0.45)] active:translate-y-px',
  primary:
    'bg-text-primary text-bg-void hover:bg-white active:translate-y-px',
  secondary:
    'bg-bg-elevated text-text-primary border border-border-strong hover:bg-bg-surface',
  ghost:
    'bg-transparent text-text-primary hover:bg-bg-elevated',
  outline:
    'bg-transparent text-text-primary border border-border-strong hover:border-forge-orange/60 hover:text-forge-orange',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-9 px-3 text-small',
  md: 'h-11 px-5 text-body',
  lg: 'h-14 px-7 text-body-lg',
}

export interface ButtonClassOptions {
  variant?: ButtonVariant
  size?: ButtonSize
  className?: string
}

/**
 * Tailwind class composition for button-styled elements (e.g. <Link>) without
 * pulling in @radix-ui/react-slot.
 */
export function buttonClasses({
  variant = 'forge',
  size = 'md',
  className,
}: ButtonClassOptions = {}): string {
  return cn(baseClasses, variantClasses[variant], sizeClasses[size], className)
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  leadingIcon?: ReactNode
  trailingIcon?: ReactNode
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    className,
    variant = 'forge',
    size = 'md',
    leadingIcon,
    trailingIcon,
    children,
    type = 'button',
    ...props
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={buttonClasses({ variant, size, className })}
      {...props}
    >
      {leadingIcon ? <span className="-ml-1 flex shrink-0">{leadingIcon}</span> : null}
      <span>{children}</span>
      {trailingIcon ? <span className="-mr-1 flex shrink-0">{trailingIcon}</span> : null}
    </button>
  )
})
