import type { MetricSnapshot } from './types'

/**
 * Cinematic Industrial number formatting — mono-friendly, no thousand
 * separator overrides, USD always rendered with `$` prefix.
 */

const USD = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

const USD_PRECISE = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const COUNT = new Intl.NumberFormat('en-US')

const COMPACT = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1,
})

export function formatUsd(value: number, precise = false): string {
  return precise ? USD_PRECISE.format(value) : USD.format(value)
}

export function formatCount(value: number): string {
  return COUNT.format(value)
}

export function formatCompact(value: number): string {
  return COMPACT.format(value)
}

export function formatPercent(value: number, fractionDigits = 1): string {
  return `${value.toFixed(fractionDigits)}%`
}

export function formatMetric(metric: MetricSnapshot): string {
  switch (metric.unit) {
    case 'usd':
      return metric.value >= 100_000
        ? formatCompact(metric.value).replace(/^/, '$')
        : formatUsd(metric.value)
    case 'count':
      return formatCount(metric.value)
    case 'percent':
      return formatPercent(metric.value)
    default:
      return String(metric.value)
  }
}

export function formatDelta(delta: { value: number; direction: 'up' | 'down' | 'flat' }): string {
  const sign = delta.direction === 'down' ? '-' : delta.direction === 'up' ? '+' : ''
  return `${sign}${Math.abs(delta.value).toFixed(1)}%`
}

const DT = new Intl.DateTimeFormat('en-GB', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
  timeZone: 'UTC',
})

export function formatTimestamp(unixMs: number): string {
  // 2026-04-19 10:23:42
  return DT.format(new Date(unixMs))
    .replace(/\//g, '-')
    .replace(/, /, ' ')
}

const DATE_ONLY = new Intl.DateTimeFormat('en-CA', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  timeZone: 'UTC',
})

export function formatDate(unixMs: number): string {
  return DATE_ONLY.format(new Date(unixMs))
}

const TIME_ONLY = new Intl.DateTimeFormat('en-GB', {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
  timeZone: 'UTC',
})

export function formatTime(unixMs: number): string {
  return TIME_ONLY.format(new Date(unixMs))
}

export function formatRelative(unixMs: number, now = Date.now()): string {
  const delta = Math.max(0, now - unixMs)
  const seconds = Math.floor(delta / 1000)
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}mo ago`
  return `${Math.floor(months / 12)}y ago`
}
