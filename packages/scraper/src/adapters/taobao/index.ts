import * as cheerio from 'cheerio'

import type { BrowserAdapter } from '../../browser/types.js'
import { BlockedError, DataValidationError, UnsupportedPlatformError } from '../../errors.js'
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

import { ANTIBOT_MARKERS, COMMENT_SELECTORS, PDP_SELECTORS } from './selectors.js'

const HOST_REGEX = /^(?:[a-z0-9-]+\.)?(?:taobao|tmall)\.com$/i
const ID_QUERY_REGEX = /[?&](?:id|item_id)=(\d{6,})/i

export interface TaobaoAdapterOptions {
  browser?: BrowserAdapter
  scraperApi?: ScraperApiOptions | ScraperApiClient
  fetchImpl?: typeof fetch
  storage?: AssetStorage
  /** When true, follow up the PDP with a `comment.taobao.com` request to fill rating + reviewCount. */
  fetchReviews?: boolean
}

/**
 * Taobao + Tmall adapter. Both sites share Alibaba's `detail.htm?id=<id>`
 * skeleton; the adapter distinguishes them via `meta.platform` and uses
 * `comment.taobao.com` on demand for rating/reviewCount.
 *
 * Heavy anti-bot — production deployments MUST inject a Playwright-backed
 * BrowserAdapter (see @forgely/scraper-playwright). When the rendered HTML
 * trips one of the slider/captcha markers, we throw `BlockedError` so the
 * upstream worker can rotate proxy / cookie and retry.
 */
export class TaobaoAdapter implements ScraperAdapter {
  readonly id = 'taobao' as const
  readonly name = 'Taobao / Tmall'
  readonly priority = 58

  private readonly browser?: BrowserAdapter
  private readonly api?: ScraperApiClient
  private readonly fetchImpl: typeof fetch
  private readonly storage?: AssetStorage
  private readonly fetchReviews: boolean

  constructor(options: TaobaoAdapterOptions = {}) {
    this.fetchImpl = options.fetchImpl ?? fetch
    if (options.browser) this.browser = options.browser
    if (options.storage) this.storage = options.storage
    this.fetchReviews = options.fetchReviews ?? false
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
    if (!parsed.pathname.includes('item.htm')) return false
    return ID_QUERY_REGEX.test(`${parsed.pathname}?${parsed.search.slice(1)}`)
  }

  async scrape(url: string, options: ScrapeOptions = {}): Promise<ScrapedData> {
    const parsed = safe(url)
    if (!parsed) throw new UnsupportedPlatformError(url)

    const idMatch = `${parsed.pathname}?${parsed.search.slice(1)}`.match(ID_QUERY_REGEX)
    const itemId = idMatch?.[1]
    if (!itemId) throw new UnsupportedPlatformError(url)

    const platform = parsed.hostname.toLowerCase().includes('tmall') ? 'tmall' : 'taobao'

    const fetched = await this.fetch(url, options)
    detectAntibot(fetched.html)

    const $ = cheerio.load(fetched.html)
    const title = pickFirst($, PDP_SELECTORS.title)
    if (!title) {
      throw new DataValidationError(`${platform} item missing title (id=${itemId})`)
    }
    const priceText = pickFirst($, PDP_SELECTORS.price)
    const description = pickFirst($, PDP_SELECTORS.description ?? []) ?? ''
    const vendor = pickFirst($, PDP_SELECTORS.vendor) ?? undefined

    const baseUrl = fetched.finalUrl || url
    const imageUrls = collectImagesByBundle($, PDP_SELECTORS, baseUrl)
    const images: ScrapedImage[] = imageUrls.map((u) => ({ url: u }))

    const mirrored =
      options.mirrorImages !== false
        ? await mirrorImages(images, {
            source: 'taobao',
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

    if (this.fetchReviews) {
      try {
        await this.attachReviews(product, itemId, options)
      } catch {
        /* reviews are best-effort */
      }
    }

    return {
      source: 'taobao',
      sourceUrl: url,
      store: {
        name: vendor ?? (platform === 'tmall' ? 'Tmall Store' : 'Taobao Store'),
        currency: 'CNY',
        language: 'zh',
        domain: apexHostname(url),
      },
      products: [product],
      collections: [],
      screenshots: {},
      scrapedAt: new Date(),
      confidence: confidenceFor(fetched.via),
      meta: { itemId, platform, via: fetched.via },
    }
  }

  private async attachReviews(
    product: ScrapedProduct,
    itemId: string,
    options: ScrapeOptions,
  ): Promise<void> {
    const url = `https://comment.taobao.com/comment_list.htm?auctionNumId=${itemId}`
    const fetched = await this.fetch(url, options)
    const $ = cheerio.load(fetched.html)
    const score = pickFirst($, COMMENT_SELECTORS.ratingScore)
    const countText = pickFirst($, COMMENT_SELECTORS.reviewCount)
    if (score) {
      const rating = Number.parseFloat(score)
      if (Number.isFinite(rating) && rating >= 0 && rating <= 5) product.rating = rating
    }
    if (countText) {
      const digits = countText.replace(/[^\d]/g, '')
      const n = Number.parseInt(digits, 10)
      if (Number.isFinite(n) && n >= 0) product.reviewCount = n
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

function detectAntibot(html: string): void {
  const sample = html.slice(0, 8000)
  for (const marker of ANTIBOT_MARKERS) {
    if (sample.includes(marker)) {
      throw new BlockedError(
        `Taobao slider/captcha challenge detected (marker: "${marker}") — rotate cookie/proxy and retry`,
      )
    }
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
      return 0.78
    case 'scraperapi':
      return 0.68
    case 'direct-fetch':
      return 0.45
  }
}
