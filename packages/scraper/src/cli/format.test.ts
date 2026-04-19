import { describe, expect, it } from 'vitest'

import type { ScrapedData } from '../types.js'

import { formatJson, formatMarkdown, formatMoney, formatTable } from './format.js'

const SAMPLE: ScrapedData = {
  source: 'shopify',
  sourceUrl: 'https://x.myshopify.com',
  store: { name: 'X Store', currency: 'USD', language: 'en', domain: 'x.myshopify.com' },
  products: [
    {
      id: '1',
      handle: 'hammer',
      title: 'Forge Hammer',
      description: 'A heavy steel hammer.',
      tags: ['tool'],
      images: [{ url: 'https://x.com/h.jpg' }],
      variants: [
        {
          id: 'v1',
          title: 'Default',
          price: { amountCents: 4995, currency: 'USD' },
          compareAtPrice: { amountCents: 6995, currency: 'USD' },
          available: true,
        },
      ],
      priceFrom: { amountCents: 4995, currency: 'USD' },
      available: true,
      url: 'https://x.com/p/hammer',
    },
    {
      id: '2',
      handle: 'anvil',
      title: 'Anvil',
      description: '',
      tags: [],
      images: [],
      variants: [
        {
          id: 'v2',
          title: 'Default',
          price: { amountCents: 19900, currency: 'USD' },
          available: false,
        },
      ],
      priceFrom: { amountCents: 19900, currency: 'USD' },
      available: false,
      url: 'https://x.com/p/anvil',
    },
  ],
  collections: [
    {
      id: 'c1',
      handle: 'tools',
      title: 'Tools',
      productIds: [],
      url: 'https://x.com/c/tools',
    },
  ],
  screenshots: { homepage: 'mem://screenshot-homepage.png' },
  scrapedAt: new Date('2026-04-19T18:00:00Z'),
  confidence: 0.95,
  meta: { strategy: 'rest' },
}

describe('formatMoney', () => {
  it('handles USD with 2 decimals', () => {
    expect(formatMoney(4995, 'USD')).toBe('$49.95')
  })
  it('handles JPY with 0 decimals', () => {
    expect(formatMoney(1000, 'JPY')).toBe('¥10')
  })
  it('falls back to currency code for unknown', () => {
    expect(formatMoney(100, 'BRL')).toBe('BRL 1.00')
  })
})

describe('formatTable', () => {
  it('renders without color when useColor=false', () => {
    const out = formatTable(SAMPLE, { useColor: false })
    expect(out).toContain('Source: shopify')
    expect(out).toContain('2 products')
    expect(out).toContain('Forge Hammer')
    expect(out).toContain('$49.95')
    expect(out).toContain('-29%')
    expect(out).toContain('out of stock')
    expect(out).not.toContain('\x1b[')
  })

  it('respects maxRows', () => {
    const out = formatTable(SAMPLE, { useColor: false, maxRows: 1 })
    expect(out).toContain('Forge Hammer')
    expect(out).toContain('+1 more products')
  })
})

describe('formatJson', () => {
  it('returns valid JSON', () => {
    const out = formatJson(SAMPLE)
    const parsed = JSON.parse(out)
    expect(parsed.source).toBe('shopify')
    expect(parsed.products).toHaveLength(2)
  })
})

describe('formatMarkdown', () => {
  it('renders a table with header row', () => {
    const out = formatMarkdown(SAMPLE)
    expect(out).toContain('# Scrape report — X Store')
    expect(out).toContain('| # | Title | Price | Available | Imgs |')
    expect(out).toContain('| 1 | Forge Hammer | $49.95 | ✅ | 1 |')
    expect(out).toContain('| 2 | Anvil | $199.00 | ❌ | 0 |')
  })
})
