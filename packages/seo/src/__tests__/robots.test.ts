import { describe, expect, it } from 'vitest'
import { buildRobots, type SiteMeta } from '../index.js'

const site: SiteMeta = {
  siteId: 'site_a',
  baseUrl: 'https://acme.com',
  brandName: 'Acme',
  defaultLocale: 'en',
  siteType: 'storefront',
}

describe('robots.txt', () => {
  it('emits default allow + sitemap line', () => {
    const txt = buildRobots(site)
    expect(txt).toContain('User-agent: *')
    expect(txt).toContain('Allow: /')
    expect(txt).toContain('Disallow: /admin/')
    expect(txt).toContain('Sitemap: https://acme.com/sitemap.xml')
  })

  it('blocks AI crawlers when policy is block-all', () => {
    const txt = buildRobots(site, { aiPolicy: 'block-all' })
    expect(txt).toContain('User-agent: GPTBot')
    expect(txt).toContain('User-agent: anthropic-ai')
  })

  it('respects custom rules and extra disallow', () => {
    const txt = buildRobots(site, { extraDisallow: ['/checkout/'] })
    expect(txt).toContain('Disallow: /checkout/')
  })
})
