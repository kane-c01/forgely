import { describe, expect, it, vi } from 'vitest'
import { DataForSeoClient } from '../index.js'

describe('DataForSeoClient', () => {
  it('parses keyword ideas response', async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          status_code: 20000,
          tasks: [
            {
              result: [
                { keyword: 'trail runner', search_volume: 12000, cpc: 1.5, competition: 0.6 },
                { keyword: 'lightweight running shoe', search_volume: 5400, cpc: 1.1, competition: 0.4 },
              ],
            },
          ],
        }),
        { status: 200 },
      ),
    )
    const client = DataForSeoClient.create({
      login: 'a',
      password: 'b',
      fetcher: fetcher as unknown as typeof fetch,
    })
    const r = await client.research('trail runner')
    expect(r.ideas).toHaveLength(2)
    expect(r.ideas[0]?.searchVolume).toBe(12000)
  })

  it('throws DataForSeoError on http failure', async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response('nope', { status: 500 }))
    const client = DataForSeoClient.create({
      login: 'a',
      password: 'b',
      fetcher: fetcher as unknown as typeof fetch,
    })
    await expect(client.research('x')).rejects.toThrow(/HTTP 500/)
  })

  it('caches identical requests within ttl', async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ status_code: 20000, tasks: [{ result: [] }] }), { status: 200 }),
    )
    const client = DataForSeoClient.create({
      login: 'a',
      password: 'b',
      cacheTtlMs: 60_000,
      fetcher: fetcher as unknown as typeof fetch,
    })
    await client.research('x')
    await client.research('x')
    expect(fetcher).toHaveBeenCalledTimes(1)
  })
})
