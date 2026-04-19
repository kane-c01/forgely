import { describe, expect, it } from 'vitest'
import { buildSitemap, renderSitemap, type PageMeta, type SiteMeta } from '../index.js'

const site: SiteMeta = {
  siteId: 'site_a',
  baseUrl: 'https://acme.com',
  brandName: 'Acme',
  defaultLocale: 'en',
  siteType: 'storefront',
}

describe('sitemap', () => {
  it('renders basic urls', () => {
    const xml = renderSitemap([
      { loc: 'https://acme.com/', priority: 1 },
      { loc: 'https://acme.com/about', priority: 0.6, changefreq: 'monthly' },
    ])
    expect(xml).toContain('<?xml version="1.0"')
    expect(xml).toContain('<loc>https://acme.com/</loc>')
    expect(xml).toContain('<priority>1.0</priority>')
    expect(xml).toContain('<priority>0.6</priority>')
    expect(xml).toContain('<changefreq>monthly</changefreq>')
  })

  it('escapes XML special chars', () => {
    const xml = renderSitemap([{ loc: 'https://acme.com/?q=a&b=<>"' }])
    expect(xml).toContain('https://acme.com/?q=a&amp;b=&lt;&gt;&quot;')
  })

  it('skips noindex pages', () => {
    const pages: PageMeta[] = [
      { path: '/', title: 'Home', description: 'desc' },
      { path: '/secret', title: 'Secret', description: 'desc', noindex: true },
    ]
    const files = buildSitemap(site, pages)
    expect(files[0]?.content).toContain('https://acme.com/')
    expect(files[0]?.content).not.toContain('https://acme.com/secret')
  })

  it('emits xhtml:link for hreflang alternates', () => {
    const pages: PageMeta[] = [
      {
        path: '/',
        title: 'Home',
        description: 'desc',
        alternates: { en: '/', de: '/de', fr: '/fr' },
      },
    ]
    const files = buildSitemap(site, pages)
    expect(files[0]?.content).toContain('xhtml:link')
    expect(files[0]?.content).toContain('hreflang="de"')
  })
})
