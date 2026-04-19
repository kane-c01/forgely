import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface SectionHeadingProps {
  eyebrow?: string
  title: ReactNode
  description?: ReactNode
  align?: 'left' | 'center'
  className?: string
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'left',
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        'flex max-w-3xl flex-col gap-4',
        align === 'center' ? 'mx-auto items-center text-center' : 'items-start text-left',
        className,
      )}
    >
      {eyebrow ? (
        <span className="font-mono text-caption uppercase tracking-[0.22em] text-forge-orange">
          {eyebrow}
        </span>
      ) : null}
      <h2 className="font-display text-h1 font-light text-text-primary">{title}</h2>
      {description ? (
        <p className="text-body-lg text-text-secondary">{description}</p>
      ) : null}
    </div>
  )
}
