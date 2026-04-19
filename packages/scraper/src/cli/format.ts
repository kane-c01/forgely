import type { ScrapedData, ScrapedProduct } from '../types.js'

const COLORS = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  forge: '\x1b[38;5;208m', // Forge orange
}

export type Color = keyof typeof COLORS

export function paint(text: string, color: Color, options: { useColor?: boolean } = {}): string {
  if (options.useColor === false) return text
  return `${COLORS[color]}${text}${COLORS.reset}`
}

export function formatMoney(amountCents: number, currency: string): string {
  const value = (amountCents / 100).toFixed(currency === 'JPY' ? 0 : 2)
  const symbol = currencySymbol(currency)
  return `${symbol}${value}`
}

function currencySymbol(currency: string): string {
  switch (currency) {
    case 'USD':
    case 'CAD':
    case 'AUD':
      return '$'
    case 'EUR':
      return '€'
    case 'GBP':
      return '£'
    case 'JPY':
      return '¥'
    case 'CNY':
      return '¥'
    case 'INR':
      return '₹'
    default:
      return `${currency} `
  }
}

export interface FormatOptions {
  useColor?: boolean
  maxRows?: number
}

/**
 * Market-friendly summary printed by the CLI. Designed to fit comfortably in
 * an 80-col terminal, optimised for live demo / sales-call screen-sharing.
 */
export function formatTable(data: ScrapedData, options: FormatOptions = {}): string {
  const useColor = options.useColor ?? true
  const lines: string[] = []
  const c = (text: string, color: Color): string => paint(text, color, { useColor })

  const confidencePct = Math.round(data.confidence * 100)
  const confidenceColor: Color =
    confidencePct >= 90 ? 'green' : confidencePct >= 70 ? 'yellow' : 'red'

  lines.push(
    `${c('✓', 'green')} Source: ${c(data.source, 'cyan')} ${c(`(${data.store.domain})`, 'dim')}`,
  )
  lines.push(
    `${c('✓', 'green')} ${c(String(data.products.length), 'bold')} products  ·  ${c(
      data.store.currency,
      'magenta',
    )}  ·  confidence ${c(`${confidencePct}%`, confidenceColor)}`,
  )
  if (data.collections.length > 0) {
    lines.push(
      `${c('✓', 'green')} ${data.collections.length} collections  ·  ${data.collections
        .slice(0, 3)
        .map((col) => col.title)
        .join(', ')}${data.collections.length > 3 ? ` +${data.collections.length - 3} more` : ''}`,
    )
  }
  if (data.screenshots.homepage || data.screenshots.productPage || data.screenshots.categoryPage) {
    const captured = [
      data.screenshots.homepage && 'homepage',
      data.screenshots.productPage && 'product',
      data.screenshots.categoryPage && 'category',
    ]
      .filter(Boolean)
      .join(', ')
    lines.push(`${c('✓', 'green')} screenshots: ${c(captured, 'dim')}`)
  }
  lines.push('')

  const max = Math.min(data.products.length, options.maxRows ?? 25)
  for (let i = 0; i < max; i++) {
    const p = data.products[i]
    if (!p) continue
    lines.push(formatProductRow(p, i + 1, data.store.currency, { useColor }))
  }
  if (data.products.length > max) {
    lines.push(c(`  ... +${data.products.length - max} more products`, 'dim'))
  }

  if (data.meta && Object.keys(data.meta).length > 0) {
    lines.push('')
    lines.push(c(`meta: ${formatMetaInline(data.meta)}`, 'dim'))
  }

  return lines.join('\n')
}

function formatProductRow(
  p: ScrapedProduct,
  index: number,
  currency: string,
  options: { useColor?: boolean },
): string {
  const useColor = options.useColor ?? true
  const c = (text: string, color: Color): string => paint(text, color, { useColor })

  const num = c(`#${index}`.padEnd(4), 'dim')
  const titleClipped = clip(p.title, 32).padEnd(32)
  const priceStr = formatMoney(p.priceFrom.amountCents, p.priceFrom.currency || currency)
  const compareAt = p.variants[0]?.compareAtPrice
  let priceCell: string
  if (compareAt && compareAt.amountCents > p.priceFrom.amountCents) {
    const discount = Math.round(
      ((compareAt.amountCents - p.priceFrom.amountCents) / compareAt.amountCents) * 100,
    )
    priceCell = `${c(priceStr, 'forge')} ${c(`(was ${formatMoney(compareAt.amountCents, compareAt.currency)})`, 'dim')} ${c(
      `-${discount}%`,
      'green',
    )}`
  } else {
    priceCell = c(priceStr, 'forge')
  }
  const stock = p.available ? '' : c('  ✗ out of stock', 'red')
  const imgs =
    p.images.length > 0
      ? c(`  ${p.images.length} img${p.images.length > 1 ? 's' : ''}`, 'dim')
      : c('  no img', 'red')
  return `  ${num} ${c(titleClipped, 'bold')}  ${priceCell}${stock}${imgs}`
}

function clip(text: string, max: number): string {
  if (text.length <= max) return text
  return `${text.slice(0, max - 1)}…`
}

function formatMetaInline(meta: Record<string, unknown>): string {
  return Object.entries(meta)
    .map(([k, v]) => `${k}=${typeof v === 'string' ? v : JSON.stringify(v)}`)
    .join('  ·  ')
}

/** Compact JSON. */
export function formatJson(data: ScrapedData): string {
  return JSON.stringify(data, null, 2)
}

/** Markdown report — useful for sticking into PR comments / customer reports. */
export function formatMarkdown(data: ScrapedData): string {
  const lines: string[] = []
  lines.push(`# Scrape report — ${data.store.name}`)
  lines.push('')
  lines.push(`- **Source:** \`${data.source}\``)
  lines.push(`- **URL:** ${data.sourceUrl}`)
  lines.push(`- **Currency:** ${data.store.currency}`)
  lines.push(`- **Confidence:** ${(data.confidence * 100).toFixed(0)}%`)
  lines.push(`- **Scraped at:** ${data.scrapedAt.toISOString()}`)
  lines.push('')
  lines.push(`## Products (${data.products.length})`)
  lines.push('')
  lines.push('| # | Title | Price | Available | Imgs |')
  lines.push('|---|---|---|---|---|')
  for (let i = 0; i < data.products.length; i++) {
    const p = data.products[i]
    if (!p) continue
    lines.push(
      `| ${i + 1} | ${escapeMd(p.title)} | ${formatMoney(p.priceFrom.amountCents, p.priceFrom.currency)} | ${p.available ? '✅' : '❌'} | ${p.images.length} |`,
    )
  }
  if (data.collections.length > 0) {
    lines.push('')
    lines.push(`## Collections (${data.collections.length})`)
    for (const col of data.collections) {
      lines.push(`- **${escapeMd(col.title)}** — \`${col.handle}\` — ${col.url}`)
    }
  }
  return lines.join('\n')
}

function escapeMd(s: string): string {
  return s.replace(/\|/g, '\\|').replace(/\n/g, ' ')
}
