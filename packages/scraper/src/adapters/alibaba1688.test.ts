import { describe, expect, it } from 'vitest'

import { DataValidationError } from '../errors.js'
import { alibaba1688Html } from '../__tests__/fixtures/china.js'

import { Alibaba1688Adapter } from './alibaba1688.js'

const URL_OFFER = 'https://detail.1688.com/offer/1234567890.html'

function client(html: string) {
  return { fetchHtml: async () => html }
}

describe('Alibaba1688Adapter.canHandle', () => {
  const adapter = new Alibaba1688Adapter({ scraperApi: client('') })
  it('matches detail.1688.com /offer/<id>.html', async () => {
    expect(await adapter.canHandle(URL_OFFER)).toBe(true)
  })
  it('rejects other 1688 paths', async () => {
    expect(await adapter.canHandle('https://www.1688.com/category/foo')).toBe(false)
  })
  it('rejects non-1688 hosts', async () => {
    expect(await adapter.canHandle('https://aliexpress.com/item/1.html')).toBe(false)
  })
})

describe('Alibaba1688Adapter.scrape', () => {
  it('extracts title, vendor, price (CNY) and images', async () => {
    const adapter = new Alibaba1688Adapter({ scraperApi: client(alibaba1688Html) })
    const data = await adapter.scrape(URL_OFFER, { mirrorImages: false })
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
    const adapter = new Alibaba1688Adapter({ scraperApi: client('<html><body></body></html>') })
    await expect(adapter.scrape(URL_OFFER, { mirrorImages: false })).rejects.toBeInstanceOf(
      DataValidationError,
    )
  })
})
