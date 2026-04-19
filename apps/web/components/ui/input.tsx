import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

export type InputProps = InputHTMLAttributes<HTMLInputElement>

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, type = 'text', ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      type={type}
      className={cn(
        'h-12 w-full rounded-md border border-border-strong bg-bg-deep px-4 text-body text-text-primary placeholder:text-text-muted',
        'transition duration-short ease-standard',
        'focus-visible:border-forge-orange focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forge-orange/40',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  )
})
