import { describe, expect, it } from 'vitest'

import { DataValidationError } from '../../errors.js'
import { pddPdpHtml, pddPdpRaw } from '../../__tests__/fixtures/china.js'

import { PinduoduoAdapter } from './index.js'

const URL_RAW = 'https://mobile.yangkeduo.com/goods.html?goods_id=99999'
const URL_HTML = 'https://yangkeduo.com/goods.html?goods_id=10001'

function client(html: string) {
  return { fetchHtml: async () => html }
}

describe('PinduoduoAdapter.canHandle', () => {
  const adapter = new PinduoduoAdapter({ scraperApi: client('') })

  it('matches yangkeduo /goods.html?goods_id=', async () => {
    expect(await adapter.canHandle(URL_RAW)).toBe(true)
  })

  it('rejects /goods.html with no id', async () => {
    expect(await adapter.canHandle('https://yangkeduo.com/goods.html')).toBe(false)
  })

  it('rejects unrelated host', async () => {
    expect(await adapter.canHandle('https://taobao.com/item.htm?id=1')).toBe(false)
  })
})

describe('PinduoduoAdapter.scrape', () => {
  it('uses window.rawData when present (preferred path)', async () => {
    const adapter = new PinduoduoAdapter({ scraperApi: client(pddPdpRaw) })
    const data = await adapter.scrape(URL_RAW, { mirrorImages: false })
    expect(data.source).toBe('pinduoduo')
    expect(data.meta?.['structuredDataAvailable']).toBe(true)
    const p = data.products[0]!
    expect(p.title).toBe('无线蓝牙耳机')
    expect(p.priceFrom.amountCents).toBe(4990)
    expect(p.priceFrom.currency).toBe('CNY')
    expect(p.vendor).toBe('PDD旗舰店')
    expect(p.images).toHaveLength(2)
    expect(data.confidence).toBeGreaterThanOrEqual(0.7)
  })

  it('falls back to DOM selectors when rawData missing', async () => {
    const adapter = new PinduoduoAdapter({ scraperApi: client(pddPdpHtml) })
    const data = await adapter.scrape(URL_HTML, { mirrorImages: false })
    expect(data.meta?.['structuredDataAvailable']).toBe(false)
    const p = data.products[0]!
    expect(p.title).toBe('拼多多手机壳')
    expect(p.priceFrom.amountCents).toBe(1990)
    expect(p.vendor).toBe('手机壳工厂店')
  })

  it('throws DataValidationError on completely empty page', async () => {
    const adapter = new PinduoduoAdapter({ scraperApi: client('<html></html>') })
    await expect(adapter.scrape(URL_RAW, { mirrorImages: false })).rejects.toBeInstanceOf(
      DataValidationError,
    )
  })
})
