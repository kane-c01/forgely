import type { ReactNode } from 'react'

import { cn } from '@/lib/cn'

interface PageHeaderProps {
  eyebrow?: string
  title: string
  description?: string
  meta?: ReactNode          // small mono caption row, e.g. "live" + last-updated
  actions?: ReactNode
  className?: string
}

export function PageHeader({
  eyebrow,
  title,
  description,
  meta,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn('flex flex-col gap-3 pb-6', className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          {eyebrow ? (
            <span className="font-mono text-caption uppercase tracking-[0.18em] text-forge-amber">
              {eyebrow}
            </span>
          ) : null}
          <h1 className="font-display text-h1 leading-tight text-text-primary">{title}</h1>
          {description ? (
            <p className="max-w-2xl text-body text-text-secondary">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </div>
      {meta ? (
        <div className="flex flex-wrap items-center gap-3 font-mono text-caption uppercase tracking-[0.08em] text-text-muted">
          {meta}
        </div>
      ) : null}
    </div>
  )
}
