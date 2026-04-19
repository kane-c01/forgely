import * as React from 'react'

import { cn } from './utils'

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
}

/**
 * EmptyState — shared "nothing here yet" surface for empty tables, search
 * misses, and the post-onboarding zero state.
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      role="status"
      className={cn(
        'border-border-subtle bg-bg-deep flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed px-6 py-12 text-center',
        className,
      )}
      {...props}
    >
      {icon && (
        <div className="bg-bg-elevated text-forge-orange flex h-12 w-12 items-center justify-center rounded-full">
          {icon}
        </div>
      )}
      <h3 className="font-heading text-h3 text-text-primary leading-tight tracking-tight">
        {title}
      </h3>
      {description && <p className="text-small text-text-secondary max-w-prose">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}
