'use client'

import { useMemo, useState } from 'react'

import {
  Badge,
  DataTable,
  SectionCard,
  StatCard,
  StatusDot,
  SuperButton,
  type DataTableColumn,
  type StatusTone,
} from '@/components/super-ui'
import { useT } from '@/lib/i18n'
import {
  formatCount,
  formatRelative,
  formatUsd,
  MOCK_NOW_UTC_MS,
  type SuperSiteRow,
  type SuperSiteStatus,
} from '@/lib/super'

type FilterId = 'all' | 'live' | 'frozen' | 'building' | 'failed'

const STATUS_TONE: Record<SuperSiteStatus, 'success' | 'warning' | 'forge' | 'error' | 'neutral'> =
  {
    live: 'success',
    frozen: 'warning',
    building: 'forge',
    failed: 'error',
    archived: 'neutral',
  }

const STATUS_DOT: Record<SuperSiteStatus, StatusTone> = {
  live: 'ok',
  frozen: 'warning',
  building: 'live',
  failed: 'error',
  archived: 'idle',
}

export function SitesStats({ sites }: { sites: SuperSiteRow[] }) {
  const t = useT()
  const live = sites.filter((s) => s.status === 'live').length
  const frozen = sites.filter((s) => s.status === 'frozen').length
  const failed = sites.filter((s) => s.status === 'failed').length
  const revenue30 = sites.reduce((sum, s) => sum + s.revenueUsd30, 0)

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label={t.super.sites.running}
        value={formatCount(live)}
        accent="success"
        hint={t.super.sites.public}
      />
      <StatCard
        label={t.super.sites.frozen}
        value={formatCount(frozen)}
        accent="data-3"
        hint={t.super.sites.freezeReason}
      />
      <StatCard
        label={t.super.sites.failed}
        value={formatCount(failed)}
        accent="data-4"
        hint={t.super.sites.failReason}
      />
      <StatCard
        label={t.super.sites.gmv30}
        value={formatUsd(revenue30, true)}
        accent="forge"
        hint={t.super.sites.gmvUsdAggregate}
      />
    </div>
  )
}

export function SitesOpsCard() {
  const t = useT()
  return (
    <SectionCard
      title={t.super.sites.opsNote}
      subtitle={<span className="font-mono">{t.super.sites.opsSubtitle}</span>}
    >
      <p className="text-small text-text-secondary">{t.super.sites.opsBody}</p>
    </SectionCard>
  )
}

export function SitesClient({ sites }: { sites: SuperSiteRow[] }) {
  const t = useT()
  const [filter, setFilter] = useState<FilterId>('all')
  const [selectedId, setSelectedId] = useState<string | null>(sites[0]?.id ?? null)
  const [search, setSearch] = useState('')

  const statusLabel: Record<SuperSiteStatus, string> = {
    live: t.super.sites.running,
    frozen: t.super.sites.frozen,
    building: t.super.sites.building,
    failed: t.super.sites.failed,
    archived: t.super.sites.archived,
  }

  const filterLabel: Record<FilterId, string> = {
    all: t.super.common.filterAll,
    live: t.super.sites.running,
    frozen: t.super.sites.frozen,
    building: t.super.sites.building,
    failed: t.super.sites.failed,
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return sites.filter((s) => {
      if (filter !== 'all' && s.status !== filter) return false
      if (!q) return true
      const hay = `${s.name} ${s.subdomain} ${s.customDomain ?? ''} ${s.ownerLabel}`.toLowerCase()
      return hay.includes(q)
    })
  }, [sites, filter, search])

  const selected = sites.find((s) => s.id === selectedId) ?? null

  const columns: DataTableColumn<SuperSiteRow>[] = [
    {
      key: 'name',
      header: t.super.sites.colSite,
      render: (r) => (
        <div className="min-w-0">
          <div className="text-small text-text-primary">{r.name}</div>
          <div className="text-caption text-text-muted font-mono">
            {r.customDomain ?? `${r.subdomain}.forgely.app`}
          </div>
        </div>
      ),
      sortAccessor: (r) => r.name,
    },
    {
      key: 'owner',
      header: t.super.sites.colMerchant,
      render: (r) => (
        <div className="min-w-0">
          <div className="text-small text-text-secondary">{r.ownerLabel}</div>
          <div className="text-caption text-text-muted font-mono">{r.ownerRegion}</div>
        </div>
      ),
    },
    {
      key: 'status',
      header: t.super.sites.colStatus,
      render: (r) => (
        <span className="inline-flex items-center gap-2">
          <StatusDot tone={STATUS_DOT[r.status]} />
          <Badge tone={STATUS_TONE[r.status]}>{statusLabel[r.status]}</Badge>
        </span>
      ),
    },
    {
      key: 'orders',
      header: t.super.sites.col30dOrders,
      align: 'right',
      render: (r) => (
        <span className="text-text-primary font-mono tabular-nums">
          {formatCount(r.ordersLast30)}
        </span>
      ),
      sortAccessor: (r) => r.ordersLast30,
    },
    {
      key: 'revenue',
      header: t.super.sites.col30dGmv,
      align: 'right',
      render: (r) => (
        <span className="text-text-primary font-mono tabular-nums">
          {r.revenueUsd30 ? formatUsd(r.revenueUsd30, true) : '—'}
        </span>
      ),
      sortAccessor: (r) => r.revenueUsd30,
    },
    {
      key: 'deployed',
      header: t.super.sites.colLastDeployed,
      align: 'right',
      render: (r) => (
        <span className="text-caption text-text-muted font-mono tabular-nums">
          {formatRelative(r.lastDeployedAt, MOCK_NOW_UTC_MS)}
        </span>
      ),
      sortAccessor: (r) => r.lastDeployedAt,
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
      <SectionCard
        title={`${t.super.sites.title} · ${filterLabel[filter]}（${filtered.length}）`}
        bodyClassName="p-0"
        action={
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t.super.sites.searchPlaceholder}
              className="border-border-subtle bg-bg-deep text-caption text-text-primary placeholder:text-text-subtle focus:border-forge-ember w-48 border px-2.5 py-1 font-mono focus:outline-none"
            />
            {(['all', 'live', 'frozen', 'building', 'failed'] as FilterId[]).map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => setFilter(id)}
                className={
                  'text-caption border px-2.5 py-1 font-mono uppercase tracking-[0.16em] transition-colors ' +
                  (filter === id
                    ? 'border-forge-ember bg-forge-orange/15 text-forge-amber'
                    : 'border-border-subtle text-text-muted hover:text-text-primary')
                }
              >
                {filterLabel[id]}
              </button>
            ))}
          </div>
        }
      >
        <DataTable
          rows={filtered}
          columns={columns}
          rowKey={(r) => r.id}
          onRowClick={(r) => setSelectedId(r.id)}
          selectedRowId={selectedId ?? undefined}
          initialSort={{ key: 'revenue', direction: 'desc' }}
          emptyState={t.super.common.noData}
        />
      </SectionCard>

      <SiteDetail site={selected} />
    </div>
  )
}

