import { describe, expect, it } from 'vitest'

import { DataValidationError, UnauthorizedError } from '../errors.js'
import { InMemoryAssetStorage } from '../storage/memory.js'
import {
  shopifyCollections,
  shopifyMeta,
  shopifyProductsPage1,
  shopifyProductsPage2,
} from '../__tests__/fixtures/shopify.js'
import {
  createMockFetch,
  json,
  notFound,
  rawError,
  text,
} from '../__tests__/helpers/mock-fetch.js'

import { ShopifyAdapter } from './shopify.js'

const STORE = 'https://forgely-demo.myshopify.com'

function basicShopifyFetch(overrides: { products?: unknown[]; collections?: unknown; meta?: unknown } = {}) {
  return createMockFetch(
    [
      {
        match: (u) => u.startsWith(`${STORE}/products.json`),
        respond: (u) => {
          const url = new URL(u)
          const page = Number(url.searchParams.get('page') ?? '1')
          const pages = overrides.products ?? [shopifyProductsPage1, shopifyProductsPage2, { products: [] }]
          const body = pages[page - 1] ?? { products: [] }
          return json(body)
        },
      },
      {
        match: (u) => u.startsWith(`${STORE}/collections.json`),
        respond: () => json(overrides.collections ?? shopifyCollections),
      },
      {
        match: (u) => u === `${STORE}/meta.json`,
        respond: () => json(overrides.meta ?? shopifyMeta),
      },
    ],
    { unhandled: 'empty404' },
  )
}

describe('ShopifyAdapter.canHandle', () => {
  it('matches *.myshopify.com hosts without an HTTP probe', async () => {
    const adapter = new ShopifyAdapter({
      fetchImpl: () => {
        throw new Error('canHandle should not perform HTTP for myshopify hostnames')
      },
    })
    expect(await adapter.canHandle('https://acme.myshopify.com')).toBe(true)
    expect(await adapter.canHandle('https://acme.myshopify.com/products')).toBe(true)
  })

  it('matches custom domains by probing /products.json', async () => {
    const adapter = new ShopifyAdapter({
      fetchImpl: createMockFetch([
        {
          match: (u) => u.startsWith('https://example.com/products.json'),
          respond: () => json({ products: [] }),
        },
      ]),
    })
    expect(await adapter.canHandle('https://example.com')).toBe(true)
  })

  it('returns false when /products.json 404s', async () => {
    const adapter = new ShopifyAdapter({
      fetchImpl: createMockFetch([
        {
          match: (u) => u.startsWith('https://no-shop.com/products.json'),
          respond: () => notFound(),
        },
      ]),
    })
    expect(await adapter.canHandle('https://no-shop.com')).toBe(false)
  })

  it('returns false when probe returns invalid JSON shape', async () => {
    const adapter = new ShopifyAdapter({
      fetchImpl: createMockFetch([
        {
          match: (u) => u.startsWith('https://weird.com/products.json'),
          respond: () => text('<html>not shopify</html>'),
        },
      ]),
    })
    expect(await adapter.canHandle('https://weird.com')).toBe(false)
  })

  it('returns false when given a malformed URL', async () => {
    const adapter = new ShopifyAdapter({
      fetchImpl: () => {
        throw new Error('should not be called')
      },
    })
    expect(await adapter.canHandle('not-a-url')).toBe(false)
  })
})

