import { describe, expect, it } from 'vitest'

import {
  BlockedError,
  NotFoundError,
  RateLimitedError,
  TimeoutError,
  UnauthorizedError,
} from '../errors.js'
import { createMockFetch, json, notFound, rawError, text } from '../__tests__/helpers/mock-fetch.js'

import { httpRequest } from './client.js'

describe('httpRequest', () => {
  it('returns parsed JSON on 200', async () => {
    const fetchImpl = createMockFetch([
      { match: (u) => u === 'https://x.com/a', respond: () => json({ ok: true }) },
    ])
    const res = await httpRequest<{ ok: boolean }>('https://x.com/a', { fetchImpl })
    expect(res.status).toBe(200)
    expect(res.data).toEqual({ ok: true })
  })

  it('throws UnauthorizedError on 401', async () => {
    const fetchImpl = createMockFetch([
      { match: () => true, respond: () => rawError(401, 'no') },
    ])
    await expect(httpRequest('https://x.com/a', { fetchImpl })).rejects.toBeInstanceOf(
      UnauthorizedError,
    )
  })

  it('throws BlockedError when 403 looks like a Cloudflare challenge', async () => {
    const fetchImpl = createMockFetch([
      {
        match: () => true,
        respond: () =>
          text(
            '<html><body>Attention Required! | Cloudflare<br/>Ray ID: 12345</body></html>',
            { status: 403 },
          ),
      },
    ])
    await expect(httpRequest('https://x.com/a', { fetchImpl })).rejects.toBeInstanceOf(
      BlockedError,
    )
  })

  it('throws NotFoundError on 404 by default', async () => {
    const fetchImpl = createMockFetch([{ match: () => true, respond: () => notFound() }])
    await expect(httpRequest('https://x.com/a', { fetchImpl })).rejects.toBeInstanceOf(
      NotFoundError,
    )
  })

  it('treats 404 as null when allowNotFound is true', async () => {
    const fetchImpl = createMockFetch([{ match: () => true, respond: () => notFound() }])
    const res = await httpRequest('https://x.com/a', { fetchImpl, allowNotFound: true })
    expect(res.status).toBe(404)
  })

  it('retries on 500 and eventually throws', async () => {
    let calls = 0
    const fetchImpl = createMockFetch([
      {
        match: () => true,
        respond: () => {
          calls++
          return rawError(500)
        },
      },
    ])
    await expect(
      httpRequest('https://x.com/a', { fetchImpl, retries: 2, backoffMs: 1 }),
    ).rejects.toThrow()
    expect(calls).toBe(3)
  })

  it('throws RateLimitedError after retries', async () => {
    const fetchImpl = createMockFetch([
      { match: () => true, respond: () => new Response('slow', { status: 429, headers: { 'retry-after': '0' } }) },
    ])
    await expect(
      httpRequest('https://x.com/a', { fetchImpl, retries: 1, backoffMs: 1 }),
    ).rejects.toBeInstanceOf(RateLimitedError)
  })

  it('throws TimeoutError when fetch aborts', async () => {
    const fetchImpl: typeof fetch = (() => {
      const err = new Error('aborted')
      err.name = 'AbortError'
      throw err
    }) as typeof fetch
    await expect(
      httpRequest('https://x.com/a', { fetchImpl, retries: 0 }),
    ).rejects.toBeInstanceOf(TimeoutError)
  })
})
