import { cn } from './cn'

export interface DualLineSeries {
  name: string
  color: string
  data: number[]
  format?: (value: number) => string
}

export interface DualLineChartProps {
  series: [DualLineSeries, DualLineSeries]
  labels: string[]
  height?: number
  className?: string
}

/**
 * Lightweight SVG dual-line chart used by the Overview page.
 * Each series is normalised independently so the lines are visually comparable
 * regardless of unit (e.g. Revenue $ vs AI Cost $).
 */
export function DualLineChart({
  series,
  labels,
  height = 220,
  className,
}: DualLineChartProps) {
  const width = 720
  const padding = { top: 16, right: 24, bottom: 28, left: 24 }
  const innerW = width - padding.left - padding.right
  const innerH = height - padding.top - padding.bottom
  const count = labels.length || series[0].data.length

  function buildPath(values: number[]): string {
    if (values.length === 0) return ''
    const min = Math.min(...values)
    const max = Math.max(...values)
    const range = max - min || 1
    const stepX = values.length > 1 ? innerW / (values.length - 1) : innerW
    return values
      .map((v, i) => {
        const x = padding.left + i * stepX
        const y = padding.top + innerH - ((v - min) / range) * innerH
        return `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`
      })
      .join(' ')
  }

  const xLabelStep = Math.max(1, Math.ceil(count / 6))

  return (
    <div className={cn('w-full overflow-hidden', className)}>
      {/* Legend */}
      <div className="mb-3 flex flex-wrap gap-4 font-mono text-caption uppercase tracking-[0.18em] text-text-muted">
        {series.map((s) => (
          <span key={s.name} className="inline-flex items-center gap-2">
            <span
              className="inline-block h-[2px] w-4"
              style={{ background: s.color }}
            />
            <span className="text-text-secondary">{s.name}</span>
          </span>
        ))}
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="block h-auto w-full"
        preserveAspectRatio="none"
        aria-hidden
      >
        {/* Grid */}
        {[0, 0.25, 0.5, 0.75, 1].map((t) => {
          const y = padding.top + t * innerH
          return (
            <line
              key={t}
              x1={padding.left}
              x2={width - padding.right}
              y1={y}
              y2={y}
              stroke="#1F1F28"
              strokeWidth={1}
              strokeDasharray={t === 1 ? undefined : '2 4'}
            />
          )
        })}

        {/* Lines */}
        {series.map((s) => (
          <path
            key={s.name}
            d={buildPath(s.data)}
            fill="none"
            stroke={s.color}
            strokeWidth={1.75}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}

        {/* X axis labels */}
        {labels.map((label, i) => {
          if (i % xLabelStep !== 0 && i !== labels.length - 1) return null
          const stepX = labels.length > 1 ? innerW / (labels.length - 1) : innerW
          const x = padding.left + i * stepX
          return (
            <text
              key={`${label}-${i}`}
              x={x}
              y={height - 8}
              textAnchor="middle"
              fontSize={10}
              fontFamily="ui-monospace, SFMono-Regular, monospace"
              fill="#6B6B78"
            >
              {label}
            </text>
          )
        })}
      </svg>
    </div>
  )
}
