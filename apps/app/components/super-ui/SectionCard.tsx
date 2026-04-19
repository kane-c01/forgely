import type { ReactNode } from 'react'
import { cn } from './cn'

export interface SectionCardProps {
  title?: ReactNode
  subtitle?: ReactNode
  action?: ReactNode
  children: ReactNode
  className?: string
  bodyClassName?: string
  density?: 'comfortable' | 'compact'
}

/**
 * Generic dark-surface card used across /super.
 * Cinematic Industrial: razor-thin border, mono caption, no rounded chrome.
 */
export function SectionCard({
  title,
  subtitle,
  action,
  children,
  className,
  bodyClassName,
  density = 'comfortable',
}: SectionCardProps) {
  const padding = density === 'compact' ? 'px-4 py-3' : 'px-5 py-4'
  return (
    <section
      className={cn(
        'border border-border-subtle bg-bg-deep',
        'shadow-[0_1px_0_0_rgba(255,255,255,0.02)_inset]',
        className,
      )}
    >
      {(title || action || subtitle) && (
        <header
          className={cn(
            'flex items-start justify-between gap-3 border-b border-border-subtle',
            padding,
          )}
        >
          <div className="min-w-0">
            {title && (
              <div className="font-mono text-caption uppercase tracking-[0.18em] text-text-secondary">
                {title}
              </div>
            )}
            {subtitle && (
              <div className="mt-1 text-small text-text-muted">{subtitle}</div>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </header>
      )}
      <div className={cn(padding, bodyClassName)}>{children}</div>
    </section>
  )
}
