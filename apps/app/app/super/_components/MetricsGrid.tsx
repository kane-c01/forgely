import { StatCard } from '@/components/super-ui'
import { formatDelta, formatMetric } from '@/lib/super'
import type { MetricSnapshot } from '@/lib/super'

const ACCENT_BY_ID: Record<MetricSnapshot['id'], 'forge' | 'info' | 'data-3' | 'data-4' | 'success'> = {
  mrr: 'forge',
  arr: 'forge',
  users: 'info',
  dau: 'data-3',
  gross_margin: 'data-4',
  ai_spend: 'success',
}

const HINT_BY_ID: Record<MetricSnapshot['id'], string> = {
  mrr: 'vs last month',
  arr: 'projected (12× MRR)',
  users: 'lifetime registered',
  dau: 'rolling 24h',
  gross_margin: 'after AI cost',
  ai_spend: '30d trailing',
}

export function MetricsGrid({ metrics }: { metrics: MetricSnapshot[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.slice(0, 4).map((metric) => (
        <StatCard
          key={metric.id}
          label={metric.label}
          value={formatMetric(metric)}
          delta={{ value: formatDelta(metric.delta), direction: metric.delta.direction }}
          spark={metric.trend}
          accent={ACCENT_BY_ID[metric.id]}
          hint={HINT_BY_ID[metric.id]}
        />
      ))}
    </div>
  )
}
