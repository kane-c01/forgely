import { getOverviewSnapshot, formatTimestamp } from '@/lib/super'
import { I18nHeader } from './_components/I18nHeader'
import { MetricsGrid } from './_components/MetricsGrid'
import { RevenueCostChart } from './_components/RevenueCostChart'
import { AlertsPanel } from './_components/AlertsPanel'
import { LiveActivityFeed } from './_components/LiveActivityFeed'

/**
 * /super — Overview command center.
 * docs/MASTER.md §20.5 (NASA Mission Control aesthetic).
 *
 * Server component: snapshot is rendered once on the server, then the
 * `LiveActivityFeed` client component upgrades to an SSE stream.
 */
export default async function SuperOverviewPage() {
  const snapshot = getOverviewSnapshot()

  return (
    <div className="flex flex-col gap-6">
      <I18nHeader
        section="overview"
        meta={
          <span className="text-caption text-text-muted font-mono uppercase tabular-nums tracking-[0.18em]">
            {formatTimestamp(snapshot.generatedAt)} UTC
          </span>
        }
      />

      <MetricsGrid metrics={snapshot.metrics} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RevenueCostChart data={snapshot.revenueSeries} />
        </div>
        <AlertsPanel alerts={snapshot.alerts} />
      </div>

      <LiveActivityFeed initial={snapshot.recentActivity} />
    </div>
  )
}
