import { describe, expect, it } from 'vitest'
import { buildLlmsFullTxt, buildLlmsTxt, type FaqPageMeta, type PageMeta, type SiteMeta } from '../index.js'

const site: SiteMeta = {
  siteId: 'site_a',
  baseUrl: 'https://acme.com',
  brandName: 'Acme',
  brandDescription: 'AI-forged outdoor gear.',
  defaultLocale: 'en',
  siteType: 'storefront',
}

const pages: PageMeta[] = [
  { path: '/', title: 'Home', description: 'Home of Acme' },
  { path: '/about', title: 'About', description: 'Our story' },
  { path: '/products/shoe', title: 'Forge Runner', description: 'A trail runner.' },
  { path: '/products/hat', title: 'Forge Cap', description: 'A breathable cap.' },
  { path: '/blog/how-we-make', title: 'How we make', description: 'Inside the lab' },
  {
    path: '/faq',
    title: 'FAQ',
    description: 'Common questions',
    faqs: [{ question: 'Shipping?', answer: '3-5 days' }],
  } as FaqPageMeta,
]

describe('llms.txt', () => {
  it('emits sections grouped by path prefix', () => {
    const txt = buildLlmsTxt(site, pages)
    expect(txt).toContain('# Acme')
    expect(txt).toContain('## Top pages')
    expect(txt).toContain('## Products')
    expect(txt).toContain('## Blog')
    expect(txt).toContain('## FAQs')
    expect(txt).toContain('Forge Runner')
  })

  it('llms-full.txt includes product details and FAQ Q&A', () => {
    const productPages: PageMeta[] = [
      ...pages.slice(0, 2),
      {
        path: '/products/shoe',
        title: 'Forge Runner',
        description: 'A trail runner.',
        product: {
          productId: 'p1',
          name: 'Forge Runner',
          description: 'A trail runner crafted by AI.',
          price: { amount: 129, currency: 'USD' },
          availability: 'InStock',
          images: ['/img/p1.jpg'],
        },
      } as PageMeta,
      pages[5]!,
    ]
    const full = buildLlmsFullTxt(site, productPages)
    expect(full).toContain('Product: Forge Runner')
    expect(full).toContain('Q: Shipping?')
    expect(full).toContain('A: 3-5 days')
  })
})