function SiteDetail({ site }: { site: SuperSiteRow | null }) {
  const t = useT()
  if (!site) {
    return (
      <SectionCard title={t.super.sites.detailTitle}>
        <p className="text-small text-text-muted">{t.super.sites.detailEmpty}</p>
      </SectionCard>
    )
  }

  const isLive = site.status === 'live'
  const isFrozen = site.status === 'frozen'

  return (
    <SectionCard
      title={site.name}
      subtitle={
        <span className="font-mono">{site.customDomain ?? `${site.subdomain}.forgely.app`}</span>
      }
    >
      <dl className="text-small space-y-3">
        <Row label={t.super.sites.labels.merchant} value={site.ownerLabel} />
        <Row label={t.super.sites.labels.productsCount} value={formatCount(site.productsCount)} />
        <Row label={t.super.sites.labels.orders30} value={formatCount(site.ordersLast30)} />
        <Row
          label={t.super.sites.labels.gmv30}
          value={site.revenueUsd30 ? formatUsd(site.revenueUsd30, true) : '—'}
        />
        <Row
          label={t.super.sites.labels.createdAt}
          value={formatRelative(site.createdAt, MOCK_NOW_UTC_MS)}
        />
        <Row
          label={t.super.sites.labels.lastDeployed}
          value={formatRelative(site.lastDeployedAt, MOCK_NOW_UTC_MS)}
        />
      </dl>

      {site.flaggedReason ? (
        <div className="border-warning/40 bg-warning/10 text-caption text-warning mt-4 border px-3 py-2">
          {site.flaggedReason}
        </div>
      ) : null}

      <div className="border-border-subtle mt-4 flex flex-wrap gap-2 border-t pt-4">
        {isLive ? (
          <SuperButton
            size="sm"
            variant="danger"
            onClick={() => alert(`${t.super.sites.freezeSite}: ${site.name}`)}
          >
            {t.super.sites.freezeSite}
          </SuperButton>
        ) : isFrozen ? (
          <SuperButton
            size="sm"
            variant="primary"
            onClick={() => alert(`${t.super.sites.unfreezeSite}: ${site.name}`)}
          >
            {t.super.sites.unfreezeSite}
          </SuperButton>
        ) : null}
        <SuperButton size="sm" variant="ghost" onClick={() => alert(t.super.sites.regenerate)}>
          {t.super.sites.regenerate}
        </SuperButton>
        <SuperButton size="sm" variant="ghost">
          {t.super.sites.openSite}
        </SuperButton>
        <SuperButton size="sm" variant="ghost">
          {t.super.sites.contactMerchant}
        </SuperButton>
      </div>

      <div className="border-border-subtle mt-4 border-t pt-4">
        <div className="text-caption text-text-muted font-mono uppercase tracking-[0.16em]">
          {t.super.sites.hostingTitle}
        </div>
        <ul className="text-small text-text-secondary mt-2 space-y-1">
          <li>
            • {t.super.sites.hosting1}：{site.subdomain}-fge
          </li>
          <li>
            • {t.super.sites.hosting2}：{(site.productsCount * 8.4).toFixed(1)} MB
          </li>
          <li>• {t.super.sites.hosting3}：1,500 / mo</li>
        </ul>
      </div>
    </SectionCard>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-caption text-text-muted font-mono uppercase tracking-[0.16em]">
        {label}
      </dt>
      <dd className="text-text-primary text-right">{value}</dd>
    </div>
  )
}
