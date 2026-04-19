import type { ReactNode } from 'react'

import { cn } from '@/lib/cn'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border-strong bg-bg-deep px-6 py-12 text-center',
        className,
      )}
    >
      {icon ? <div className="text-text-muted">{icon}</div> : null}
      <h4 className="font-heading text-h3 text-text-primary">{title}</h4>
      {description ? (
        <p className="max-w-sm text-small text-text-secondary">{description}</p>
      ) : null}
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  )
}
