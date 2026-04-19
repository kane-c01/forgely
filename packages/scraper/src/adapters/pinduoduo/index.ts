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
import { absoluteUrl, apexHostname } from '../../normalize/url.js'
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

import { PDP_SELECTORS, extractRawData, findGoodsDetail, type PddRawProduct } from './selectors.js'

const HOST_REGEX = /^(?:[a-z0-9-]+\.)?(?:yangkeduo|pinduoduo)\.com$/i
const GOODS_PATH_REGEX = /\/(?:goods|items?)\.html/i
const GOODS_ID_QUERY = /[?&]goods_id=(\d{4,})/i

export interface PinduoduoAdapterOptions {
  browser?: BrowserAdapter
  scraperApi?: ScraperApiOptions | ScraperApiClient
  fetchImpl?: typeof fetch
  storage?: AssetStorage
}

/**
 * Pinduoduo (拼多多) PDP adapter. PDD's web client is a heavy SPA; the
 * adapter prefers the embedded `window.rawData` JSON when present and only
 * falls back to CSS selectors when raw data extraction fails.
 *
 * URL forms supported:
 *   - `https://mobile.yangkeduo.com/goods.html?goods_id=<id>`
 *   - `https://yangkeduo.com/goods.html?goods_id=<id>`
 *   - `https://mobile.pinduoduo.com/goods.html?goods_id=<id>`
 */
export class PinduoduoAdapter implements ScraperAdapter {
  readonly id = 'pinduoduo' as const
  readonly name = 'Pinduoduo Goods'
  readonly priority = 52

  private readonly browser?: BrowserAdapter
  private readonly api?: ScraperApiClient
  private readonly fetchImpl: typeof fetch
  private readonly storage?: AssetStorage

  constructor(options: PinduoduoAdapterOptions = {}) {
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
    if (!GOODS_PATH_REGEX.test(parsed.pathname)) return false
    return GOODS_ID_QUERY.test(`${parsed.pathname}?${parsed.search.slice(1)}`)
  }

  async scrape(url: string, options: ScrapeOptions = {}): Promise<ScrapedData> {
    const parsed = safe(url)
    if (!parsed) throw new UnsupportedPlatformError(url)
    const idMatch = `${parsed.pathname}?${parsed.search.slice(1)}`.match(GOODS_ID_QUERY)
    const goodsId = idMatch?.[1]
    if (!goodsId) throw new UnsupportedPlatformError(url)

    const fetched = await this.fetch(url, options)

    const raw = extractRawData(fetched.html)
    const detail = raw ? findGoodsDetail(raw) : null

    const product = detail
      ? await this.parseFromRawData(detail, goodsId, url, fetched, options)
      : await this.parseFromHtml(goodsId, url, fetched, options)

    return {
      source: 'pinduoduo',
      sourceUrl: url,
      store: {
        name: product.vendor ?? 'Pinduoduo Mall',
        currency: 'CNY',
        language: 'zh',
        domain: apexHostname(url),
      },
      products: [product],
      collections: [],
      screenshots: {},
      scrapedAt: new Date(),
      confidence: detail ? 0.75 : confidenceFor(fetched.via),
      meta: { goodsId, structuredDataAvailable: Boolean(detail), via: fetched.via },
    }
  }

  // ── parsing strategies ─────────────────────────────────────────

  private async parseFromRawData(
    detail: PddRawProduct,
    goodsId: string,
    sourceUrl: string,
    fetched: CnFetchResult,
    options: ScrapeOptions,
  ): Promise<ScrapedProduct> {
    const title = detail.goodsName ?? ''
    if (!title) {
      throw new DataValidationError(`PDD goods missing goodsName (id=${goodsId})`)
    }

    const priceMinor = detail.minOnSaleGroupPrice ?? detail.minOnSaleNormalPrice ?? null
    const price =
      typeof priceMinor === 'number'
        ? { amountCents: priceMinor, currency: 'CNY' }
        : makeMoney(0, 'CNY')

    const baseUrl = fetched.finalUrl || sourceUrl
    const seenUrls = new Set<string>()
    const rawImages: ScrapedImage[] = []
    for (const img of detail.thumbList ?? []) {
      const abs = absoluteUrl(img.url, baseUrl)
      if (abs && !seenUrls.has(abs)) {
        rawImages.push({ url: abs })
        seenUrls.add(abs)
      }
    }
    const mirrored =
      options.mirrorImages !== false
        ? await mirrorImages(rawImages, {
            source: 'pinduoduo',
            ...(this.storage ? { storage: this.storage } : {}),
            ...(options.siteId ? { siteId: options.siteId } : {}),
            ...(options.signal ? { signal: options.signal } : {}),
            fetchImpl: this.fetchImpl,
          })
        : rawImages

    const variant: ScrapedVariant = {
      id: `${goodsId}-default`,
      title,
      sku: goodsId,
      price,
      available: true,
    }

    const product: ScrapedProduct = {
      id: goodsId,
      handle: goodsId,
      title,
      description: '',
      tags: [],
      images: mirrored,
      variants: [variant],
      priceFrom: variant.price,
      available: true,
      url: sourceUrl,
    }
    if (detail.mall?.mallName) product.vendor = detail.mall.mallName
    return product
  }

  private async parseFromHtml(
    goodsId: string,
    sourceUrl: string,
    fetched: CnFetchResult,
    options: ScrapeOptions,
  ): Promise<ScrapedProduct> {
    const $ = cheerio.load(fetched.html)
    const title = pickFirst($, PDP_SELECTORS.title)
    if (!title) {
      throw new DataValidationError(`PDD goods missing title (id=${goodsId})`)
    }

    const priceText = pickFirst($, PDP_SELECTORS.price)
    const description = pickFirst($, PDP_SELECTORS.description ?? []) ?? ''
    const vendor = pickFirst($, PDP_SELECTORS.vendor) ?? undefined

    const imageUrls = collectImagesByBundle($, PDP_SELECTORS, fetched.finalUrl || sourceUrl)
    const images: ScrapedImage[] = imageUrls.map((u) => ({ url: u }))

    const mirrored =
      options.mirrorImages !== false
        ? await mirrorImages(images, {
            source: 'pinduoduo',
            ...(this.storage ? { storage: this.storage } : {}),
            ...(options.siteId ? { siteId: options.siteId } : {}),
            ...(options.signal ? { signal: options.signal } : {}),
            fetchImpl: this.fetchImpl,
          })
        : images

    const variant: ScrapedVariant = {
      id: `${goodsId}-default`,
      title,
      sku: goodsId,
      price: priceText ? makeMoney(priceText, 'CNY', priceText) : makeMoney(0, 'CNY'),
      available: true,
    }

    const product: ScrapedProduct = {
      id: goodsId,
      handle: goodsId,
      title,
      description,
      tags: [],
      images: mirrored,
      variants: [variant],
      priceFrom: variant.price,
      available: true,
      url: sourceUrl,
    }
    if (vendor) product.vendor = vendor
    return product
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
      return 0.7
    case 'scraperapi':
      return 0.62
    case 'direct-fetch':
      return 0.45
  }
}
