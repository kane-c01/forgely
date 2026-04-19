import { describe, expect, it } from 'vitest'

import { ScraperError, UnauthorizedError } from '../errors.js'
import type { ScrapedData } from '../types.js'

import { runCli } from './index.js'

const fixtureData: ScrapedData = {
  source: 'shopify',
  sourceUrl: 'https://x.myshopify.com',
  store: { name: 'X Store', currency: 'USD', language: 'en', domain: 'x.myshopify.com' },
  products: [
    {
      id: '1',
      handle: 'h',
      title: 'Hammer',
      description: '',
      tags: [],
      images: [],
      variants: [
        {
          id: 'v1',
          title: 'Default',
          price: { amountCents: 100, currency: 'USD' },
          available: true,
        },
      ],
      priceFrom: { amountCents: 100, currency: 'USD' },
      available: true,
      url: 'https://x.myshopify.com/p/h',
    },
  ],
  collections: [],
  screenshots: {},
  scrapedAt: new Date('2026-04-19T18:00:00Z'),
  confidence: 0.95,
}

function ioBuffers() {
  const out: string[] = []
  const err: string[] = []
  const writes: Array<{ path: string; data: string }> = []
  return {
    out,
    err,
    writes,
    io: {
      stdout: (t: string) => {
        out.push(t)
      },
      stderr: (t: string) => {
        err.push(t)
      },
      env: {} as Record<string, string | undefined>,
      write: async (path: string, data: string) => {
        writes.push({ path, data })
      },
    },
  }
}

describe('runCli', () => {
  it('prints help on --help with exit 0', async () => {
    const { io, out } = ioBuffers()
    const r = await runCli(['--help'], io)
    expect(r.exitCode).toBe(0)
    expect(out.join('')).toContain('forgely-scrape — point-and-shoot e-commerce scraper')
  })

  it('prints version on -v with exit 0', async () => {
    const { io, out } = ioBuffers()
    const r = await runCli(['-v'], io)
    expect(r.exitCode).toBe(0)
    expect(out.join('')).toMatch(/^forgely-scrape /)
  })

  it('exits 2 with helpful error when arg parsing fails', async () => {
    const { io, err } = ioBuffers()
    const r = await runCli([], io)
    expect(r.exitCode).toBe(2)
    expect(err.join('')).toMatch(/error: A URL is required/)
  })

  it('renders a table for a successful scrape', async () => {
    const buffers = ioBuffers()
    const buffersWithMock = {
      ...buffers,
      io: {
        ...buffers.io,
        scrape: async () => fixtureData,
      },
    }
    const r = await runCli(['https://x.myshopify.com', '--no-color'], buffersWithMock.io)
    expect(r.exitCode).toBe(0)
    const text = buffers.out.join('')
    expect(text).toContain('Source: shopify')
    expect(text).toContain('Hammer')
    expect(text).toContain('done in')
  })

  it('writes JSON to file with --output', async () => {
    const buffers = ioBuffers()
    const r = await runCli(
      ['https://x.myshopify.com', '--format', 'json', '--output', '/tmp/out.json', '--no-color'],
      { ...buffers.io, scrape: async () => fixtureData },
    )
    expect(r.exitCode).toBe(0)
    expect(buffers.writes).toHaveLength(1)
    expect(buffers.writes[0]?.path).toBe('/tmp/out.json')
    const parsed = JSON.parse(buffers.writes[0]!.data)
    expect(parsed.source).toBe('shopify')
  })

  it('returns exitCode 3 on UnauthorizedError', async () => {
    const buffers = ioBuffers()
    const r = await runCli(['https://x.myshopify.com', '--no-color'], {
      ...buffers.io,
      scrape: async () => {
        throw new UnauthorizedError('locked')
      },
    })
    expect(r.exitCode).toBe(3)
    expect(buffers.err.join('')).toContain('UNAUTHORIZED')
  })

  it('returns exitCode 1 on generic ScraperError', async () => {
    const buffers = ioBuffers()
    const r = await runCli(['https://x.myshopify.com', '--no-color'], {
      ...buffers.io,
      scrape: async () => {
        throw new ScraperError('boom', { code: 'BLOCKED', retryable: true })
      },
    })
    expect(r.exitCode).toBe(1)
    expect(buffers.err.join('')).toContain('BLOCKED')
    expect(buffers.err.join('')).toContain('retryable')
  })
})
