import { getOverviewSnapshot, formatTimestamp } from '@/lib/super'
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
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="font-mono text-caption uppercase tracking-[0.22em] text-text-muted">
            Command Center
          </div>
          <h1 className="font-display text-h2 text-text-primary">Overview</h1>
        </div>
        <div className="font-mono text-caption tabular-nums uppercase tracking-[0.18em] text-text-muted">
          Snapshot · {formatTimestamp(snapshot.generatedAt)} UTC
        </div>
      </header>

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
