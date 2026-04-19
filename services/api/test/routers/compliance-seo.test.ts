/**
 * compliance + seo router smoke tests.
 *
 * Calls the routers directly (no HTTP layer) using a stub context so
 * we don't need a database — both routers are intentionally pure /
 * stateless apart from optional LLM enhancement.
 */

import { describe, expect, it } from 'vitest'

import { complianceRouter } from '../../src/router/compliance.js'
import { seoRouter } from '../../src/router/seo.js'

const ctx: Record<string, unknown> = {
  user: { id: 'u1', role: 'user' },
  session: { id: 's1', userId: 'u1' },
  request: new Request('http://localhost/api/trpc'),
}

describe('compliance router', () => {
  it('check returns a structured ComplianceReport', async () => {
    const caller = complianceRouter.createCaller(ctx as never)
    const report = await caller.check({
      content: {
        siteId: 'site_1',
        regions: ['US-FDA', 'GLOBAL'],
        category: 'supplements',
        items: [
          {
            path: 'product.daily.description',
            type: 'product-description',
            text: 'Cures cancer in 7 days. 100% safe.',
          },
        ],
      },
    })
    expect(report.overall).toBe('fail')
    expect(report.findings.length).toBeGreaterThan(0)
    expect(report.findings.some((f) => f.rule.startsWith('us-fda.'))).toBe(true)
  })

  it('scan is the same as check minus LLM enhancement', async () => {
    const caller = complianceRouter.createCaller(ctx as never)
    const report = await caller.scan({
      content: {
        siteId: 's',
        regions: ['UK-ASA'],
        category: 'general',
        items: [{ path: 'p.1.headline', type: 'hero-headline', text: 'Eco-friendly bottle.' }],
      },
    })
    expect(report.findings.some((f) => f.rule === 'uk-asa.green-claim.unspecified')).toBe(true)
  })

  it('gate blocks when there are critical findings', async () => {
    const caller = complianceRouter.createCaller(ctx as never)
    const gate = await caller.gate({
      content: {
        siteId: 's',
        regions: ['US-FDA', 'GLOBAL'],
        category: 'supplements',
        items: [
          { path: 'p.1.desc', type: 'product-description', text: 'Treats arthritis instantly.' },
        ],
      },
    })
    expect(gate.allow).toBe(false)
    expect(gate.reason).toMatch(/critical/i)
  })
})

describe('seo router', () => {
  const site = {
    siteId: 'site_1',
    baseUrl: 'https://acme.com',
    brandName: 'Acme',
    defaultLocale: 'en',
    siteType: 'storefront' as const,
  }

  it('scorePage returns a numeric score and grade', async () => {
    const caller = seoRouter.createCaller(ctx as never)
    const r = await caller.scorePage({
      site,
      page: {
        path: '/products/x',
        title: 'Acme Widget — A high-performance gadget',
        description: 'A long-enough description that beats the 70 char minimum easily.',
        h1: 'Acme Widget',
        bodyText: 'A'.repeat(500),
        ogImage: '/og/x.jpg',
        keywords: ['widget'],
        internalLinks: 4,
        schema: [{ '@context': 'https://schema.org', '@type': 'Product' }],
      },
    })
    expect(r.score).toBeGreaterThanOrEqual(0)
    expect(r.score).toBeLessThanOrEqual(100)
    expect(['A', 'B', 'C', 'D', 'F']).toContain(r.grade)
  })

  it('generateArtefacts returns sitemap + robots + llms.txt', async () => {
    const caller = seoRouter.createCaller(ctx as never)
    const r = await caller.generateArtefacts({
      site,
      pages: [
        { path: '/', title: 'Home', description: 'Home page' },
        { path: '/about', title: 'About', description: 'About us' },
      ],
    })
    expect(r.sitemap[0]?.content).toContain('https://acme.com/')
    expect(r.robotsTxt).toContain('Sitemap: https://acme.com/sitemap.xml')
    expect(r.llmsTxt).toContain('# Acme')
    expect(r.llmsFullTxt).toContain('Home page')
  })

  it('researchKeyword returns demo data without env vars', async () => {
    const caller = seoRouter.createCaller(ctx as never)
    const r = await caller.researchKeyword({ keyword: 'trail runner' })
    expect(r.keyword).toBe('trail runner')
    expect(r.ideas.length).toBeGreaterThan(0)
  })
})
