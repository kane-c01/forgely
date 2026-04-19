import { describe, expect, it } from 'vitest'
import { buildMeta, renderMetaHtml, type PageMeta, type SiteMeta } from '../index.js'

const site: SiteMeta = {
  siteId: 'site_a',
  baseUrl: 'https://acme.com',
  brandName: 'Acme',
  defaultLocale: 'en',
  siteType: 'storefront',
  social: { twitter: '@acme' },
}

describe('meta builder', () => {
  it('emits canonical / OG / Twitter / robots', () => {
    const page: PageMeta = {
      path: '/products/shoe',
      title: 'Forge Runner — Trail-ready shoe',
      description: 'A trail runner with cushioning, made for long miles.',
      ogImage: '/og/shoe.png',
    }
    const set = buildMeta(site, page)
    expect(set.canonical).toBe('https://acme.com/products/shoe')
    const propMap = new Map(set.meta.filter((m) => m.property).map((m) => [m.property!, m.content]))
    expect(propMap.get('og:title')).toBe(page.title)
    expect(propMap.get('og:image')).toBe('https://acme.com/og/shoe.png')
    const nameMap = new Map(set.meta.filter((m) => m.name).map((m) => [m.name!, m.content]))
    expect(nameMap.get('twitter:card')).toBe('summary_large_image')
    expect(nameMap.get('twitter:site')).toBe('@acme')
    expect(nameMap.get('robots')).toContain('index, follow')
  })

  it('honors noindex', () => {
    const page: PageMeta = { path: '/draft', title: 'Draft', description: 'desc', noindex: true }
    const set = buildMeta(site, page)
    const robots = set.meta.find((m) => m.name === 'robots')
    expect(robots?.content).toBe('noindex, nofollow')
  })

  it('renders raw HTML correctly', () => {
    const page: PageMeta = { path: '/', title: 'Home', description: 'A great brand.' }
    const html = renderMetaHtml(buildMeta(site, page))
    expect(html).toContain('<title>Home</title>')
    expect(html).toContain('<link rel="canonical"')
    expect(html).toContain('application/ld+json')
  })

  it('truncates long titles and descriptions', () => {
    const longTitle = 'A'.repeat(120)
    const longDesc = 'B'.repeat(300)
    const set = buildMeta(site, { path: '/', title: longTitle, description: longDesc })
    expect(set.title.length).toBeLessThanOrEqual(60)
    expect(set.description.length).toBeLessThanOrEqual(160)
  })

  it('emits hreflang alternates', () => {
    const page: PageMeta = {
      path: '/',
      title: 'Home',
      description: 'desc',
      alternates: { en: '/', de: '/de' },
    }
    const set = buildMeta(site, page)
    expect(set.alternates.find((a) => a.hreflang === 'de')?.href).toBe('https://acme.com/de')
    expect(set.alternates.some((a) => a.hreflang === 'x-default')).toBe(true)
  })
})
