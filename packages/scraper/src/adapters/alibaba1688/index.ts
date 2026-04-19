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

import { PDP_SELECTORS, SHOP_LIST_SELECTORS } from './selectors.js'

const HOST_REGEX = /^(?:[a-z0-9-]+\.)?1688\.com$/i
const OFFER_ID_REGEX = /\/offer\/(\d{6,})\.html/i
const SHOP_HOST_REGEX = /^shop\d+\.1688\.com$/i

export interface Alibaba1688AdapterOptions {
  /** Preferred renderer — Playwright via @forgely/scraper-playwright. */
  browser?: BrowserAdapter
  /** Fallback renderer — ScraperAPI (auto-creates client when only options supplied). */
  scraperApi?: ScraperApiOptions | ScraperApiClient
  /** Custom fetch (used by tests, last-resort path). */
  fetchImpl?: typeof fetch
  /** Where to mirror images. */
  storage?: AssetStorage
  /** Cap on offers fetched from a shop list. Default 60 (~3 pages of cards). */
  shopListLimit?: number
}

type Mode = 'pdp' | 'shop'

interface ResolvedRequest {
  mode: Mode
  url: string
  /** Offer id when mode === 'pdp'. */
  offerId?: string
  /** Shop subdomain id when mode === 'shop'. */
  shopId?: string
}

/**
 * 1688.com adapter — covers PDP (`detail.1688.com/offer/<id>.html`) and
 * storefront list pages (`shop<id>.1688.com/page/offerlist.htm`). Built for
 * Persona A factory-owners selling to overseas brands.
 */
export class Alibaba1688Adapter implements ScraperAdapter {
  readonly id = 'alibaba_1688' as const
  readonly name = '1688 Marketplace (Alibaba B2B)'
  readonly priority = 60

  private readonly browser?: BrowserAdapter
  private readonly api?: ScraperApiClient
  private readonly fetchImpl: typeof fetch
  private readonly storage?: AssetStorage
  private readonly shopListLimit: number

  constructor(options: Alibaba1688AdapterOptions = {}) {
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
    this.shopListLimit = options.shopListLimit ?? 60
  }

  async canHandle(url: string): Promise<boolean> {
    const parsed = safe(url)
    if (!parsed) return false
    if (!HOST_REGEX.test(parsed.hostname.toLowerCase())) return false
    return (
      OFFER_ID_REGEX.test(parsed.pathname) || SHOP_HOST_REGEX.test(parsed.hostname.toLowerCase())
    )
  }

  async scrape(url: string, options: ScrapeOptions = {}): Promise<ScrapedData> {
    const req = this.resolveRequest(url)
    if (!req) throw new UnsupportedPlatformError(url)

    if (req.mode === 'pdp') {
      const offerId = req.offerId
      if (!offerId) throw new UnsupportedPlatformError(url)
      const fetched = await this.fetch(url, options)
      const product = await this.parsePdp(fetched, offerId, url, options)
      return this.envelope(url, [product], fetched, { offerId })
    }

    const shopId = req.shopId
    if (!shopId) throw new UnsupportedPlatformError(url)
    return this.scrapeShop(url, shopId, options)
  }

  private resolveRequest(url: string): ResolvedRequest | null {
    const parsed = safe(url)
    if (!parsed) return null
    const host = parsed.hostname.toLowerCase()
    const offerMatch = parsed.pathname.match(OFFER_ID_REGEX)
    if (offerMatch?.[1]) return { mode: 'pdp', url, offerId: offerMatch[1] }
    const shopMatch = host.match(/^shop(\d+)\.1688\.com$/i)
    if (shopMatch?.[1]) return { mode: 'shop', url, shopId: shopMatch[1] }
    return null
  }

  // ── PDP ─────────────────────────────────────────────────────────

