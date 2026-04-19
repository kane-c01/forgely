import { cn } from './cn'

export interface SparklineProps {
  data: number[]
  stroke?: string
  fill?: string
  width?: number
  height?: number
  className?: string
  strokeWidth?: number
}

/**
 * Pure-SVG sparkline. No deps. Used inside StatCard and Activity rows.
 */
export function Sparkline({
  data,
  stroke = '#FF6B1A',
  fill,
  width = 96,
  height = 28,
  strokeWidth = 1.5,
  className,
}: SparklineProps) {
  if (data.length === 0) {
    return <svg width={width} height={height} className={className} />
  }

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const stepX = data.length > 1 ? width / (data.length - 1) : width
  const points = data.map((value, index) => {
    const x = index * stepX
    const y = height - ((value - min) / range) * height
    return [x, y] as const
  })

  const linePath = points
    .map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`)
    .join(' ')
  const last = points[points.length - 1]
  const first = points[0]

  const areaPath = first && last
    ? `${linePath} L${last[0].toFixed(2)},${height} L${first[0].toFixed(2)},${height} Z`
    : ''

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn('overflow-visible', className)}
      aria-hidden
    >
      {fill && areaPath && <path d={areaPath} fill={fill} opacity={0.25} />}
      <path
        d={linePath}
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {last && (
        <circle cx={last[0]} cy={last[1]} r={2} fill={stroke} />
      )}
    </svg>
  )
}
