'use client'

import Link from 'next/link'

import { useCopilotContext } from '@/components/copilot/copilot-provider'
import { PageHeader } from '@/components/shell/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icons'
import { sites } from '@/lib/mocks'
import { formatCurrency, formatNumber, relativeTime } from '@/lib/format'

const STATUS_TONE = {
  published: 'success',
  building: 'warning',
  draft: 'neutral',
  archived: 'neutral',
} as const

export default function SitesIndex() {
  useCopilotContext({ kind: 'global' })
  return (
    <div className="mx-auto flex max-w-[1280px] flex-col gap-6">
      <PageHeader
        eyebrow="Workspace"
        title="Sites"
        description="Each site is a fully forged, independently hosted brand store. Pro plans support up to 5 sites."
        actions={
          <Button>
            <Icon.Plus size={14} /> Forge a new site
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {sites.map((s) => (
          <Link
            key={s.id}
            href={`/sites/${s.id}/products`}
            className="group flex flex-col overflow-hidden rounded-lg border border-border-subtle bg-bg-surface transition-colors hover:border-forge-orange/40"
          >
            <div className="flex aspect-[16/10] items-center justify-center bg-gradient-to-br from-bg-elevated via-bg-deep to-bg-void text-[96px] transition-transform duration-[var(--motion-medium,400ms)] group-hover:scale-[1.04]">
              <span>{s.thumbnail}</span>
            </div>
            <div className="flex flex-col gap-3 p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-heading text-h3 text-text-primary">{s.name}</p>
                  <p className="font-mono text-caption text-text-muted">{s.domain}</p>
                </div>
                <Badge tone={STATUS_TONE[s.status]} dot>
                  {s.status}
                </Badge>
              </div>
              <div className="grid grid-cols-3 gap-2 text-small">
                <div>
                  <p className="font-mono text-caption text-text-muted">Revenue 30d</p>
                  <p className="font-display tabular-nums text-text-primary">
                    {formatCurrency(s.metrics.revenue30d)}
                  </p>
                </div>
                <div>
                  <p className="font-mono text-caption text-text-muted">Orders</p>
                  <p className="font-display tabular-nums text-text-primary">
                    {formatNumber(s.metrics.orders30d)}
                  </p>
                </div>
                <div>
                  <p className="font-mono text-caption text-text-muted">Visitors</p>
                  <p className="font-display tabular-nums text-text-primary">
                    {formatNumber(s.metrics.visitors30d)}
                  </p>
                </div>
              </div>
              <p className="font-mono text-caption text-text-muted">
                {s.publishedAt
                  ? `Published ${relativeTime(s.publishedAt)}`
                  : 'Building — not yet published'}
              </p>
            </div>
          </Link>
        ))}

        <button
          type="button"
          className="flex aspect-[1] flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border-strong bg-bg-deep text-text-muted transition-colors hover:border-forge-orange/40 hover:text-forge-amber min-h-[280px]"
        >
          <Icon.Plus size={28} />
          <span className="font-mono text-caption uppercase tracking-[0.18em]">Forge new site</span>
        </button>
      </div>
    </div>
  )
}
