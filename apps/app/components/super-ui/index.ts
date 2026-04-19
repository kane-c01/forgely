/**
 * Local /super UI primitives.
 *
 * Why local? The shared `@forgely/ui` package is being built in parallel by
 * window W2 (T03). To avoid stepping on that work this module ships its own
 * tiny, dependency-free primitives. Once `@forgely/ui` lands these will be
 * replaced one-by-one by the shared shadcn-based equivalents.
 */
export { Badge } from './Badge'
export type { BadgeProps, BadgeTone } from './Badge'
export { SuperButton } from './Button'
export type {
  SuperButtonProps,
  SuperButtonSize,
  SuperButtonVariant,
} from './Button'
export { DataTable } from './DataTable'
export type { DataTableColumn, DataTableProps } from './DataTable'
export { DualLineChart } from './DualLineChart'
export type { DualLineChartProps, DualLineSeries } from './DualLineChart'
export { SectionCard } from './SectionCard'
export type { SectionCardProps } from './SectionCard'
export { SideDrawer } from './SideDrawer'
export type { SideDrawerProps } from './SideDrawer'
export { Sparkline } from './Sparkline'
export type { SparklineProps } from './Sparkline'
export { StatCard } from './StatCard'
export type { StatCardProps } from './StatCard'
export { StatusDot } from './StatusDot'
export type { StatusDotProps, StatusTone } from './StatusDot'
export { cn } from './cn'
