import { UnsupportedPlatformError } from './errors.js'
import type {
  AdapterRouteResult,
  ScrapeOptions,
  ScrapedData,
  ScraperAdapter,
  SourcePlatform,
} from './types.js'

export interface ScraperRegistryOptions {
  /** Optional fallback adapter (e.g. GenericAIAdapter) used when no specialised adapter claims the URL. */
  fallback?: ScraperAdapter
}

/**
 * Routes URLs to the highest-priority adapter that claims them.
 *
 * Adapters are evaluated in parallel via `canHandle`; ties are broken by
 * descending `priority`. Falls back to `options.fallback` when no specialised
 * adapter matches.
 */
export class ScraperRegistry {
  private readonly adapters: ScraperAdapter[] = []
  private readonly fallback?: ScraperAdapter

  constructor(options: ScraperRegistryOptions = {}) {
    if (options.fallback) this.fallback = options.fallback
  }

  register(adapter: ScraperAdapter): this {
    if (this.adapters.some((a) => a.id === adapter.id)) {
      throw new Error(`Adapter "${adapter.id}" already registered`)
    }
    this.adapters.push(adapter)
    return this
  }

  list(): readonly ScraperAdapter[] {
    return this.adapters
  }

  has(id: SourcePlatform): boolean {
    return this.adapters.some((a) => a.id === id)
  }

  async route(url: string): Promise<AdapterRouteResult> {
    const candidates = await Promise.all(
      this.adapters.map(async (a) => {
        try {
          return (await a.canHandle(url)) ? a : null
        } catch {
          return null
        }
      }),
    )

    const matched = candidates.filter((a): a is ScraperAdapter => a !== null)
    matched.sort((a, b) => b.priority - a.priority)
    const considered = matched.map((a) => a.id)

    const winner = matched[0]
    if (winner) {
      return { adapter: winner, ambiguous: matched.length > 1, considered }
    }

    if (this.fallback) {
      return { adapter: this.fallback, ambiguous: false, considered: [this.fallback.id] }
    }

    throw new UnsupportedPlatformError(url)
  }

  async scrape(url: string, options?: ScrapeOptions): Promise<ScrapedData> {
    const route = await this.route(url)
    const data = await route.adapter.scrape(url, options)
    return {
      ...data,
      meta: {
        ...(data.meta ?? {}),
        adapter: route.adapter.id,
        ambiguous: route.ambiguous,
        considered: route.considered,
      },
    }
  }
}
