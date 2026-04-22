'use client'

import { SectionCard, StatCard } from '@/components/super-ui'
import { useT } from '@/lib/i18n'
import { formatCount, type PlatformAnalyticsOverview } from '@/lib/super'

export function AnalyticsDashboard({ overview }: { overview: PlatformAnalyticsOverview }) {
  const t = useT()
  const creditDelta =
    ((overview.avgCredits.current - overview.avgCredits.previous) / overview.avgCredits.previous) *
    100
  const churnDelta =
    ((overview.churnRate.current - overview.churnRate.previous) / overview.churnRate.previous) * 100

  const channelLabel: Record<string, string> = {
    organic: t.super.analytics.channelsOrganic,
    wechat: t.super.analytics.channelsWechat,
    referral: t.super.analytics.channelsReferral,
    ads: t.super.analytics.channelsAds,
  }

  const funnelStepLabel = [
    t.super.analytics.funnelStep1,
    t.super.analytics.funnelStep2,
    t.super.analytics.funnelStep3,
    t.super.analytics.funnelStep4,
    t.super.analytics.funnelStep5,
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={t.super.analytics.kpiSub}
          value={formatCount(overview.dauWauMau.dau)}
          hint={`WAU ${formatCount(overview.dauWauMau.wau)} · MAU ${formatCount(overview.dauWauMau.mau)}`}
          accent="info"
        />
        <StatCard
          label={t.super.analytics.timeToFirstSite}
          value={`${Math.round(overview.timeToFirstSite.medianSeconds / 60)}m`}
          hint={`p90 ${Math.round(overview.timeToFirstSite.p90Seconds / 60)}m`}
          accent="forge"
        />
        <StatCard
          label={t.super.analytics.avgCredits}
          value={formatCount(overview.avgCredits.current)}
          delta={{
            value: `${Math.abs(creditDelta).toFixed(1)}%`,
            direction: creditDelta >= 0 ? 'up' : 'down',
          }}
          accent="success"
        />
        <StatCard
          label={t.super.analytics.churnRate}
          value={`${overview.churnRate.current.toFixed(1)}%`}
          delta={{
            value: `${Math.abs(churnDelta).toFixed(1)}%`,
            direction: churnDelta >= 0 ? 'up' : 'down',
          }}
          accent={overview.churnRate.current > 5 ? 'data-3' : 'data-4'}
        />
      </div>

      <SectionCard title={t.super.analytics.funnel}>
        <div className="flex flex-col gap-3">
          {overview.funnel.map((step, idx) => {
            const max = overview.funnel[0]?.count ?? 1
            const width = (step.count / max) * 100
            return (
              <div key={step.step} className="space-y-1">
                <div className="text-caption flex items-baseline justify-between font-mono uppercase tracking-[0.14em]">
                  <span className="text-text-secondary">
                    {step.step}. {funnelStepLabel[idx]}
                  </span>
                  <span className="text-text-primary tabular-nums">
                    {formatCount(step.count)}
                    {idx > 0 ? (
                      <span className="text-text-muted ml-3">
                        ({(step.conversionFromPrev * 100).toFixed(1)}%)
                      </span>
                    ) : null}
                  </span>
                </div>
                <div className="border-border-subtle bg-bg-deep relative h-6 overflow-hidden border">
                  <div
                    className="bg-forge-orange/40 absolute inset-y-0 left-0"
                    style={{ width: `${width}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </SectionCard>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <SectionCard title={t.super.analytics.retention}>
          <table className="w-full">
            <thead>
              <tr className="border-border-subtle border-b">
                <th className="text-caption text-text-muted py-2 text-left font-mono uppercase tracking-[0.14em]">
                  Cohort
                </th>
                <th className="text-caption text-text-muted py-2 text-right font-mono uppercase tracking-[0.14em]">
                  {t.super.analytics.retentionDay1}
                </th>
                <th className="text-caption text-text-muted py-2 text-right font-mono uppercase tracking-[0.14em]">
                  {t.super.analytics.retentionDay7}
                </th>
                <th className="text-caption text-text-muted py-2 text-right font-mono uppercase tracking-[0.14em]">
                  {t.super.analytics.retentionDay30}
                </th>
              </tr>
            </thead>
            <tbody>
              {overview.retention.map((r) => (
                <tr key={r.cohortDate} className="border-border-subtle border-b">
                  <td className="text-caption text-text-secondary py-2 font-mono">
                    {r.cohortDate}
                  </td>
                  <td className="text-text-primary py-2 text-right font-mono tabular-nums">
                    {r.d1 ? `${(r.d1 * 100).toFixed(0)}%` : '—'}
                  </td>
                  <td className="text-text-primary py-2 text-right font-mono tabular-nums">
                    {r.d7 ? `${(r.d7 * 100).toFixed(0)}%` : '—'}
                  </td>
                  <td className="text-text-primary py-2 text-right font-mono tabular-nums">
                    {r.d30 ? `${(r.d30 * 100).toFixed(0)}%` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </SectionCard>

        <SectionCard title={t.super.analytics.topChannels}>
          <ul className="divide-border-subtle divide-y">
            {overview.channels.map((c) => {
              const convRate = c.visits > 0 ? (c.paying / c.visits) * 100 : 0
              return (
                <li key={c.label} className="flex items-baseline justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <div className="text-small text-text-primary">{channelLabel[c.label]}</div>
                    <div className="text-caption text-text-muted font-mono">
                      {formatCount(c.visits)} visits · {formatCount(c.signups)} signups
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-forge-amber font-mono tabular-nums">
                      {formatCount(c.paying)}
                    </div>
                    <div className="text-caption text-text-muted font-mono">
                      {convRate.toFixed(2)}%
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        </SectionCard>
      </div>
    </div>
  )
}
