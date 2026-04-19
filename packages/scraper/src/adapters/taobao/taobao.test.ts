import { describe, expect, it } from 'vitest'

import { BlockedError, DataValidationError } from '../../errors.js'
import { taobaoBlocked, taobaoPdp, tmallPdp } from '../../__tests__/fixtures/china.js'

import { TaobaoAdapter } from './index.js'

const TAOBAO_URL = 'https://item.taobao.com/item.htm?id=1234567890'
const TMALL_URL = 'https://detail.tmall.com/item.htm?id=9876543210'

function client(html: string) {
  return { fetchHtml: async () => html }
}

describe('TaobaoAdapter.canHandle', () => {
  const adapter = new TaobaoAdapter({ scraperApi: client('') })

  it('matches Taobao item.htm with id query', async () => {
    expect(await adapter.canHandle(TAOBAO_URL)).toBe(true)
  })
  it('matches Tmall detail.htm with id query', async () => {
    expect(await adapter.canHandle(TMALL_URL)).toBe(true)
  })
  it('rejects URL without id', async () => {
    expect(await adapter.canHandle('https://item.taobao.com/item.htm')).toBe(false)
  })
  it('rejects non-Alibaba host', async () => {
    expect(await adapter.canHandle('https://amazon.com/dp/B0')).toBe(false)
  })
})

describe('TaobaoAdapter.scrape', () => {
  it('parses a Taobao item page (CNY)', async () => {
    const adapter = new TaobaoAdapter({ scraperApi: client(taobaoPdp) })
    const data = await adapter.scrape(TAOBAO_URL, { mirrorImages: false })
    expect(data.source).toBe('taobao')
    const p = data.products[0]!
    expect(p.title).toBe('设计师手工陶瓷茶杯')
    expect(p.vendor).toBe('瓷韵清欢')
    expect(p.priceFrom.amountCents).toBe(9800)
    expect(p.priceFrom.currency).toBe('CNY')
    expect(data.meta?.['platform']).toBe('taobao')
  })

  it('marks Tmall pages with platform=tmall', async () => {
    const adapter = new TaobaoAdapter({ scraperApi: client(tmallPdp) })
    const data = await adapter.scrape(TMALL_URL, { mirrorImages: false })
    expect(data.meta?.['platform']).toBe('tmall')
    expect(data.products[0]?.priceFrom.amountCents).toBe(29900)
  })

  it('throws BlockedError on captcha/slider page', async () => {
    const adapter = new TaobaoAdapter({ scraperApi: client(taobaoBlocked) })
    await expect(adapter.scrape(TAOBAO_URL, { mirrorImages: false })).rejects.toBeInstanceOf(
      BlockedError,
    )
  })

  it('throws DataValidationError on empty page', async () => {
    const adapter = new TaobaoAdapter({ scraperApi: client('<html></html>') })
    await expect(adapter.scrape(TAOBAO_URL, { mirrorImages: false })).rejects.toBeInstanceOf(
      DataValidationError,
    )
  })
})
