import { describe, expect, it } from 'vitest'

import { ScraperError } from '../errors.js'
import { InMemoryAssetStorage } from '../storage/memory.js'
import {
  wcHomepageHtml,
  wcShopHtml,
  wcStorefrontCategories,
  wcStorefrontProducts,
} from '../__tests__/fixtures/woocommerce.js'
import {
  createMockFetch,
  json,
  notFound,
  text,
} from '../__tests__/helpers/mock-fetch.js'

import { WooCommerceAdapter } from './woocommerce.js'

const ORIGIN = 'https://woo.example.com'

function storefrontFetch() {
  return createMockFetch(
    [
      {
        match: (u) => u.startsWith(`${ORIGIN}/wp-json/wc/store/v1/products?`),
        respond: (u) => {
          const url = new URL(u)
          const page = Number(url.searchParams.get('page') ?? '1')
          if (page > 1) return json([])
          return json(wcStorefrontProducts)
        },
      },
      {
        match: (u) => u.startsWith(`${ORIGIN}/wp-json/wc/store/v1/products/categories`),
        respond: () => json(wcStorefrontCategories),
      },
      {
        match: (u) => u === `${ORIGIN}/`,
        respond: () => text(wcHomepageHtml),
      },
      {
        match: (u) => u.startsWith(`${ORIGIN}/images/`),
        respond: () =>
          new Response(new Uint8Array([1, 2, 3, 4]), {
            status: 200,
            headers: { 'content-type': 'image/jpeg' },
          }),
      },
    ],
    { unhandled: 'empty404' },
  )
}

describe('WooCommerceAdapter.canHandle', () => {
  it('matches when storefront API answers', async () => {
    const adapter = new WooCommerceAdapter({ fetchImpl: storefrontFetch() })
    expect(await adapter.canHandle(ORIGIN)).toBe(true)
  })

  it('falls back to HTML probe when storefront 404s', async () => {
    const adapter = new WooCommerceAdapter({
      fetchImpl: createMockFetch(
        [
          {
            match: (u) => u.startsWith(`${ORIGIN}/wp-json/wc/store/v1/products`),
            respond: () => notFound(),
          },
          {
            match: (u) => u === `${ORIGIN}/`,
            respond: () => text(wcShopHtml),
          },
        ],
        { unhandled: 'empty404' },
      ),
    })
    expect(await adapter.canHandle(ORIGIN)).toBe(true)
  })

  it('returns false when neither probe matches', async () => {
    const adapter = new WooCommerceAdapter({
      fetchImpl: createMockFetch(
        [
          {
            match: (u) => u.startsWith(`${ORIGIN}/wp-json/wc/store/v1/products`),
            respond: () => notFound(),
          },
          {
            match: (u) => u === `${ORIGIN}/`,
            respond: () => text('<html>plain site</html>'),
          },
        ],
        { unhandled: 'empty404' },
      ),
    })
    expect(await adapter.canHandle(ORIGIN)).toBe(false)
  })
})

describe('WooCommerceAdapter.scrape (Storefront REST)', () => {
  it('normalises Storefront REST products', async () => {
    const adapter = new WooCommerceAdapter({ fetchImpl: storefrontFetch() })
    const data = await adapter.scrape(ORIGIN, { skipScreenshots: true, mirrorImages: false })
    expect(data.source).toBe('woocommerce')
    expect(data.meta?.['strategy']).toBe('storefront-api')
    expect(data.products).toHaveLength(2)
    const hoodie = data.products[0]!
    expect(hoodie.handle).toBe('hoodie')
    expect(hoodie.priceFrom.amountCents).toBe(4500)
    expect(hoodie.priceFrom.currency).toBe('USD')
    expect(hoodie.variants[0]?.compareAtPrice?.amountCents).toBe(5000)
    expect(data.products[1]?.available).toBe(false)
    expect(data.collections[0]?.handle).toBe('clothing')
  })

  it('mirrors images to storage', async () => {
    const storage = new InMemoryAssetStorage()
    const adapter = new WooCommerceAdapter({ fetchImpl: storefrontFetch(), storage })
    const data = await adapter.scrape(ORIGIN, { skipScreenshots: true, siteId: 'site_x' })
    const hoodie = data.products[0]!
    expect(hoodie.images[0]?.storedUrl).toMatch(/site_x\/woocommerce\//)
  })

  it('respects maxProducts', async () => {
    const adapter = new WooCommerceAdapter({ fetchImpl: storefrontFetch() })
    const data = await adapter.scrape(ORIGIN, {
      skipScreenshots: true,
      mirrorImages: false,
      maxProducts: 1,
    })
    expect(data.products).toHaveLength(1)
  })
})

describe('WooCommerceAdapter.scrape (HTML fallback)', () => {
  it('falls back to /shop scraping when storefront fails', async () => {
    const fetchImpl = createMockFetch(
      [
        {
          match: (u) => u.startsWith(`${ORIGIN}/wp-json/wc/store/v1/products?`),
          respond: () => new Response('boom', { status: 503 }),
        },
        {
          match: (u) => u === `${ORIGIN}/shop/`,
          respond: () => text(wcShopHtml),
        },
        {
          match: (u) => u === `${ORIGIN}/`,
          respond: () => text(wcHomepageHtml),
        },
      ],
      { unhandled: 'empty404' },
    )
    const adapter = new WooCommerceAdapter({ fetchImpl })
    const data = await adapter.scrape(ORIGIN, { skipScreenshots: true, mirrorImages: false })
    expect(data.meta?.['strategy']).toBe('html-shop')
    expect(data.products.length).toBeGreaterThan(0)
    expect(data.confidence).toBeLessThan(0.8)
    expect(data.products[0]?.title).toBe('Hoodie')
    expect(data.products[1]?.url).toBe(`${ORIGIN}/product/t-shirt/`)
  })

  it('throws when all strategies fail', async () => {
    const fetchImpl = createMockFetch(
      [
        {
          match: (u) => u.startsWith(`${ORIGIN}/wp-json/wc/store/v1/products?`),
          respond: () => new Response('nope', { status: 503 }),
        },
        {
          match: (u) => u === `${ORIGIN}/shop/`,
          respond: () => notFound(),
        },
      ],
      { unhandled: 'empty404' },
    )
    const adapter = new WooCommerceAdapter({ fetchImpl })
    await expect(
      adapter.scrape(ORIGIN, { skipScreenshots: true }),
    ).rejects.toBeInstanceOf(ScraperError)
  })
})
