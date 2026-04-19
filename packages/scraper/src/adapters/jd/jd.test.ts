import { describe, expect, it } from 'vitest'

import { DataValidationError } from '../../errors.js'
import { jdPdp } from '../../__tests__/fixtures/china.js'

import { JdAdapter } from './index.js'

const JD_URL = 'https://item.jd.com/100012345678.html'

function client(html: string) {
  return { fetchHtml: async () => html }
}

describe('JdAdapter.canHandle', () => {
  const adapter = new JdAdapter({ scraperApi: client('') })
  it('matches /item.jd.com/<id>.html', async () => {
    expect(await adapter.canHandle(JD_URL)).toBe(true)
  })
  it('matches jd.hk regional host', async () => {
    expect(await adapter.canHandle('https://item.jd.hk/9999.html')).toBe(true)
  })
  it('rejects unrelated host', async () => {
    expect(await adapter.canHandle('https://taobao.com/item.htm?id=1')).toBe(false)
  })
})

describe('JdAdapter.scrape', () => {
  it('extracts product fields with og price meta', async () => {
    const adapter = new JdAdapter({ scraperApi: client(jdPdp) })
    const data = await adapter.scrape(JD_URL, { mirrorImages: false })
    expect(data.source).toBe('jd')
    const p = data.products[0]!
    expect(p.title).toBe('京东自营 — 不锈钢保温杯')
    expect(p.priceFrom.amountCents).toBe(12900)
    expect(p.priceFrom.currency).toBe('CNY')
    expect(p.vendor).toBe('京东自营官方旗舰店')
    expect(p.images.length).toBeGreaterThanOrEqual(2)
  })

  it('throws DataValidationError on empty page', async () => {
    const adapter = new JdAdapter({ scraperApi: client('<html></html>') })
    await expect(adapter.scrape(JD_URL, { mirrorImages: false })).rejects.toBeInstanceOf(
      DataValidationError,
    )
  })
})