describe('ShopifyAdapter.scrape', () => {
  it('walks pagination and stops on empty page', async () => {
    const adapter = new ShopifyAdapter({
      fetchImpl: basicShopifyFetch(),
      pageLimit: 2, // smaller limit so page 1 (2 items) → page 2 (1 item) → stop on undersized page
    })
    const data = await adapter.scrape(STORE, { skipScreenshots: true })
    expect(data.source).toBe('shopify')
    expect(data.products.map((p) => p.id)).toEqual(['1001', '1002', '1003'])
    expect(data.confidence).toBeGreaterThan(0.9)
  })

  it('respects maxProducts cap', async () => {
    const adapter = new ShopifyAdapter({ fetchImpl: basicShopifyFetch(), pageLimit: 2 })
    const data = await adapter.scrape(STORE, { skipScreenshots: true, maxProducts: 2 })
    expect(data.products).toHaveLength(2)
  })

  it('normalises prices into integer cents and lowest-price summary', async () => {
    const adapter = new ShopifyAdapter({ fetchImpl: basicShopifyFetch(), pageLimit: 250 })
    const data = await adapter.scrape(STORE, { skipScreenshots: true })
    const hammer = data.products.find((p) => p.handle === 'forge-hammer')!
    expect(hammer.priceFrom.amountCents).toBe(4995)
    expect(hammer.priceFrom.currency).toBe('USD')
    expect(hammer.variants[0]?.compareAtPrice?.amountCents).toBe(6995)

    const anvil = data.products.find((p) => p.handle === 'anvil')!
    expect(anvil.priceFrom.amountCents).toBe(19900)
    expect(anvil.available).toBe(true)
  })

  it('parses tags whether comma-separated string or array', async () => {
    const adapter = new ShopifyAdapter({ fetchImpl: basicShopifyFetch(), pageLimit: 250 })
    const data = await adapter.scrape(STORE, { skipScreenshots: true })
    const hammer = data.products.find((p) => p.handle === 'forge-hammer')!
    const anvil = data.products.find((p) => p.handle === 'anvil')!
    expect(hammer.tags).toEqual(['steel', 'premium', 'bestseller'])
    expect(anvil.tags).toEqual(['cast-iron', 'heavy'])
  })

  it('strips HTML from descriptions but preserves descriptionHtml', async () => {
    const adapter = new ShopifyAdapter({ fetchImpl: basicShopifyFetch(), pageLimit: 250 })
    const data = await adapter.scrape(STORE, { skipScreenshots: true })
    const hammer = data.products.find((p) => p.handle === 'forge-hammer')!
    expect(hammer.description).toBe('A heavy steel hammer.')
    expect(hammer.descriptionHtml).toContain('<strong>steel</strong>')
  })

  it('resolves protocol-relative image URLs against origin', async () => {
    const adapter = new ShopifyAdapter({ fetchImpl: basicShopifyFetch(), pageLimit: 250 })
    const data = await adapter.scrape(STORE, { skipScreenshots: true, mirrorImages: false })
    const anvil = data.products.find((p) => p.handle === 'anvil')!
    expect(anvil.images[0]?.url).toBe('https://cdn.shopify.com/anvil.jpg')
  })

  it('mirrors images into storage when provided', async () => {
    const storage = new InMemoryAssetStorage()
    const adapter = new ShopifyAdapter({
      fetchImpl: createMockFetch(
        [
          {
            match: (u) => u.startsWith(`${STORE}/products.json`),
            respond: () => json(shopifyProductsPage1),
          },
          {
            match: (u) => u.startsWith(`${STORE}/collections.json`),
            respond: () => json({ collections: [] }),
          },
          {
            match: (u) => u === `${STORE}/meta.json`,
            respond: () => json(shopifyMeta),
          },
          {
            match: (u) => u.startsWith('https://cdn.shopify.com/'),
            respond: () =>
              new Response(new Uint8Array([0x89, 0x50, 0x4e, 0x47]), {
                status: 200,
                headers: { 'content-type': 'image/png' },
              }),
          },
        ],
        { unhandled: 'empty404' },
      ),
      storage,
    })
    const data = await adapter.scrape(STORE, { skipScreenshots: true, siteId: 'site_xyz' })
    const image = data.products[0]?.images[0]
    expect(image?.storedUrl).toMatch(/^mem:\/\/forgely-scraper\/scrapes\/site_xyz\/shopify\//)
    expect(storage.size()).toBeGreaterThan(0)
  })

  it('loads collections', async () => {
    const adapter = new ShopifyAdapter({ fetchImpl: basicShopifyFetch(), pageLimit: 250 })
    const data = await adapter.scrape(STORE, { skipScreenshots: true, mirrorImages: false })
    expect(data.collections).toHaveLength(1)
    expect(data.collections[0]?.handle).toBe('forging')
    expect(data.collections[0]?.url).toBe(`${STORE}/collections/forging`)
  })

  it('reads currency and store name from /meta.json', async () => {
    const adapter = new ShopifyAdapter({ fetchImpl: basicShopifyFetch(), pageLimit: 250 })
    const data = await adapter.scrape(STORE, { skipScreenshots: true })
    expect(data.store.name).toBe('Forgely Demo Store')
    expect(data.store.currency).toBe('USD')
    expect(data.store.domain).toBe('forgely-demo.myshopify.com')
  })

  it('falls back to USD when meta.json is missing', async () => {
    const adapter = new ShopifyAdapter({
      fetchImpl: createMockFetch(
        [
          {
            match: (u) => u.startsWith(`${STORE}/products.json`),
            respond: () => json(shopifyProductsPage1),
          },
          {
            match: (u) => u.startsWith(`${STORE}/collections.json`),
            respond: () => json({ collections: [] }),
          },
          {
            match: (u) => u === `${STORE}/meta.json`,
            respond: () => notFound(),
          },
        ],
        { unhandled: 'empty404' },
      ),
    })
    const data = await adapter.scrape(STORE, { skipScreenshots: true, mirrorImages: false })
    expect(data.store.currency).toBe('USD')
  })

  it('throws UnauthorizedError on 401', async () => {
    const adapter = new ShopifyAdapter({
      fetchImpl: createMockFetch(
        [
          {
            match: (u) => u.startsWith(`${STORE}/products.json`),
            respond: () => rawError(401, '{"errors":"Locked"}'),
          },
        ],
        { unhandled: 'empty404' },
      ),
    })
    await expect(adapter.scrape(STORE, { skipScreenshots: true })).rejects.toBeInstanceOf(
      UnauthorizedError,
    )
  })

  it('throws DataValidationError on schema mismatch', async () => {
    const adapter = new ShopifyAdapter({
      fetchImpl: createMockFetch(
        [
          {
            match: (u) => u.startsWith(`${STORE}/products.json`),
            respond: () => json({ unexpected: true }),
          },
        ],
        { unhandled: 'empty404' },
      ),
    })
    await expect(adapter.scrape(STORE, { skipScreenshots: true })).rejects.toBeInstanceOf(
      DataValidationError,
    )
  })

  it('does not invoke browser when skipScreenshots is set', async () => {
    let browserCalled = false
    const adapter = new ShopifyAdapter({
      fetchImpl: basicShopifyFetch(),
      browser: {
        async screenshot() {
          browserCalled = true
          return { bytes: new Uint8Array(), contentType: 'image/png' as const }
        },
        async renderHtml() {
          browserCalled = true
          return { html: '', finalUrl: '' }
        },
      },
    })
    await adapter.scrape(STORE, { skipScreenshots: true })
    expect(browserCalled).toBe(false)
  })

  it('captures screenshots and stores them when browser + storage are wired', async () => {
    const storage = new InMemoryAssetStorage()
    const seen: string[] = []
    const adapter = new ShopifyAdapter({
      fetchImpl: basicShopifyFetch(),
      storage,
      browser: {
        async screenshot(url) {
          seen.push(url)
          return { bytes: new Uint8Array([1, 2, 3]), contentType: 'image/png' as const }
        },
        async renderHtml() {
          return { html: '', finalUrl: '' }
        },
      },
    })
    const data = await adapter.scrape(STORE, { siteId: 'site_xyz', mirrorImages: false })
    expect(seen).toContain(STORE)
    expect(data.screenshots.homepage).toMatch(/screenshot-homepage\.png$/)
    expect(data.screenshots.productPage).toMatch(/screenshot-productPage\.png$/)
    expect(data.screenshots.categoryPage).toMatch(/screenshot-categoryPage\.png$/)
  })
})
