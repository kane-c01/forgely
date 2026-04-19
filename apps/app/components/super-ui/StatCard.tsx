import type { ReactNode } from 'react'
import { Sparkline } from './Sparkline'
import { cn } from './cn'

export interface StatCardProps {
  label: string
  value: ReactNode
  delta?: {
    value: string
    direction: 'up' | 'down' | 'flat'
  }
  hint?: ReactNode
  spark?: number[]
  accent?: 'forge' | 'info' | 'data-3' | 'data-4' | 'success'
  className?: string
}

const ACCENT_TEXT: Record<NonNullable<StatCardProps['accent']>, string> = {
  forge: 'text-forge-orange',
  info: 'text-info',
  'data-3': 'text-data-3',
  'data-4': 'text-data-4',
  success: 'text-success',
}

const ACCENT_STROKE: Record<NonNullable<StatCardProps['accent']>, string> = {
  forge: '#FF6B1A',
  info: '#00D9FF',
  'data-3': '#A855F7',
  'data-4': '#22C55E',
  success: '#22C55E',
}

const DIRECTION_TEXT = {
  up: 'text-success',
  down: 'text-error',
  flat: 'text-text-muted',
} as const

const DIRECTION_GLYPH = {
  up: '↑',
  down: '↓',
  flat: '→',
} as const

/**
 * NASA Mission Control style metric tile. Mono digits, forge accents.
 */
export function StatCard({
  label,
  value,
  delta,
  hint,
  spark,
  accent = 'forge',
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        'group relative flex flex-col justify-between gap-3 border border-border-subtle bg-bg-deep px-5 py-4',
        'transition-colors hover:border-border-strong',
        className,
      )}
    >
      <div className="flex items-start justify-between">
        <div className="font-mono text-caption uppercase tracking-[0.2em] text-text-muted">
          {label}
        </div>
        {delta && (
          <div
            className={cn(
              'font-mono text-caption tracking-tight tabular-nums',
              DIRECTION_TEXT[delta.direction],
            )}
          >
            {DIRECTION_GLYPH[delta.direction]} {delta.value}
          </div>
        )}
      </div>

      <div className={cn('font-mono text-h2 tabular-nums leading-none', ACCENT_TEXT[accent])}>
        {value}
      </div>

      {(spark || hint) && (
        <div className="flex items-end justify-between gap-3">
          {hint && <div className="text-small text-text-muted">{hint}</div>}
          {spark && (
            <Sparkline
              data={spark}
              stroke={ACCENT_STROKE[accent]}
              className="ml-auto h-8 w-24"
            />
          )}
        </div>
      )}
    </div>
  )
}
