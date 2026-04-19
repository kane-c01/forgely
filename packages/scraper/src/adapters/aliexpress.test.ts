import { describe, expect, it } from 'vitest'

import {
  aliExpressItemHtml,
  aliExpressItemHtmlNoRunParams,
} from '../__tests__/fixtures/aliexpress.js'

import { AliExpressAdapter } from './aliexpress.js'

const URL_ITEM = 'https://www.aliexpress.com/item/1005001234567890.html'

function client(html: string) {
  return { fetchHtml: async () => html }
}

describe('AliExpressAdapter.canHandle', () => {
  const adapter = new AliExpressAdapter({ scraperApi: client('') })
  it('matches /item/<id>.html', async () => {
    expect(await adapter.canHandle(URL_ITEM)).toBe(true)
  })
  it('rejects host without /item path', async () => {
    expect(await adapter.canHandle('https://aliexpress.com')).toBe(false)
  })
})

describe('AliExpressAdapter.scrape', () => {
  it('uses runParams when present', async () => {
    const adapter = new AliExpressAdapter({ scraperApi: client(aliExpressItemHtml) })
    const data = await adapter.scrape(URL_ITEM, { mirrorImages: false })
    expect(data.products).toHaveLength(1)
    const p = data.products[0]!
    expect(p.title).toBe('Wireless Earbuds Pro')
    expect(p.priceFrom.amountCents).toBe(1999)
    expect(p.images).toHaveLength(2)
    expect(data.confidence).toBeGreaterThanOrEqual(0.78)
    expect(data.meta?.['structuredDataAvailable']).toBe(true)
  })

  it('falls back to DOM selectors when runParams missing', async () => {
    const adapter = new AliExpressAdapter({ scraperApi: client(aliExpressItemHtmlNoRunParams) })
    const data = await adapter.scrape(URL_ITEM, { mirrorImages: false })
    expect(data.products[0]?.title).toBe('Generic Item')
    expect(data.products[0]?.priceFrom.amountCents).toBe(999)
    expect(data.confidence).toBeLessThan(0.78)
  })
})
