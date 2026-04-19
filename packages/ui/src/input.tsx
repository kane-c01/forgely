import * as React from 'react'

import { cn } from './utils'

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>

/**
 * Single-line text input themed for the dark, Cinematic Industrial surface.
 * Wraps the native element 1:1 so it composes inside React Hook Form, Zod
 * resolvers, etc.
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  function Input({ className, type, ...props }, ref) {
    return (
      <input
        ref={ref}
        type={type}
        className={cn(
          'flex h-10 w-full rounded-lg border border-border-strong bg-bg-surface px-3 py-2 text-small text-text-primary placeholder:text-text-muted',
          'transition-colors duration-short ease-standard',
          'focus-visible:border-forge-orange focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forge-orange focus-visible:ring-offset-2 focus-visible:ring-offset-bg-void',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        {...props}
      />
    )
  },
)
