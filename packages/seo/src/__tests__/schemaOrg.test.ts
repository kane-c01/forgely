import { describe, expect, it } from 'vitest'
import {
  breadcrumbSchema,
  faqSchema,
  organizationSchema,
  productSchema,
  websiteSchema,
  type FaqPageMeta,
  type ProductPageMeta,
  type SiteMeta,
} from '../index.js'

const site: SiteMeta = {
  siteId: 'site_a',
  baseUrl: 'https://acme.com',
  brandName: 'Acme',
  brandLegalName: 'Acme, Inc.',
  brandLogo: '/logo.svg',
  defaultLocale: 'en',
  siteType: 'storefront',
  social: { twitter: '@acme', instagram: '@acme.shop' },
  organization: {
    legalName: 'Acme, Inc.',
    url: 'https://acme.com',
    email: 'hi@acme.com',
    address: {
      streetAddress: '1 Forge St',
      addressLocality: 'San Francisco',
      addressRegion: 'CA',
      postalCode: '94110',
      addressCountry: 'US',
    },
  },
}

describe('schema.org builders', () => {
  it('builds Organization with absolute logo + sameAs', () => {
    const org = organizationSchema(site)
    expect(org['@type']).toBe('Organization')
    expect(org.logo).toBe('https://acme.com/logo.svg')
    expect(org.sameAs).toContain('https://twitter.com/acme')
    expect(org.sameAs).toContain('https://instagram.com/acme.shop')
    expect(((org as Record<string, unknown>).address as { '@type': string })['@type']).toBe('PostalAddress')
  })

  it('builds WebSite with SearchAction', () => {
    const ws = websiteSchema(site)
    expect(ws['@type']).toBe('WebSite')
    expect((ws.potentialAction as { target: string }).target).toContain('search?q=')
  })

  it('builds Product schema with offer + reviews', () => {
    const page: ProductPageMeta = {
      path: '/products/shoe',
      title: 'Forge Runner',
      description: 'A runner for the trail.',
      product: {
        productId: 'p1',
        name: 'Forge Runner',
        description: 'A runner for the trail.',
        price: { amount: 129, currency: 'USD' },
        availability: 'InStock',
        images: ['/img/p1.jpg'],
        rating: { value: 4.8, count: 132 },
        reviews: [
          { author: 'Jane', rating: 5, body: 'Loved it', publishedAt: '2025-01-01' },
        ],
      },
    }
    const schema = productSchema(site, page)
    expect(schema['@type']).toBe('Product')
    expect(schema.image).toEqual(['https://acme.com/img/p1.jpg'])
    expect((schema.offers as { price: string }).price).toBe('129.00')
    expect((schema.aggregateRating as { ratingValue: number }).ratingValue).toBe(4.8)
    expect(Array.isArray(schema.review)).toBe(true)
  })

  it('builds FAQPage schema', () => {
    const page: FaqPageMeta = {
      path: '/faq',
      title: 'FAQ',
      description: 'Common questions',
      faqs: [
        { question: 'How long does shipping take?', answer: '3-5 business days.' },
        { question: 'Do you ship internationally?', answer: 'Yes, to 60+ countries.' },
      ],
    }
    const schema = faqSchema(page)
    expect(schema['@type']).toBe('FAQPage')
    expect(Array.isArray(schema.mainEntity)).toBe(true)
  })

  it('builds BreadcrumbList', () => {
    const schema = breadcrumbSchema(site, {
      items: [
        { name: 'Home', url: '/' },
        { name: 'Shoes', url: '/c/shoes' },
        { name: 'Forge Runner', url: '/products/shoe' },
      ],
    })
    expect(schema['@type']).toBe('BreadcrumbList')
    const items = schema.itemListElement as Array<{ position: number; item: string }>
    expect(items[0]?.position).toBe(1)
    expect(items[2]?.item).toBe('https://acme.com/products/shoe')
  })
})
