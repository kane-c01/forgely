import type { ReactNode } from 'react'
import { cn } from './cn'

export type BadgeTone =
  | 'neutral'
  | 'forge'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'

const TONE: Record<BadgeTone, string> = {
  neutral: 'border-border-strong bg-bg-elevated text-text-secondary',
  forge: 'border-forge-ember/60 bg-forge-orange/10 text-forge-amber',
  success: 'border-success/40 bg-success/10 text-success',
  warning: 'border-warning/40 bg-warning/10 text-warning',
  error: 'border-error/40 bg-error/10 text-error',
  info: 'border-info/40 bg-info/10 text-info',
}

export interface BadgeProps {
  tone?: BadgeTone
  children: ReactNode
  className?: string
  uppercase?: boolean
}

export function Badge({
  tone = 'neutral',
  children,
  className,
  uppercase = true,
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 border px-2 py-[2px] font-mono text-caption tracking-[0.14em]',
        uppercase && 'uppercase',
        TONE[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}
