import { describe, expect, it } from 'vitest'

import { DataValidationError } from '../../errors.js'
import { alibaba1688Pdp, alibaba1688Shop } from '../../__tests__/fixtures/china.js'

import { Alibaba1688Adapter } from './index.js'

const PDP_URL = 'https://detail.1688.com/offer/1234567890.html'
const SHOP_URL = 'https://shop12345.1688.com/page/offerlist.htm'

function singleClient(html: string) {
  return { fetchHtml: async () => html }
}

function shopAwareClient(map: Record<string, string>) {
  return {
    fetchHtml: async (url: string) => {
      for (const key of Object.keys(map)) {
        if (url.includes(key)) return map[key]!
      }
      return ''
    },
  }
}

describe('Alibaba1688Adapter.canHandle', () => {
  const adapter = new Alibaba1688Adapter({ scraperApi: singleClient('') })

  it('matches detail.1688.com/offer/<id>.html', async () => {
    expect(await adapter.canHandle(PDP_URL)).toBe(true)
  })

  it('matches shop<id>.1688.com', async () => {
    expect(await adapter.canHandle(SHOP_URL)).toBe(true)
  })

  it('rejects other 1688 paths', async () => {
    expect(await adapter.canHandle('https://www.1688.com/category/foo')).toBe(false)
  })

  it('rejects non-1688 hosts', async () => {
    expect(await adapter.canHandle('https://aliexpress.com/item/1.html')).toBe(false)
  })
})

describe('Alibaba1688Adapter.scrape (PDP)', () => {
  it('extracts title, vendor, price (CNY) and images', async () => {
    const adapter = new Alibaba1688Adapter({ scraperApi: singleClient(alibaba1688Pdp) })
    const data = await adapter.scrape(PDP_URL, { mirrorImages: false })
    expect(data.source).toBe('alibaba_1688')
    expect(data.products).toHaveLength(1)
    const p = data.products[0]!
    expect(p.title).toBe('不锈钢锻造锤 厂家直供')
    expect(p.vendor).toBe('东莞锻造工坊')
    expect(p.priceFrom.amountCents).toBe(1250)
    expect(p.priceFrom.currency).toBe('CNY')
    expect(p.images.length).toBeGreaterThanOrEqual(2)
    expect(data.store.currency).toBe('CNY')
    expect(data.store.language).toBe('zh')
  })

  it('throws DataValidationError when title is missing', async () => {
    const adapter = new Alibaba1688Adapter({
      scraperApi: singleClient('<html><body></body></html>'),
    })
    await expect(adapter.scrape(PDP_URL, { mirrorImages: false })).rejects.toBeInstanceOf(
      DataValidationError,
    )
  })
})

describe('Alibaba1688Adapter.scrape (shop list)', () => {
  it('walks the shop list and parses each offer', async () => {
    const adapter = new Alibaba1688Adapter({
      scraperApi: shopAwareClient({
        '/page/offerlist.htm': alibaba1688Shop,
        '/offer/100000001.html': alibaba1688Pdp,
        '/offer/100000002.html': alibaba1688Pdp,
        '/offer/100000003.html': alibaba1688Pdp,
      }),
    })
    const data = await adapter.scrape(SHOP_URL, { mirrorImages: false, maxProducts: 3 })
    expect(data.products).toHaveLength(3)
    expect(data.meta?.['shopId']).toBe('12345')
  })

  it('throws DataValidationError when no offers parsed', async () => {
    const adapter = new Alibaba1688Adapter({
      scraperApi: shopAwareClient({ '/page/offerlist.htm': '<html></html>' }),
    })
    await expect(adapter.scrape(SHOP_URL, { mirrorImages: false })).rejects.toBeInstanceOf(
      DataValidationError,
    )
  })
})
