import { httpRequest, type HttpRequestOptions } from './client.js'

/**
 * Thin wrapper around https://www.scraperapi.com/ — the canonical "render
 * + rotate proxy" provider used by Amazon / AliExpress adapters when a
 * direct fetch would be blocked.
 *
 * Adapters MUST always allow being constructed without a key (so dev /
 * tests work). When no key is supplied the client falls back to direct
 * fetch — fine for staging against an unblocked URL or against MSW mocks.
 */
export interface ScraperApiOptions {
  /** Optional API key. When absent, the client makes a direct fetch. */
  apiKey?: string
  /** When true, the upstream renders JS before returning HTML. Default true. */
  render?: boolean
  /** Country code (e.g. `us`, `de`, `cn`). */
  countryCode?: string
  /** Premium proxy pool (default false to save credits). */
  premium?: boolean
  fetchImpl?: typeof fetch
}

export interface ScraperApiClient {
  fetchHtml(targetUrl: string, options?: { signal?: AbortSignal; timeoutMs?: number }): Promise<string>
}

const ENDPOINT = 'https://api.scraperapi.com/'

class HttpScraperApiClient implements ScraperApiClient {
  constructor(private readonly opts: ScraperApiOptions) {}

  async fetchHtml(
    targetUrl: string,
    options: { signal?: AbortSignal; timeoutMs?: number } = {},
  ): Promise<string> {
    const { apiKey, render = true, countryCode, premium } = this.opts

    const reqOptions: HttpRequestOptions = {
      retries: apiKey ? 2 : 1,
      timeoutMs: options.timeoutMs ?? 60_000,
    }
    if (this.opts.fetchImpl !== undefined) reqOptions.fetchImpl = this.opts.fetchImpl
    if (options.signal !== undefined) reqOptions.signal = options.signal

    let url: string
    if (apiKey) {
      const params = new URLSearchParams({
        api_key: apiKey,
        url: targetUrl,
        render: render ? 'true' : 'false',
      })
      if (countryCode) params.set('country_code', countryCode)
      if (premium) params.set('premium', 'true')
      url = `${ENDPOINT}?${params.toString()}`
    } else {
      url = targetUrl
    }

    const res = await httpRequest<string>(url, reqOptions)
    return String(res.data)
  }
}

export function createScraperApiClient(options: ScraperApiOptions = {}): ScraperApiClient {
  return new HttpScraperApiClient(options)
}
