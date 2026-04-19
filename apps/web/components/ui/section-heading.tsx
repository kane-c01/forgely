import type { ReactNode } from 'react'
import { cn } from '@forgely/ui'

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
        <span className="text-caption text-forge-orange font-mono uppercase tracking-[0.22em]">
          {eyebrow}
        </span>
      ) : null}
      <h2 className="font-display text-h1 text-text-primary font-light">{title}</h2>
      {description ? <p className="text-body-lg text-text-secondary">{description}</p> : null}
    </div>
  )
}
