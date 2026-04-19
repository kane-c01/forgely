import * as cheerio from 'cheerio'

import type { BrowserAdapter } from '../../browser/types.js'
import { DataValidationError, UnsupportedPlatformError } from '../../errors.js'
import {
  createScraperApiClient,
  type ScraperApiClient,
  type ScraperApiOptions,
} from '../../http/scraperapi.js'
import { mirrorImages } from '../../normalize/images.js'
import { makeMoney } from '../../normalize/price.js'
import { apexHostname } from '../../normalize/url.js'
import type { AssetStorage } from '../../storage/types.js'
import type {
  ScrapeOptions,
  ScrapedData,
  ScrapedImage,
  ScrapedProduct,
  ScrapedVariant,
  ScraperAdapter,
} from '../../types.js'
import { collectImagesByBundle, fetchCnHtml, pickFirst, type CnFetchResult } from '../cn-shared.js'

import { PDP_SELECTORS } from './selectors.js'

const HOST_REGEX = /^(?:[a-z0-9-]+\.)?jd\.(?:com|hk)$/i
const ITEM_PATH_REGEX = /\/(\d{4,})\.html/i

export interface JdAdapterOptions {
  browser?: BrowserAdapter
  scraperApi?: ScraperApiOptions | ScraperApiClient
  fetchImpl?: typeof fetch
  storage?: AssetStorage
}

export class JdAdapter implements ScraperAdapter {
  readonly id = 'jd' as const
  readonly name = 'JD.com Item'
  readonly priority = 55

  private readonly browser?: BrowserAdapter
  private readonly api?: ScraperApiClient
  private readonly fetchImpl: typeof fetch
  private readonly storage?: AssetStorage

  constructor(options: JdAdapterOptions = {}) {
    this.fetchImpl = options.fetchImpl ?? fetch
    if (options.browser) this.browser = options.browser
    if (options.storage) this.storage = options.storage
    if (options.scraperApi) {
      this.api = isClient(options.scraperApi)
        ? options.scraperApi
        : createScraperApiClient({
            ...(options.scraperApi as ScraperApiOptions),
            countryCode: (options.scraperApi as ScraperApiOptions).countryCode ?? 'cn',
            fetchImpl: this.fetchImpl,
          })
    }
  }

  async canHandle(url: string): Promise<boolean> {
    const parsed = safe(url)
    if (!parsed) return false
    if (!HOST_REGEX.test(parsed.hostname.toLowerCase())) return false
    return ITEM_PATH_REGEX.test(parsed.pathname)
  }

  async scrape(url: string, options: ScrapeOptions = {}): Promise<ScrapedData> {
    const parsed = safe(url)
    if (!parsed) throw new UnsupportedPlatformError(url)
    const idMatch = parsed.pathname.match(ITEM_PATH_REGEX)
    const itemId = idMatch?.[1]
    if (!itemId) throw new UnsupportedPlatformError(url)

    const fetched = await this.fetch(url, options)
    const $ = cheerio.load(fetched.html)

    const title = pickFirst($, PDP_SELECTORS.title)
    if (!title) {
      throw new DataValidationError(`JD item missing title (id=${itemId})`)
    }
    const priceText = pickFirst($, PDP_SELECTORS.price)
    const description = pickFirst($, PDP_SELECTORS.description ?? []) ?? ''
    const vendor = pickFirst($, PDP_SELECTORS.vendor) ?? undefined

    const imageUrls = collectImagesByBundle($, PDP_SELECTORS, fetched.finalUrl || url)
    const images: ScrapedImage[] = imageUrls.map((u) => ({ url: u }))

    const mirrored =
      options.mirrorImages !== false
        ? await mirrorImages(images, {
            source: 'jd',
            ...(this.storage ? { storage: this.storage } : {}),
            ...(options.siteId ? { siteId: options.siteId } : {}),
            ...(options.signal ? { signal: options.signal } : {}),
            fetchImpl: this.fetchImpl,
          })
        : images

    const variant: ScrapedVariant = {
      id: `${itemId}-default`,
      title,
      sku: itemId,
      price: priceText ? makeMoney(priceText, 'CNY', priceText) : makeMoney(0, 'CNY'),
      available: true,
    }

    const product: ScrapedProduct = {
      id: itemId,
      handle: itemId,
      title,
      description,
      tags: [],
      images: mirrored,
      variants: [variant],
      priceFrom: variant.price,
      available: true,
      url,
    }
    if (vendor) product.vendor = vendor

    return {
      source: 'jd',
      sourceUrl: url,
      store: {
        name: vendor ?? 'JD.com Store',
        currency: 'CNY',
        language: 'zh',
        domain: apexHostname(url),
      },
      products: [product],
      collections: [],
      screenshots: {},
      scrapedAt: new Date(),
      confidence: confidenceFor(fetched.via),
      meta: { itemId, via: fetched.via },
    }
  }

  private async fetch(url: string, options: ScrapeOptions): Promise<CnFetchResult> {
    return fetchCnHtml({
      url,
      ...(this.browser ? { browser: this.browser } : {}),
      ...(this.api ? { scraperApi: this.api } : {}),
      fetchImpl: this.fetchImpl,
      ...(options.signal ? { signal: options.signal } : {}),
      ...(options.timeoutMs !== undefined ? { timeoutMs: options.timeoutMs } : {}),
    })
  }
}

function safe(input: string): URL | null {
  try {
    return new URL(input)
  } catch {
    return null
  }
}

function isClient(value: unknown): value is ScraperApiClient {
  return typeof value === 'object' && value !== null && 'fetchHtml' in value
}

function confidenceFor(via: CnFetchResult['via']): number {
  switch (via) {
    case 'browser':
      return 0.8
    case 'scraperapi':
      return 0.7
    case 'direct-fetch':
      return 0.55
  }
}
