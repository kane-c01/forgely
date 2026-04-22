'use client'

import { Badge } from '@/components/ui/badge'
import { Icon } from '@/components/ui/icons'
import { useT } from '@/lib/i18n'
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
export function ComingSoon({
  eyebrow,
  title,
  description,
  expected,
  bullets,
  footer,
}: ComingSoonProps) {
  const t = useT()
  return (
    <div className="mx-auto flex max-w-[960px] flex-col gap-6">
      <PageHeader
        eyebrow={eyebrow}
        title={title}
        description={description}
        meta={
          <>
            <Badge tone="forge" dot>
              {t.comingSoon.roadmap} · {expected}
            </Badge>
          </>
        }
      />

      <div className="border-border-strong bg-bg-surface relative overflow-hidden rounded-lg border border-dashed p-10">
        <span className="bg-forge-orange/10 absolute -right-20 -top-20 h-60 w-60 rounded-full blur-3xl" />
        <span className="bg-forge-orange/5 absolute bottom-0 left-1/3 h-40 w-40 rounded-full blur-3xl" />
        <div className="relative flex flex-col items-center gap-3 text-center">
          <span className="border-forge-orange/30 bg-bg-deep text-forge-amber grid h-14 w-14 place-items-center rounded-full border">
            <Icon.Sparkle size={24} />
          </span>
          <h3 className="font-display text-h2 text-text-primary">
            {t.comingSoon.forgingInProgress}
          </h3>
          <p className="text-small text-text-secondary max-w-md">{description}</p>
          {bullets ? (
            <ul className="mx-auto mt-4 grid max-w-lg grid-cols-1 gap-2 text-left sm:grid-cols-2">
              {bullets.map((b) => (
                <li
                  key={b}
                  className="border-border-subtle bg-bg-deep text-small text-text-primary flex items-start gap-2 rounded-md border px-3 py-2"
                >
                  <Icon.Check size={14} className="text-forge-amber mt-0.5 shrink-0" /> {b}
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
