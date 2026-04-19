import { describe, expect, it } from 'vitest'

import { UnsupportedPlatformError } from './errors.js'
import { ScraperRegistry } from './registry.js'
import type {
  ScrapeOptions,
  ScrapedData,
  ScraperAdapter,
  SourcePlatform,
} from './types.js'

function makeStubAdapter(
  id: SourcePlatform,
  priority: number,
  matches: boolean,
  payload: Partial<ScrapedData> = {},
): ScraperAdapter {
  return {
    id,
    name: id,
    priority,
    canHandle: async () => matches,
    scrape: async (url: string, _options?: ScrapeOptions): Promise<ScrapedData> => ({
      source: id,
      sourceUrl: url,
      store: { name: 'stub', currency: 'USD', language: 'en', domain: 'stub' },
      products: [],
      collections: [],
      screenshots: {},
      scrapedAt: new Date(),
      confidence: 0.9,
      ...payload,
    }),
  }
}

describe('ScraperRegistry', () => {
  it('routes to the only matching adapter', async () => {
    const reg = new ScraperRegistry()
      .register(makeStubAdapter('shopify', 90, true))
      .register(makeStubAdapter('woocommerce', 80, false))
    const route = await reg.route('https://x.com')
    expect(route.adapter.id).toBe('shopify')
    expect(route.ambiguous).toBe(false)
  })

  it('breaks ties by descending priority', async () => {
    const reg = new ScraperRegistry()
      .register(makeStubAdapter('woocommerce', 70, true))
      .register(makeStubAdapter('shopify', 90, true))
    const route = await reg.route('https://x.com')
    expect(route.adapter.id).toBe('shopify')
    expect(route.ambiguous).toBe(true)
    expect(route.considered).toEqual(['shopify', 'woocommerce'])
  })

  it('uses the fallback adapter when none match', async () => {
    const fallback = makeStubAdapter('generic_ai', 1, false)
    const reg = new ScraperRegistry({ fallback }).register(
      makeStubAdapter('shopify', 90, false),
    )
    const route = await reg.route('https://x.com')
    expect(route.adapter.id).toBe('generic_ai')
  })

  it('throws UnsupportedPlatformError when nothing matches', async () => {
    const reg = new ScraperRegistry().register(makeStubAdapter('shopify', 90, false))
    await expect(reg.route('https://x.com')).rejects.toBeInstanceOf(UnsupportedPlatformError)
  })

  it('rejects duplicate registration', () => {
    const reg = new ScraperRegistry().register(makeStubAdapter('shopify', 90, true))
    expect(() => reg.register(makeStubAdapter('shopify', 80, true))).toThrow(
      /already registered/,
    )
  })

  it('annotates scrape() output with adapter metadata', async () => {
    const reg = new ScraperRegistry().register(makeStubAdapter('shopify', 90, true))
    const out = await reg.scrape('https://x.com')
    expect(out.meta).toMatchObject({
      adapter: 'shopify',
      ambiguous: false,
      considered: ['shopify'],
    })
  })

  it('treats canHandle errors as a non-match', async () => {
    const adapter: ScraperAdapter = {
      id: 'shopify',
      name: 'shopify',
      priority: 90,
      canHandle: async () => {
        throw new Error('boom')
      },
      scrape: async () => {
        throw new Error('should not be reached')
      },
    }
    const reg = new ScraperRegistry({
      fallback: makeStubAdapter('generic_ai', 1, false),
    }).register(adapter)
    const route = await reg.route('https://x.com')
    expect(route.adapter.id).toBe('generic_ai')
  })
})
