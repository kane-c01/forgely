'use client'

import { useMemo, useState } from 'react'

import {
  Badge,
  DataTable,
  SectionCard,
  StatCard,
  StatusDot,
  SuperButton,
} from '@/components/super-ui'
import type { DataTableColumn } from '@/components/super-ui'
import { useLocale, useT } from '@/lib/i18n'
import {
  formatCount,
  formatRelative,
  MOCK_NOW_UTC_MS,
  type PluginDecision,
  type SuperPluginRow,
} from '@/lib/super'

type FilterId = 'all' | 'pending' | 'approve' | 'reject'

const DECISION_TONE: Record<PluginDecision, 'success' | 'warning' | 'error'> = {
  approve: 'success',
  pending: 'warning',
  reject: 'error',
}

// ─────────────────────────────────────────────────────────────────────────
// Plugin category labels — bilingual (zh data inside mock is in Chinese;
// we show it as-is for zh locale and translate on the fly for en).
// ─────────────────────────────────────────────────────────────────────────

const CATEGORY_EN: Record<SuperPluginRow['category'], string> = {
  主题: 'Theme',
  集成: 'Integration',
  分析: 'Analytics',
  物流: 'Shipping',
  支付: 'Payments',
  客服: 'Support',
  本地化: 'Localization',
}

function localizedCategory(cat: SuperPluginRow['category'], locale: 'zh-CN' | 'en'): string {
  return locale === 'en' ? CATEGORY_EN[cat] : cat
}

export function PluginsStats({ plugins }: { plugins: SuperPluginRow[] }) {
  const t = useT()
  const pending = plugins.filter((p) => p.decision === 'pending')
  const approved = plugins.filter((p) => p.decision === 'approve')
  const rejected = plugins.filter((p) => p.decision === 'reject')
  const totalInstalls = plugins.reduce((sum, p) => sum + p.installs, 0)
  const enabledInstalls = plugins.reduce((sum, p) => sum + p.enabled, 0)

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label={t.super.plugins.pending}
        value={formatCount(pending.length)}
        accent={pending.length > 0 ? 'data-4' : 'forge'}
      />
      <StatCard
        label={t.super.plugins.approved}
        value={formatCount(approved.length)}
        accent="success"
      />
      <StatCard
        label={t.super.plugins.rejected}
        value={formatCount(rejected.length)}
        accent="data-3"
      />
      <StatCard
        label={t.super.plugins.totalInstalls}
        value={`${formatCount(enabledInstalls)} / ${formatCount(totalInstalls)}`}
        accent="info"
        hint={t.super.plugins.enabledOverTotal}
      />
    </div>
  )
}

export function PluginsPolicyCard() {
  const t = useT()
  return (
    <SectionCard
      title={t.super.plugins.policyTitle}
      subtitle={<span className="font-mono">{t.super.plugins.policySubtitle}</span>}
    >
      <div className="flex flex-wrap gap-2">
        <Badge tone="info">{t.super.plugins.autoScan}</Badge>
        <Badge tone="success">{t.super.plugins.sandbox}</Badge>
        <Badge tone="warning">{t.super.plugins.realName}</Badge>
        <Badge tone="forge">{t.super.plugins.officialWhitelist}</Badge>
      </div>
    </SectionCard>
  )
}

