'use client'

import { Badge, SectionCard, StatCard, StatusDot, type StatusTone } from '@/components/super-ui'
import { useT } from '@/lib/i18n'
import {
  formatRelative,
  formatTimestamp,
  MOCK_NOW_UTC_MS,
  type HealthSourceCard,
  type HealthSourceStatus,
  type SystemHealthOverview,
} from '@/lib/super'

const STATUS_TONE: Record<HealthSourceStatus, StatusTone> = {
  ok: 'ok',
  unconfigured: 'idle',
  unavailable: 'warning',
  error: 'error',
}

const BADGE_TONE: Record<HealthSourceStatus, 'success' | 'neutral' | 'warning' | 'error'> = {
  ok: 'success',
  unconfigured: 'neutral',
  unavailable: 'warning',
  error: 'error',
}

const OVERALL_TONE: Record<SystemHealthOverview['status'], 'success' | 'warning' | 'error'> = {
  all_systems_ok: 'success',
  degraded: 'warning',
  outage: 'error',
}

export function HealthDashboard({ overview }: { overview: SystemHealthOverview }) {
  const t = useT()
  const okCount = overview.sources.filter((s) => s.status === 'ok').length
  const errorCount = overview.sources.filter(
    (s) => s.status === 'error' || s.status === 'unavailable',
  ).length
  const unconfiguredCount = overview.sources.filter((s) => s.status === 'unconfigured').length

  const overallLabel: Record<SystemHealthOverview['status'], string> = {
    all_systems_ok: t.super.health.statusAllSystemsOk,
    degraded: t.super.health.statusDegraded,
    outage: t.super.health.statusOutage,
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="-mt-2 flex flex-wrap items-center gap-2">
        <Badge tone={OVERALL_TONE[overview.status]}>{overallLabel[overview.status]}</Badge>
        <span className="text-caption text-text-muted font-mono">
          {t.super.health.refreshed} {formatTimestamp(overview.generatedAt)} UTC
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={t.super.health.totalComponents}
          value={overview.sources.length.toString()}
          accent="info"
          hint={t.super.health.dualStack}
        />
        <StatCard
          label={t.super.health.okComponents}
          value={okCount.toString()}
          accent="success"
          hint={t.super.health.allReady}
        />
        <StatCard
          label={t.super.health.errorComponents}
          value={errorCount.toString()}
          accent={errorCount > 0 ? 'data-3' : 'forge'}
          hint={t.super.health.needIntervention}
        />
        <StatCard
          label={t.super.health.unconfiguredComponents}
          value={unconfiguredCount.toString()}
          accent="data-4"
          hint={t.super.health.needCredentials}
        />
      </div>

      <SectionCard
        title={t.super.health.infraTitle}
        subtitle={<span className="font-mono">{t.super.health.infraSubtitle}</span>}
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {overview.sources.map((src) => (
            <SourceCard key={src.id} src={src} />
          ))}
        </div>
      </SectionCard>

      <SectionCard title={t.super.health.guideTitle}>
        <ul className="text-small text-text-secondary space-y-1.5">
          <li>
            • <span className="text-text-muted font-mono">SENTRY_AUTH_TOKEN</span> — Sentry
          </li>
          <li>
            • <span className="text-text-muted font-mono">POSTHOG_API_KEY</span> — PostHog DAU / WAU
          </li>
          <li>
            • <span className="text-text-muted font-mono">CLOUDFLARE_API_TOKEN</span> — Cloudflare
            R2 + Pages
          </li>
          <li>
            • <span className="text-text-muted font-mono">ALI_OSS_ACCESS_KEY_ID / SECRET</span> —
            Aliyun OSS
          </li>
          <li>
            • <span className="text-text-muted font-mono">ALI_SMS_ACCESS_KEY_ID / SECRET</span> —
            Aliyun SMS OTP
          </li>
          <li>• {t.super.health.guideIntro}</li>
        </ul>
      </SectionCard>
    </div>
  )
}

function SourceCard({ src }: { src: HealthSourceCard }) {
  const t = useT()
  const statusLabel: Record<HealthSourceStatus, string> = {
    ok: t.super.health.statusOk,
    unconfigured: t.super.health.statusUnconfigured,
    unavailable: t.super.health.statusUnavailable,
    error: t.super.health.statusError,
  }
  const localLabel = (t.super.health.labels as Record<string, string>)[src.id] ?? src.label

  return (
    <div className="border-border-subtle bg-bg-deep flex flex-col gap-2 border px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-small text-text-primary">{localLabel}</div>
          <div className="text-caption text-text-muted font-mono">{src.vendor}</div>
        </div>
        <span className="inline-flex items-center gap-1.5">
          <StatusDot tone={STATUS_TONE[src.status]} />
          <Badge tone={BADGE_TONE[src.status]}>{statusLabel[src.status]}</Badge>
        </span>
      </div>
      <div className="text-body text-text-primary font-mono tabular-nums">{src.primaryMetric}</div>
      {src.secondaryMetric ? (
        <div className="text-caption text-text-muted">{src.secondaryMetric}</div>
      ) : null}
      {src.errorHint ? (
        <div className="border-border-subtle text-caption text-error border-t pt-2">
          {src.errorHint}
        </div>
      ) : null}
      <div className="text-text-subtle mt-1 font-mono text-[10px] uppercase tracking-[0.16em]">
        {formatRelative(src.fetchedAt, MOCK_NOW_UTC_MS)} · {t.super.health.autoRefreshLabel}
      </div>
    </div>
  )
}
