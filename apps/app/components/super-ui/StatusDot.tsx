import { cn } from './cn'

export type StatusTone = 'live' | 'ok' | 'warning' | 'error' | 'idle'

const TONE_CLASS: Record<StatusTone, string> = {
  live: 'bg-info shadow-[0_0_8px_rgba(0,217,255,0.7)]',
  ok: 'bg-success',
  warning: 'bg-warning',
  error: 'bg-error',
  idle: 'bg-text-muted',
}

export interface StatusDotProps {
  tone?: StatusTone
  pulse?: boolean
  className?: string
}

export function StatusDot({ tone = 'ok', pulse = false, className }: StatusDotProps) {
  return (
    <span
      className={cn(
        'relative inline-block h-2 w-2 rounded-full',
        TONE_CLASS[tone],
        className,
      )}
      aria-hidden
    >
      {pulse && (
        <span
          className={cn(
            'absolute inset-0 rounded-full opacity-50',
            TONE_CLASS[tone],
            'animate-ping',
          )}
        />
      )}
    </span>
  )
}
