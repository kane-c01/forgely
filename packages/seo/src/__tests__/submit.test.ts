import { describe, expect, it, vi } from 'vitest'
import { submitSitemap, type SiteMeta } from '../index.js'

const site: SiteMeta = {
  siteId: 'site_a',
  baseUrl: 'https://acme.com',
  brandName: 'Acme',
  defaultLocale: 'en',
  siteType: 'storefront',
}

describe('submitSitemap', () => {
  it('skips Google + Bing without legacy ping (deprecated)', async () => {
    const fetcher = vi.fn()
    const r = await submitSitemap(site, { engines: ['google', 'bing'], fetcher: fetcher as never })
    expect(r).toHaveLength(2)
    expect(r.every((x) => x.status === 'skipped')).toBe(true)
    expect(fetcher).not.toHaveBeenCalled()
  })

  it('skips Baidu when no token is provided', async () => {
    const fetcher = vi.fn()
    const r = await submitSitemap(site, { engines: ['baidu'], fetcher: fetcher as never })
    expect(r[0]?.engine).toBe('baidu')
    expect(r[0]?.status).toBe('skipped')
    expect(fetcher).not.toHaveBeenCalled()
  })

  it('submits to Baidu when token is set', async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response('{"success":1}', { status: 200 }))
    const r = await submitSitemap(site, {
      engines: ['baidu'],
      fetcher: fetcher as never,
      baiduToken: 'TKN123',
    })
    expect(fetcher).toHaveBeenCalledTimes(1)
    expect(r[0]?.status).toBe('ok')
    const url = (fetcher.mock.calls[0]?.[0] as string) ?? ''
    expect(url).toContain('token=TKN123')
    expect(url).toContain('site=https')
  })

  it('returns failed (not throws) on network error', async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error('network down'))
    const r = await submitSitemap(site, {
      engines: ['baidu'],
      fetcher: fetcher as never,
      baiduToken: 'X',
    })
    expect(r[0]?.status).toBe('failed')
    expect(r[0]?.message).toMatch(/network down/)
  })

  it('legacy ping hits Google + Bing endpoints', async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response('OK', { status: 200 }))
    const r = await submitSitemap(site, {
      engines: ['google', 'bing'],
      fetcher: fetcher as never,
      legacyPing: true,
    })
    expect(fetcher).toHaveBeenCalledTimes(2)
    expect(r.map((x) => x.status)).toEqual(['ok', 'ok'])
    expect((fetcher.mock.calls[0]?.[0] as string) ?? '').toContain('google.com/ping')
    expect((fetcher.mock.calls[1]?.[0] as string) ?? '').toContain('bing.com/ping')
  })
})
