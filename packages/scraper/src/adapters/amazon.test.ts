import { describe, expect, it } from 'vitest'

import { DataValidationError } from '../errors.js'
import { InMemoryAssetStorage } from '../storage/memory.js'
import { amazonProductHtml } from '../__tests__/fixtures/amazon.js'

import { AmazonAdapter } from './amazon.js'

const URL_DP = 'https://www.amazon.com/dp/B0FORGE001'

function client(html: string): { fetchHtml: () => Promise<string> } {
  return { fetchHtml: async () => html }
}

describe('AmazonAdapter.canHandle', () => {
  const adapter = new AmazonAdapter({ scraperApi: client('') })
  it('matches amazon.com /dp/ASIN', async () => {
    expect(await adapter.canHandle(URL_DP)).toBe(true)
  })
  it('matches gp/product variant', async () => {
    expect(await adapter.canHandle('https://www.amazon.de/gp/product/B0FORGE002/')).toBe(true)
  })
  it('rejects amazon homepage', async () => {
    expect(await adapter.canHandle('https://www.amazon.com')).toBe(false)
  })
  it('rejects unrelated host', async () => {
    expect(await adapter.canHandle('https://walmart.com/ip/12345')).toBe(false)
  })
})

describe('AmazonAdapter.scrape', () => {
  it('extracts product fields from a Storefront-rendered HTML', async () => {
    const storage = new InMemoryAssetStorage()
    const adapter = new AmazonAdapter({
      scraperApi: client(amazonProductHtml),
      storage,
      fetchImpl: async () =>
        new Response(new Uint8Array([1, 2, 3]), {
          status: 200,
          headers: { 'content-type': 'image/jpeg' },
        }),
    })
    const data = await adapter.scrape(URL_DP, { siteId: 'site_z' })
    expect(data.source).toBe('amazon')
    expect(data.products).toHaveLength(1)
    const p = data.products[0]!
    expect(p.id).toBe('B0FORGE001')
    expect(p.title).toBe('Forge Apron')
    expect(p.priceFrom.amountCents).toBe(3999)
    expect(p.priceFrom.currency).toBe('USD')
    expect(p.variants[0]?.compareAtPrice?.amountCents).toBe(5999)
    expect(p.rating).toBeCloseTo(4.7)
    expect(p.reviewCount).toBe(1234)
    expect(p.images.length).toBeGreaterThanOrEqual(2)
    expect(p.images[0]?.storedUrl).toMatch(/site_z\/amazon\//)
  })

  it('uses correct currency for amazon.de', async () => {
    const adapter = new AmazonAdapter({ scraperApi: client(amazonProductHtml) })
    const data = await adapter.scrape('https://www.amazon.de/dp/B0FORGE001', { mirrorImages: false })
    expect(data.products[0]?.priceFrom.currency).toBe('EUR')
  })

  it('throws DataValidationError when title is missing', async () => {
    const adapter = new AmazonAdapter({ scraperApi: client('<html><body></body></html>') })
    await expect(adapter.scrape(URL_DP, { mirrorImages: false })).rejects.toBeInstanceOf(
      DataValidationError,
    )
  })
})
