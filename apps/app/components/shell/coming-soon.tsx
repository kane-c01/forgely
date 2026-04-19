import { Badge } from '@/components/ui/badge'
import { Icon } from '@/components/ui/icons'
import type { ReactNode } from 'react'

import { PageHeader } from './page-header'

interface ComingSoonProps {
  eyebrow: string
  title: string
  description: string
  /** Roadmap label e.g. "Week 9" or "V1.1". */
  expected: string
  /** Optional list of features the page will eventually contain. */
  bullets?: string[]
  /** Optional extra footer content. */
  footer?: ReactNode
}

/**
 * Reusable placeholder shown for pages that exist in the information
 * architecture (so navigation / deep-links don't 404) but whose feature
 * lives in a later sprint.
 */
export function ComingSoon({ eyebrow, title, description, expected, bullets, footer }: ComingSoonProps) {
  return (
    <div className="mx-auto flex max-w-[960px] flex-col gap-6">
      <PageHeader
        eyebrow={eyebrow}
        title={title}
        description={description}
        meta={
          <>
            <Badge tone="forge" dot>
              roadmap · {expected}
            </Badge>
          </>
        }
      />

      <div className="relative overflow-hidden rounded-lg border border-dashed border-border-strong bg-bg-surface p-10">
        <span className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-forge-orange/10 blur-3xl" />
        <span className="absolute bottom-0 left-1/3 h-40 w-40 rounded-full bg-forge-orange/5 blur-3xl" />
        <div className="relative flex flex-col items-center gap-3 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-full border border-forge-orange/30 bg-bg-deep text-forge-amber">
            <Icon.Sparkle size={24} />
          </span>
          <h3 className="font-display text-h2 text-text-primary">Forging in progress</h3>
          <p className="max-w-md text-small text-text-secondary">{description}</p>
          {bullets ? (
            <ul className="mx-auto mt-4 grid max-w-lg grid-cols-1 gap-2 text-left sm:grid-cols-2">
              {bullets.map((b) => (
                <li
                  key={b}
                  className="flex items-start gap-2 rounded-md border border-border-subtle bg-bg-deep px-3 py-2 text-small text-text-primary"
                >
                  <Icon.Check size={14} className="mt-0.5 shrink-0 text-forge-amber" /> {b}
                </li>
              ))}
            </ul>
          ) : null}
          {footer ?? null}
        </div>
      </div>
    </div>
  )
}
