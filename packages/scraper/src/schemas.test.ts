import { describe, expect, it } from 'vitest'

import { scrapedDataSchema, scrapedProductSchema } from './schemas.js'

const validProduct = {
  id: 'p1',
  handle: 'p-1',
  title: 'Hammer',
  description: 'Heavy',
  tags: ['tool'],
  images: [{ url: 'https://x.com/h.jpg' }],
  variants: [
    {
      id: 'v1',
      title: 'Default',
      price: { amountCents: 1000, currency: 'USD' },
      available: true,
    },
  ],
  priceFrom: { amountCents: 1000, currency: 'USD' },
  available: true,
  url: 'https://x.com/p/h',
}

describe('scrapedProductSchema', () => {
  it('accepts a fully-formed product', () => {
    const r = scrapedProductSchema.safeParse(validProduct)
    expect(r.success).toBe(true)
  })

  it('rejects a product missing required fields', () => {
    const r = scrapedProductSchema.safeParse({ ...validProduct, title: '' })
    expect(r.success).toBe(false)
  })

  it('uppercases currency codes', () => {
    const r = scrapedProductSchema.safeParse({
      ...validProduct,
      priceFrom: { amountCents: 100, currency: 'usd' },
    })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.priceFrom.currency).toBe('USD')
  })
})

describe('scrapedDataSchema', () => {
  it('accepts a complete payload', () => {
    const payload = {
      source: 'shopify' as const,
      sourceUrl: 'https://x.com',
      store: { name: 'X', currency: 'USD', language: 'en', domain: 'x.com' },
      products: [validProduct],
      collections: [],
      screenshots: {},
      scrapedAt: new Date(),
      confidence: 0.9,
    }
    const r = scrapedDataSchema.safeParse(payload)
    expect(r.success).toBe(true)
  })

  it('rejects out-of-range confidence', () => {
    const payload = {
      source: 'shopify' as const,
      sourceUrl: 'https://x.com',
      store: { name: 'X', currency: 'USD', language: 'en', domain: 'x.com' },
      products: [],
      collections: [],
      screenshots: {},
      scrapedAt: new Date(),
      confidence: 1.5,
    }
    expect(scrapedDataSchema.safeParse(payload).success).toBe(false)
  })
})
