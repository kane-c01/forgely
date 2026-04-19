import * as React from 'react'

import { cn } from './utils'

/**
 * BentoGrid — Aceternity inspired asymmetric showcase grid. Children are
 * usually {@link BentoCard} instances but any element with `col-span-*`
 * works.
 */
export function BentoGrid({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('grid w-full auto-rows-[20rem] grid-cols-1 gap-4 md:grid-cols-3', className)}
      {...props}
    />
  )
}

export interface BentoCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  description?: string
  icon?: React.ReactNode
  /** Span both columns (and rows) on >=md screens. */
  feature?: boolean
}

export function BentoCard({
  title,
  description,
  icon,
  feature = false,
  className,
  children,
  ...props
}: BentoCardProps) {
  return (
    <article
      className={cn(
        'border-border-subtle bg-bg-elevated text-text-primary shadow-elevated duration-short ease-standard group relative flex flex-col justify-end overflow-hidden rounded-xl border p-5 text-left transition-transform hover:-translate-y-1',
        feature && 'md:col-span-2 md:row-span-2',
        className,
      )}
      {...props}
    >
      <div
        aria-hidden
        className="duration-medium ease-emphasized pointer-events-none absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100"
        style={{
          background:
            'radial-gradient(600px circle at 30% 20%, rgba(255,107,26,0.18), transparent 40%)',
        }}
      />
      <div className="relative z-10 flex flex-col gap-2">
        {icon && (
          <span className="bg-bg-surface text-forge-orange inline-flex h-9 w-9 items-center justify-center rounded-md">
            {icon}
          </span>
        )}
        <h3 className="font-heading text-h3 leading-tight tracking-tight">{title}</h3>
        {description && <p className="text-small text-text-secondary">{description}</p>}
        {children && <div className="pt-2">{children}</div>}
      </div>
    </article>
  )
}
