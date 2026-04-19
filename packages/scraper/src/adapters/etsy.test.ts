import { describe, expect, it } from 'vitest'

import { etsyListingHtml, etsyShopHtml } from '../__tests__/fixtures/etsy.js'

import { EtsyAdapter } from './etsy.js'

const LISTING_URL = 'https://www.etsy.com/listing/1234567890/handmade-mug'
const SHOP_URL = 'https://www.etsy.com/shop/clayworks'

function client(html: string) {
  return { fetchHtml: async () => html }
}

describe('EtsyAdapter.canHandle', () => {
  const adapter = new EtsyAdapter({ scraperApi: client('') })
  it('matches listing URL', async () => {
    expect(await adapter.canHandle(LISTING_URL)).toBe(true)
  })
  it('matches shop URL', async () => {
    expect(await adapter.canHandle(SHOP_URL)).toBe(true)
  })
  it('rejects unrelated path', async () => {
    expect(await adapter.canHandle('https://www.etsy.com/seller-handbook')).toBe(false)
  })
})

describe('EtsyAdapter.scrape', () => {
  it('parses a listing page', async () => {
    const adapter = new EtsyAdapter({ scraperApi: client(etsyListingHtml) })
    const data = await adapter.scrape(LISTING_URL, { mirrorImages: false })
    expect(data.products).toHaveLength(1)
    const p = data.products[0]!
    expect(p.title).toBe('Hand-thrown Ceramic Mug')
    expect(p.priceFrom.amountCents).toBe(4800)
    expect(p.priceFrom.currency).toBe('USD')
    expect(p.vendor).toBe('Clayworks Studio')
    expect(p.images.length).toBeGreaterThan(0)
    expect(data.confidence).toBeGreaterThan(0.8)
  })

  it('parses a shop page list', async () => {
    const adapter = new EtsyAdapter({ scraperApi: client(etsyShopHtml) })
    const data = await adapter.scrape(SHOP_URL, { mirrorImages: false })
    expect(data.products.length).toBeGreaterThanOrEqual(3)
    const ids = new Set(data.products.map((p) => p.id))
    expect(ids.has('111111111')).toBe(true)
    expect(ids.has('222222222')).toBe(true)
    expect(ids.has('333333333')).toBe(true)
  })
})
