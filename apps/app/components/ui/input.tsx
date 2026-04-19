import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react'

import { cn } from '@/lib/cn'

const baseField =
  'w-full rounded-md border border-border-strong bg-bg-deep px-3 py-2 text-small text-text-primary placeholder:text-text-muted focus:outline-none focus:border-forge-orange/60 focus:ring-1 focus:ring-forge-orange/40 disabled:cursor-not-allowed disabled:opacity-50'

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, type = 'text', ...rest }, ref) {
    return (
      <input
        ref={ref}
        type={type}
        className={cn(baseField, 'h-9', className)}
        {...rest}
      />
    )
  },
)

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...rest }, ref) {
    return (
      <textarea
        ref={ref}
        className={cn(baseField, 'min-h-24 resize-y', className)}
        {...rest}
      />
    )
  },
)

export interface FieldProps {
  label: string
  hint?: string
  required?: boolean
  children: React.ReactNode
}

export function Field({ label, hint, required, children }: FieldProps) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-mono text-caption uppercase tracking-[0.12em] text-text-muted">
        {label}
        {required ? <span className="text-error"> *</span> : null}
      </span>
      {children}
      {hint ? <span className="text-caption text-text-muted">{hint}</span> : null}
    </label>
  )
}
