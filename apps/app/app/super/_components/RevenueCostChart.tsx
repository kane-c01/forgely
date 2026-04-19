import { DualLineChart, SectionCard } from '@/components/super-ui'
import { formatUsd } from '@/lib/super'
import type { RevenueCostPoint } from '@/lib/super'

export function RevenueCostChart({ data }: { data: RevenueCostPoint[] }) {
  const labels = data.map((d) => d.date.slice(5))
  const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0)
  const totalCost = data.reduce((sum, d) => sum + d.aiCost, 0)
  const margin = totalRevenue === 0 ? 0 : ((totalRevenue - totalCost) / totalRevenue) * 100

  return (
    <SectionCard
      title="Revenue vs AI Cost · 30d"
      subtitle={
        <span className="font-mono tabular-nums">
          Revenue {formatUsd(totalRevenue)} · AI Cost {formatUsd(totalCost)} · Margin{' '}
          <span className="text-success">{margin.toFixed(1)}%</span>
        </span>
      }
    >
      <DualLineChart
        labels={labels}
        series={[
          {
            name: 'Revenue',
            color: '#FF6B1A',
            data: data.map((d) => d.revenue),
            format: (v) => formatUsd(v),
          },
          {
            name: 'AI Cost',
            color: '#00D9FF',
            data: data.map((d) => d.aiCost),
            format: (v) => formatUsd(v),
          },
        ]}
      />
    </SectionCard>
  )
}
