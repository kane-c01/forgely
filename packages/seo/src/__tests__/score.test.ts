import { describe, expect, it } from 'vitest'
import { scorePage, type PageMeta, type SiteMeta } from '../index.js'

const site: SiteMeta = {
  siteId: 'site_a',
  baseUrl: 'https://acme.com',
  brandName: 'Acme',
  defaultLocale: 'en',
  siteType: 'storefront',
}

describe('scorePage', () => {
  it('returns A grade for well-optimized page', () => {
    const page: PageMeta = {
      path: '/products/shoe',
      title: 'Forge Runner — A trail-ready shoe by Acme',
      description:
        'Built for long miles, the Forge Runner pairs cushioned EVA with a recycled mesh upper. Designed for ultra runners by Acme.',
      h1: 'Forge Runner — Trail-ready shoe',
      bodyText: 'A'.repeat(800),
      ogImage: '/og/shoe.png',
      keywords: ['trail runner'],
      internalLinks: 5,
      schema: [
        { '@context': 'https://schema.org', '@type': 'Product' },
      ],
    }
    const score = scorePage(site, page)
    expect(score.score).toBeGreaterThanOrEqual(85)
    expect(['A', 'B']).toContain(score.grade)
  })

  it('detects missing schema and short content', () => {
    const page: PageMeta = {
      path: '/products/shoe',
      title: 'Shoe',
      description: 'Buy shoe',
      bodyText: 'tiny',
    }
    const score = scorePage(site, page)
    expect(score.recommendations.length).toBeGreaterThan(0)
    expect(score.recommendations.some((c) => c.id === 'schema.missing')).toBe(true)
    expect(score.recommendations.some((c) => c.id === 'body.too-short')).toBe(true)
  })

  it('flags missing hreflang for multilingual sites', () => {
    const page: PageMeta = {
      path: '/',
      title: 'Home — Acme',
      description: 'A great long enough description for the home page of Acme.',
      h1: 'Welcome to Acme',
      bodyText: 'B'.repeat(500),
      schema: [{ '@context': 'https://schema.org', '@type': 'Organization' }],
      ogImage: '/og.png',
    }
    const score = scorePage(site, page, { multilingual: true })
    expect(score.recommendations.some((c) => c.id === 'hreflang.missing')).toBe(true)
  })
})
