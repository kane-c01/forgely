import { forwardRef, type HTMLAttributes } from 'react'

import { cn } from '@/lib/cn'

type Tone =
  | 'neutral'
  | 'forge'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'outline'

const TONES: Record<Tone, string> = {
  neutral: 'bg-bg-elevated text-text-secondary border border-border-subtle',
  forge: 'bg-forge-orange/15 text-forge-amber border border-forge-orange/30',
  success: 'bg-success/15 text-success border border-success/30',
  warning: 'bg-warning/15 text-warning border border-warning/30',
  error: 'bg-error/15 text-error border border-error/30',
  info: 'bg-info/15 text-info border border-info/30',
  outline: 'bg-transparent text-text-secondary border border-border-strong',
}

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone
  dot?: boolean
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
  { className, tone = 'neutral', dot, children, ...rest },
  ref,
) {
  return (
    <span
      ref={ref}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 font-mono text-caption uppercase tracking-[0.12em]',
        TONES[tone],
        className,
      )}
      {...rest}
    >
      {dot ? (
        <span
          className={cn(
            'h-1.5 w-1.5 rounded-full',
            tone === 'success' && 'bg-success animate-pulse',
            tone === 'forge' && 'bg-forge-orange animate-pulse',
            tone === 'error' && 'bg-error animate-pulse',
            tone === 'warning' && 'bg-warning',
            tone === 'info' && 'bg-info',
            tone === 'neutral' && 'bg-text-muted',
            tone === 'outline' && 'bg-text-muted',
          )}
        />
      ) : null}
      {children}
    </span>
  )
})
