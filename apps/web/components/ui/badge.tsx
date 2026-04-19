import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

type Tone = 'default' | 'forge' | 'success' | 'info'

const toneClasses: Record<Tone, string> = {
  default:
    'bg-bg-elevated text-text-secondary border-border-strong',
  forge:
    'bg-forge-orange/10 text-forge-orange border-forge-orange/30',
  success:
    'bg-semantic-success/10 text-semantic-success border-semantic-success/30',
  info:
    'bg-semantic-info/10 text-semantic-info border-semantic-info/30',
}

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone
}

export function Badge({ className, tone = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-caption uppercase tracking-[0.14em]',
        toneClasses[tone],
        className,
      )}
      {...props}
    />
  )
}