export function PluginsClient({ plugins }: { plugins: SuperPluginRow[] }) {
  const t = useT()
  const { locale } = useLocale()
  const [filter, setFilter] = useState<FilterId>('pending')
  const [selectedId, setSelectedId] = useState<string | null>(plugins[0]?.pluginId ?? null)

  const filterLabel: Record<FilterId, string> = {
    all: t.super.common.filterAll,
    pending: t.super.plugins.decisionPending,
    approve: t.super.plugins.decisionApprove,
    reject: t.super.plugins.decisionReject,
  }

  const decisionLabel: Record<PluginDecision, string> = {
    approve: t.super.plugins.decisionApprove,
    pending: t.super.plugins.decisionPending,
    reject: t.super.plugins.decisionReject,
  }

  const filtered = useMemo(() => {
    if (filter === 'all') return plugins
    return plugins.filter((p) => p.decision === filter)
  }, [plugins, filter])

  const selected = plugins.find((p) => p.pluginId === selectedId) ?? null

  const columns: DataTableColumn<SuperPluginRow>[] = [
    {
      key: 'name',
      header: t.super.plugins.colPlugin,
      render: (r) => (
        <div className="min-w-0">
          <div className="text-small text-text-primary">{r.pluginName}</div>
          <div className="text-caption text-text-muted font-mono">
            {r.pluginId} · v{r.version}
          </div>
        </div>
      ),
      sortAccessor: (r) => r.pluginName,
    },
    {
      key: 'category',
      header: t.super.plugins.colCategory,
      render: (r) => <Badge tone="neutral">{localizedCategory(r.category, locale)}</Badge>,
    },
    {
      key: 'developer',
      header: t.super.plugins.colDeveloper,
      render: (r) => <span className="text-small text-text-secondary">{r.developer}</span>,
    },
    {
      key: 'installs',
      header: t.super.plugins.colInstalls,
      align: 'right',
      render: (r) => (
        <span className="text-text-primary font-mono tabular-nums">
          {formatCount(r.enabled)} / {formatCount(r.installs)}
        </span>
      ),
      sortAccessor: (r) => r.installs,
    },
    {
      key: 'decision',
      header: t.super.plugins.colStatus,
      render: (r) => (
        <span className="inline-flex items-center gap-2">
          <StatusDot
            tone={r.decision === 'approve' ? 'ok' : r.decision === 'reject' ? 'error' : 'warning'}
          />
          <Badge tone={DECISION_TONE[r.decision]}>{decisionLabel[r.decision]}</Badge>
        </span>
      ),
    },
    {
      key: 'updated',
      header: t.super.plugins.colUpdated,
      align: 'right',
      render: (r) => (
        <span className="text-caption text-text-muted font-mono tabular-nums">
          {formatRelative(r.lastUpdatedAt, MOCK_NOW_UTC_MS)}
        </span>
      ),
      sortAccessor: (r) => r.lastUpdatedAt,
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
      <SectionCard
        title={`${t.super.plugins.listTitle} · ${filterLabel[filter]}（${filtered.length}）`}
        bodyClassName="p-0"
        action={
          <div className="flex flex-wrap items-center gap-1">
            {(['pending', 'approve', 'reject', 'all'] as FilterId[]).map((id) => (
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
          rowKey={(r) => r.pluginId}
          onRowClick={(r) => setSelectedId(r.pluginId)}
          selectedRowId={selectedId ?? undefined}
          emptyState={t.super.common.noData}
          initialSort={{ key: 'updated', direction: 'desc' }}
        />
      </SectionCard>

      <PluginDetail plugin={selected} decisionLabel={decisionLabel} />
    </div>
  )
}

function PluginDetail({
  plugin,
  decisionLabel,
}: {
  plugin: SuperPluginRow | null
  decisionLabel: Record<PluginDecision, string>
}) {
  const t = useT()
  const { locale } = useLocale()
  if (!plugin) {
    return (
      <SectionCard title={t.super.plugins.detailsTitle}>
        <p className="text-small text-text-muted">{t.super.plugins.detailsEmpty}</p>
      </SectionCard>
    )
  }
  return (
    <SectionCard
      title={plugin.pluginName}
      subtitle={
        <span className="font-mono">
          {plugin.pluginId} · v{plugin.version}
        </span>
      }
    >
      <dl className="text-small space-y-3">
        <Row label={t.super.plugins.label.developer} value={plugin.developer} />
        <Row
          label={t.super.plugins.label.category}
          value={localizedCategory(plugin.category, locale)}
        />
        <Row
          label={t.super.plugins.label.installs}
          value={`${formatCount(plugin.enabled)} / ${formatCount(plugin.installs)}`}
        />
        <Row
          label={t.super.plugins.label.firstInstalled}
          value={formatRelative(plugin.firstInstalledAt, MOCK_NOW_UTC_MS)}
        />
        <Row
          label={t.super.plugins.label.lastUpdated}
          value={formatRelative(plugin.lastUpdatedAt, MOCK_NOW_UTC_MS)}
        />
        <Row label={t.super.plugins.label.reviewStatus} value={decisionLabel[plugin.decision]} />
      </dl>

      <div className="border-border-subtle mt-4 flex flex-wrap gap-2 border-t pt-4">
        <SuperButton
          size="sm"
          variant="primary"
          disabled={plugin.decision === 'approve'}
          onClick={() => alert(`${t.super.plugins.actionApprove}: ${plugin.pluginName}`)}
        >
          {t.super.plugins.actionApprove}
        </SuperButton>
        <SuperButton
          size="sm"
          variant="danger"
          disabled={plugin.decision === 'reject'}
          onClick={() => alert(`${t.super.plugins.actionReject}: ${plugin.pluginName}`)}
        >
          {t.super.plugins.actionReject}
        </SuperButton>
        <SuperButton size="sm" variant="ghost">
          {t.super.plugins.actionInstalls}
        </SuperButton>
      </div>

      <div className="border-border-subtle mt-4 border-t pt-4">
        <div className="text-caption text-text-muted font-mono uppercase tracking-[0.16em]">
          {t.super.plugins.sandboxTitle}
        </div>
        <ul className="text-small text-text-secondary mt-2 space-y-1">
          <li>• {t.super.plugins.sandbox1}</li>
          <li>• {t.super.plugins.sandbox2}</li>
          <li>• {t.super.plugins.sandbox3}</li>
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
