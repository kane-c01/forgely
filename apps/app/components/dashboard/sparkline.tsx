import { cn } from '@/lib/cn'

interface SparklineProps {
  data: number[]
  width?: number
  height?: number
  stroke?: string
  fill?: string
  className?: string
  showAxis?: boolean
}

/**
 * Pure SVG sparkline — no external chart library.
 *
 * Renders an area chart with a glowing forge-orange stroke. Used inside
 * KPI cards and the dashboard "Revenue 30d" hero card.
 */
export function Sparkline({
  data,
  width = 600,
  height = 160,
  stroke = '#FF6B1A',
  fill: _fill = 'rgba(255,107,26,0.18)',
  className,
  showAxis,
}: SparklineProps) {
  if (data.length < 2) return null
  const padX = 4
  const padY = 8
  const min = Math.min(...data)
  const max = Math.max(...data)
  const span = Math.max(1, max - min)
  const stepX = (width - padX * 2) / (data.length - 1)
  const points = data.map((v, i) => {
    const x = padX + i * stepX
    const y = padY + (height - padY * 2) * (1 - (v - min) / span)
    return [x, y] as const
  })
  const path = points
    .map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`)
    .join(' ')
  const area = `${path} L ${points[points.length - 1]![0].toFixed(2)} ${height - padY} L ${points[0]![0].toFixed(2)} ${height - padY} Z`

  return (
    <svg
      role="img"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className={cn('h-full w-full', className)}
    >
      <defs>
        <linearGradient id="spark-gradient" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.32" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      {showAxis
        ? Array.from({ length: 5 }).map((_, i) => (
            <line
              key={i}
              x1="0"
              x2={width}
              y1={padY + ((height - padY * 2) * i) / 4}
              y2={padY + ((height - padY * 2) * i) / 4}
              stroke="rgba(255,255,255,0.04)"
            />
          ))
        : null}
      <path d={area} fill="url(#spark-gradient)" stroke="none" />
      <path d={path} fill="none" stroke={stroke} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      <circle
        cx={points[points.length - 1]![0]}
        cy={points[points.length - 1]![1]}
        r={3}
        fill={stroke}
      />
      {showAxis ? (
        <circle
          cx={points[points.length - 1]![0]}
          cy={points[points.length - 1]![1]}
          r={9}
          fill={stroke}
          opacity="0.18"
        >
          <animate attributeName="r" values="6;14;6" dur="2.4s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.32;0;0.32" dur="2.4s" repeatCount="indefinite" />
        </circle>
      ) : null}
    </svg>
  )
}
