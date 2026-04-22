'use client'

import {
  Badge,
  DataTable,
  DualLineChart,
  SectionCard,
  StatCard,
  StatusDot,
  type DataTableColumn,
  type StatusTone,
} from '@/components/super-ui'
import { useT } from '@/lib/i18n'
import {
  formatCount,
  formatRelative,
  formatTimestamp,
  formatUsd,
  MOCK_NOW_UTC_MS,
  type AiOpsOverview,
  type AiProviderRow,
} from '@/lib/super'

const STATUS_TONE: Record<AiProviderRow['status'], 'success' | 'warning' | 'error' | 'neutral'> = {
  ok: 'success',
  rate_limited: 'warning',
  down: 'error',
  unconfigured: 'neutral',
}

const STATUS_DOT: Record<AiProviderRow['status'], StatusTone> = {
  ok: 'ok',
  rate_limited: 'warning',
  down: 'error',
  unconfigured: 'idle',
}

export function AiOpsDashboard({ overview }: { overview: AiOpsOverview }) {
  const t = useT()
  const labels = overview.series.map(
    (p) => `${new Date(p.ts).getUTCHours().toString().padStart(2, '0')}:00`,
  )
  const llmSeries = overview.series.map((p) => p.deepseekUsd + p.qwenUsd + p.anthropicUsd)
  const mediaSeries = overview.series.map((p) => p.mediaUsd)

  const regionLabel: Record<AiProviderRow['region'], string> = {
    cn: t.super.aiOps.nodeCn,
    global: t.super.aiOps.nodeGlobal,
  }
  const statusLabel: Record<AiProviderRow['status'], string> = {
    ok: t.super.aiOps.statusOk,
    rate_limited: t.super.aiOps.statusRateLimited,
    down: t.super.aiOps.statusDown,
    unconfigured: t.super.aiOps.statusUnconfigured,
  }

  const columns: DataTableColumn<AiProviderRow>[] = [
    {
      key: 'provider',
      header: t.super.aiOps.colProvider,
      render: (r) => (
        <div className="min-w-0">
          <div className="text-small text-text-primary">
            {t.super.aiOps.providerNames[r.provider]}
          </div>
          <div className="text-caption text-text-muted font-mono">{r.model}</div>
        </div>
      ),
      sortAccessor: (r) => t.super.aiOps.providerNames[r.provider],
    },
    {
      key: 'region',
      header: t.super.aiOps.colNode,
      render: (r) => (
        <Badge tone={r.region === 'cn' ? 'forge' : 'info'}>{regionLabel[r.region]}</Badge>
      ),
    },
    {
      key: 'status',
      header: t.super.aiOps.colStatus,
      render: (r) => (
        <span className="inline-flex items-center gap-2">
          <StatusDot tone={STATUS_DOT[r.status]} />
          <Badge tone={STATUS_TONE[r.status]}>{statusLabel[r.status]}</Badge>
        </span>
      ),
    },
    {
      key: 'calls',
      header: t.super.aiOps.colCalls24h,
      align: 'right',
      render: (r) => (
        <span className="text-text-primary font-mono tabular-nums">
          {formatCount(r.callCount24h)}
        </span>
      ),
      sortAccessor: (r) => r.callCount24h,
    },
    {
      key: 'success',
      header: t.super.aiOps.colSuccessRate,
      align: 'right',
      render: (r) => (
        <span
          className={
            'font-mono tabular-nums ' + (r.successRate < 97 ? 'text-warning' : 'text-text-primary')
          }
        >
          {r.successRate.toFixed(1)}%
        </span>
      ),
      sortAccessor: (r) => r.successRate,
    },
    {
      key: 'cost',
      header: t.super.aiOps.colCost24h,
      align: 'right',
      render: (r) => (
        <span className="text-text-primary font-mono tabular-nums">
          {formatUsd(r.costUsd24h, true)}
        </span>
      ),
      sortAccessor: (r) => r.costUsd24h,
    },
    {
      key: 'latency',
      header: t.super.aiOps.colP95Latency,
      align: 'right',
      render: (r) => (
        <span className="text-text-secondary font-mono tabular-nums">
          {(r.p95LatencyMs / 1000).toFixed(2)}s
        </span>
      ),
      sortAccessor: (r) => r.p95LatencyMs,
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="text-caption text-text-muted -mt-2 flex flex-wrap items-center gap-2 font-mono">
        <Badge tone="forge">{t.super.aiOps.cnPriority}</Badge>
        <span>·</span>
        <span>
          {t.super.aiOps.refresh} {formatTimestamp(overview.generatedAt)} UTC
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={t.super.aiOps.calls24h}
          value={formatCount(overview.totals.calls24h)}
          accent="info"
          hint={t.super.aiOps.llmPlusMedia}
        />
        <StatCard
          label={t.super.aiOps.cost24h}
          value={formatUsd(overview.totals.costUsd24h, true)}
          accent="forge"
          hint={t.super.aiOps.costSubtitle}
        />
        <StatCard
          label={t.super.aiOps.revenueShare}
          value={`${overview.totals.revenueShare.toFixed(1)}%`}
          accent={overview.totals.revenueShare > 25 ? 'data-3' : 'success'}
          hint={t.super.aiOps.revenueTarget}
        />
        <StatCard
          label={t.super.aiOps.activeProviders}
          value={overview.totals.activeProviders.toString()}
          accent="data-4"
          hint={t.super.aiOps.coverAll}
        />
      </div>

      <SectionCard
        title={t.super.aiOps.costChartTitle}
        subtitle={<span className="font-mono">{t.super.aiOps.costChartSubtitle}</span>}
      >
        <DualLineChart
          series={[
            { name: t.super.aiOps.llmText, color: '#FF6B1A', data: llmSeries },
            { name: t.super.aiOps.mediaGen, color: '#A855F7', data: mediaSeries },
          ]}
          labels={labels}
        />
      </SectionCard>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <SectionCard className="xl:col-span-2" title={t.super.aiOps.providerStatus}>
          <DataTable
            rows={overview.providers}
            columns={columns}
            rowKey={(r) => `${r.provider}-${r.region}`}
            initialSort={{ key: 'cost', direction: 'desc' }}
          />
        </SectionCard>

        <SectionCard title={t.super.aiOps.topConsumers}>
          <ul className="divide-border-subtle divide-y">
            {overview.topConsumers.map((c) => (
              <li key={c.userId} className="flex items-baseline justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <div className="text-small text-text-primary">{c.userLabel}</div>
                  <div className="text-caption text-text-muted font-mono">
                    {c.userId} · {formatCount(c.calls24h)} {t.super.aiOps.callsSuffix}
                  </div>
                </div>
                <div className="text-forge-amber font-mono tabular-nums">
                  {formatUsd(c.usd24h, true)}
                </div>
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>

      <SectionCard title={`${t.super.aiOps.recentErrors} · ${overview.recentErrors.length}`}>
        <ul className="divide-border-subtle divide-y">
          {overview.recentErrors.map((e) => (
            <li
              key={e.id}
              className="grid grid-cols-1 gap-2 py-3 md:grid-cols-[120px_120px_minmax(0,1fr)_140px]"
            >
              <span className="text-caption text-text-muted font-mono uppercase tracking-[0.16em]">
                {formatRelative(e.occurredAt, MOCK_NOW_UTC_MS)}
              </span>
              <Badge tone="warning">{e.code}</Badge>
              <div>
                <div className="text-small text-text-primary">{e.message}</div>
                <div className="text-caption text-text-muted font-mono">
                  {t.super.aiOps.providerNames[e.provider]}
                </div>
              </div>
              <span className="text-small text-text-secondary">{e.userLabel}</span>
            </li>
          ))}
        </ul>
      </SectionCard>
    </div>
  )
}
