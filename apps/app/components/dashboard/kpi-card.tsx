import type { ReactNode } from 'react'

import { Icon } from '@/components/ui/icons'
import { cn } from '@/lib/cn'

interface KpiCardProps {
  label: string
  value: ReactNode
  delta?: number             // -1..1; positive = good
  deltaInverted?: boolean    // for metrics where lower-is-better
  hint?: string
  accent?: boolean           // if true the value glows in forge orange
  className?: string
}

export function KpiCard({
  label,
  value,
  delta,
  deltaInverted,
  hint,
  accent,
  className,
}: KpiCardProps) {
  const goingUp = (delta ?? 0) >= 0
  const isGood = deltaInverted ? !goingUp : goingUp
  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-lg border border-border-subtle bg-bg-surface p-4',
        'transition-colors duration-[var(--motion-short,200ms)] hover:border-border-strong',
        className,
      )}
    >
      <p className="font-mono text-caption uppercase tracking-[0.18em] text-text-muted">
        {label}
      </p>
      <p
        className={cn(
          'mt-2 font-display text-h1 leading-[1.05] tracking-tight tabular-nums',
          accent ? 'text-forge-amber' : 'text-text-primary',
        )}
      >
        {value}
      </p>
      <div className="mt-3 flex items-center justify-between font-mono text-caption">
        {typeof delta === 'number' ? (
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-2 py-0.5',
              isGood
                ? 'bg-success/15 text-success'
                : 'bg-error/15 text-error',
            )}
          >
            {goingUp ? <Icon.ArrowUp size={10} /> : <Icon.ArrowDown size={10} />}
            {Math.abs(delta * 100).toFixed(1)}%
          </span>
        ) : (
          <span />
        )}
        {hint ? <span className="text-text-muted">{hint}</span> : null}
      </div>
      {accent ? (
        <span className="pointer-events-none absolute -inset-px rounded-lg shadow-[inset_0_0_60px_-30px_rgba(255,107,26,0.4)]" />
      ) : null}
    </div>
  )
}
