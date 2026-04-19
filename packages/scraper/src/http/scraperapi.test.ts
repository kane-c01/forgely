import { describe, expect, it } from 'vitest'

import { createMockFetch, text } from '../__tests__/helpers/mock-fetch.js'

import { createScraperApiClient } from './scraperapi.js'

describe('createScraperApiClient', () => {
  it('routes through scraperapi.com when an apiKey is provided', async () => {
    let captured = ''
    const fetchImpl = createMockFetch([
      {
        match: (u) => {
          captured = u
          return u.startsWith('https://api.scraperapi.com/')
        },
        respond: () => text('<html>ok</html>'),
      },
    ])
    const client = createScraperApiClient({ apiKey: 'KEY', fetchImpl, render: false })
    const html = await client.fetchHtml('https://x.com/dp/B0FORGE001')
    expect(html).toBe('<html>ok</html>')
    expect(captured).toContain('api_key=KEY')
    expect(captured).toContain('url=https%3A%2F%2Fx.com%2Fdp%2FB0FORGE001')
    expect(captured).toContain('render=false')
  })

  it('falls back to direct fetch when no apiKey is provided', async () => {
    let captured = ''
    const fetchImpl = createMockFetch([
      {
        match: (u) => {
          captured = u
          return u === 'https://x.com/dp/B0'
        },
        respond: () => text('<html>direct</html>'),
      },
    ])
    const client = createScraperApiClient({ fetchImpl })
    const html = await client.fetchHtml('https://x.com/dp/B0')
    expect(html).toBe('<html>direct</html>')
    expect(captured).toBe('https://x.com/dp/B0')
  })

  it('passes country_code and premium when supplied', async () => {
    let captured = ''
    const fetchImpl = createMockFetch([
      {
        match: (u) => {
          captured = u
          return u.startsWith('https://api.scraperapi.com/')
        },
        respond: () => text('ok'),
      },
    ])
    const client = createScraperApiClient({
      apiKey: 'K',
      countryCode: 'de',
      premium: true,
      fetchImpl,
    })
    await client.fetchHtml('https://x.com/p')
    expect(captured).toContain('country_code=de')
    expect(captured).toContain('premium=true')
  })
})
