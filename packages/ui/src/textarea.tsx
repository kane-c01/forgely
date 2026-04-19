import * as React from 'react'

import { cn } from './utils'

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>

/**
 * Multi-line text input themed for the Cinematic Industrial dark surface.
 * Pairs with React Hook Form / Zod via {@link Form}.
 */
export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, ...props },
  ref,
) {
  return (
    <textarea
      ref={ref}
      className={cn(
        'border-border-strong bg-bg-surface text-small text-text-primary placeholder:text-text-muted flex min-h-[96px] w-full rounded-lg border px-3 py-2',
        'duration-short ease-standard transition-colors',
        'focus-visible:border-forge-orange focus-visible:ring-forge-orange focus-visible:ring-offset-bg-void focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  )
})