  private async parsePdp(
    fetched: CnFetchResult,
    offerId: string,
    sourceUrl: string,
    options: ScrapeOptions,
  ): Promise<ScrapedProduct> {
    const $ = cheerio.load(fetched.html)
    const title = pickFirst($, PDP_SELECTORS.title)
    if (!title) {
      throw new DataValidationError(`1688 offer missing title (id=${offerId})`)
    }
    const priceText = pickFirst($, PDP_SELECTORS.price)
    const description = pickFirst($, PDP_SELECTORS.description ?? []) ?? ''
    const vendor = pickFirst($, PDP_SELECTORS.vendor) ?? undefined
    const category = pickFirst($, PDP_SELECTORS.category ?? []) ?? undefined

    const baseUrl = fetched.finalUrl || sourceUrl
    const imageUrls = collectImagesByBundle($, PDP_SELECTORS, baseUrl)
    const images: ScrapedImage[] = imageUrls.map((u) => ({ url: u }))

    const mirrored =
      options.mirrorImages !== false
        ? await mirrorImages(images, {
            source: 'alibaba_1688',
            ...(this.storage ? { storage: this.storage } : {}),
            ...(options.siteId ? { siteId: options.siteId } : {}),
            ...(options.signal ? { signal: options.signal } : {}),
            fetchImpl: this.fetchImpl,
          })
        : images

    const variant: ScrapedVariant = {
      id: `${offerId}-default`,
      title,
      sku: offerId,
      price: priceText ? makeMoney(priceText, 'CNY', priceText) : makeMoney(0, 'CNY'),
      available: true,
    }

    const product: ScrapedProduct = {
      id: offerId,
      handle: offerId,
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
    if (category) product.category = category
    return product
  }

  // ── Shop list ──────────────────────────────────────────────────

  private async scrapeShop(
    sourceUrl: string,
    shopId: string,
    options: ScrapeOptions,
  ): Promise<ScrapedData> {
    const fetched = await this.fetch(sourceUrl, options)
    const $ = cheerio.load(fetched.html)

    const offerHrefs = new Set<string>()
    for (const sel of SHOP_LIST_SELECTORS.cardLinks) {
      $(sel).each((_, el) => {
        const href = $(el).attr('href')
        if (!href) return
        const abs = absoluteUrl(href, fetched.finalUrl || sourceUrl)
        if (abs && OFFER_ID_REGEX.test(abs)) offerHrefs.add(abs)
      })
    }

    const limit = Math.min(options.maxProducts ?? this.shopListLimit, this.shopListLimit)
    const offers = Array.from(offerHrefs).slice(0, limit)
    const products: ScrapedProduct[] = []
    for (const offerUrl of offers) {
      try {
        const offerHtml = await this.fetch(offerUrl, options)
        const idMatch = offerUrl.match(OFFER_ID_REGEX)
        if (!idMatch?.[1]) continue
        const product = await this.parsePdp(offerHtml, idMatch[1], offerUrl, options)
        products.push(product)
      } catch {
        /* one bad offer must not poison the whole shop scrape */
      }
    }

    if (products.length === 0) {
      throw new DataValidationError(`1688 shop ${shopId} returned no parseable offers`)
    }

    return this.envelope(sourceUrl, products, fetched, { shopId, offerCount: offers.length })
  }

  // ── envelope + helpers ─────────────────────────────────────────

  private envelope(
    sourceUrl: string,
    products: ScrapedProduct[],
    fetched: CnFetchResult,
    meta: Record<string, unknown>,
  ): ScrapedData {
    const vendor = products[0]?.vendor
    return {
      source: 'alibaba_1688',
      sourceUrl,
      store: {
        name: vendor ?? '1688 Marketplace',
        currency: 'CNY',
        language: 'zh',
        domain: apexHostname(sourceUrl),
      },
      products,
      collections: [],
      screenshots: {},
      scrapedAt: new Date(),
      confidence: confidenceFor(fetched.via),
      meta: { ...meta, via: fetched.via },
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
      return 0.85
    case 'scraperapi':
      return 0.75
    case 'direct-fetch':
      return 0.55
  }
}
