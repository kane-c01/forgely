'use client'

import Link from 'next/link'

import { useCopilotContext } from '@/components/copilot/copilot-provider'
import { useT } from '@/lib/i18n'
import { PageHeader } from '@/components/shell/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icons'
import { selectDataSource } from '@/lib/data-source'
import { sites as mockSites } from '@/lib/mocks'
import { formatCurrency, formatNumber, relativeTime } from '@/lib/format'
import { trpc } from '@/lib/trpc'
import type { Site } from '@/lib/types'

const STATUS_TONE = {
  published: 'success',
  building: 'warning',
  draft: 'neutral',
  archived: 'neutral',
} as const

/** Adapt the tRPC `sites.list` row shape to our local `Site` UI type. */
function adaptTrpcSite(row: Record<string, unknown>): Site {
  return {
    id: String(row.id ?? ''),
    name: String(row.name ?? row.title ?? '(untitled site)'),
    domain: String(row.domain ?? row.subdomain ?? `${String(row.id)}.forgely.app`),
    status: (row.status as Site['status']) ?? 'draft',
    publishedAt: (row.publishedAt as string | null) ?? null,
    visualDna: String(row.visualDna ?? 'kyoto-ceramic'),
    thumbnail: typeof row.thumbnail === 'string' ? row.thumbnail : '🌐',
    metrics: {
      revenue30d: Number((row.metrics as Record<string, number> | undefined)?.revenue30d ?? 0),
      orders30d: Number((row.metrics as Record<string, number> | undefined)?.orders30d ?? 0),
      visitors30d: Number((row.metrics as Record<string, number> | undefined)?.visitors30d ?? 0),
      conversion: Number((row.metrics as Record<string, number> | undefined)?.conversion ?? 0),
    },
  }
}

export default function SitesIndex() {
  useCopilotContext({ kind: 'global' })
  const t = useT()

  const query = trpc.sites.list.useQuery({})
  // tRPC returns whatever the procedure defines; we accept either an array
  // directly or a `{ rows }` envelope and adapt to the local UI type.
  const rawRows = Array.isArray(query.data)
    ? (query.data as Record<string, unknown>[])
    : ((query.data as { rows?: Record<string, unknown>[] } | undefined)?.rows ?? [])
  const trpcSites = rawRows.length > 0 ? rawRows.map(adaptTrpcSite) : undefined
  const ds = selectDataSource(
    {
      data: trpcSites,
      isLoading: query.isLoading,
      isError: query.isError,
      error: query.error,
    },
    mockSites,
  )
  const sites = ds.data

  return (
    <div className="mx-auto flex max-w-[1280px] flex-col gap-6">
      <PageHeader
        eyebrow={t.sites.eyebrow}
        title={t.sites.title}
        description={t.sites.description}
        meta={
          ds.source === 'mock' ? (
            <Badge tone="outline">{t.sites.demoData}</Badge>
          ) : (
            <Badge tone="success" dot>
              {t.sites.liveData}
            </Badge>
          )
        }
        actions={
          <Button>
            <Icon.Plus size={14} /> {t.sites.forgeNew}
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {sites.map((s) => (
          <Link
            key={s.id}
            href={`/sites/${s.id}/products`}
            className="border-border-subtle bg-bg-surface hover:border-forge-orange/40 group flex flex-col overflow-hidden rounded-lg border transition-colors"
          >
            <div className="from-bg-elevated via-bg-deep to-bg-void flex aspect-[16/10] items-center justify-center bg-gradient-to-br text-[96px] transition-transform duration-[var(--motion-medium,400ms)] group-hover:scale-[1.04]">
              <span>{s.thumbnail}</span>
            </div>
            <div className="flex flex-col gap-3 p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-heading text-h3 text-text-primary">{s.name}</p>
                  <p className="text-caption text-text-muted font-mono">{s.domain}</p>
                </div>
                <Badge tone={STATUS_TONE[s.status]} dot>
                  {s.status}
                </Badge>
              </div>
              <div className="text-small grid grid-cols-3 gap-2">
                <div>
                  <p className="text-caption text-text-muted font-mono">{t.sites.revenue30d}</p>
                  <p className="font-display text-text-primary tabular-nums">
                    {formatCurrency(s.metrics.revenue30d)}
                  </p>
                </div>
                <div>
                  <p className="text-caption text-text-muted font-mono">{t.sites.ordersLabel}</p>
                  <p className="font-display text-text-primary tabular-nums">
                    {formatNumber(s.metrics.orders30d)}
                  </p>
                </div>
                <div>
                  <p className="text-caption text-text-muted font-mono">{t.sites.visitors}</p>
                  <p className="font-display text-text-primary tabular-nums">
                    {formatNumber(s.metrics.visitors30d)}
                  </p>
                </div>
              </div>
              <p className="text-caption text-text-muted font-mono">
                {s.publishedAt
                  ? `${t.sites.published} ${relativeTime(s.publishedAt)}`
                  : t.sites.building}
              </p>
            </div>
          </Link>
        ))}

        <button
          type="button"
          className="border-border-strong bg-bg-deep text-text-muted hover:border-forge-orange/40 hover:text-forge-amber flex aspect-[1] min-h-[280px] flex-col items-center justify-center gap-2 rounded-lg border border-dashed transition-colors"
        >
          <Icon.Plus size={28} />
          <span className="text-caption font-mono uppercase tracking-[0.18em]">
            {t.sites.forgeNew}
          </span>
        </button>
      </div>
    </div>
  )
}
