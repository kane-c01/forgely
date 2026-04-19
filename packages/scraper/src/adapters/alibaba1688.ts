import * as cheerio from 'cheerio'

import { DataValidationError, UnsupportedPlatformError } from '../errors.js'
import {
  createScraperApiClient,
  type ScraperApiClient,
  type ScraperApiOptions,
} from '../http/scraperapi.js'
import { mirrorImages } from '../normalize/images.js'
import { makeMoney } from '../normalize/price.js'
import { absoluteUrl, apexHostname } from '../normalize/url.js'
import type { AssetStorage } from '../storage/types.js'
import type {
  ScrapeOptions,
  ScrapedData,
  ScrapedImage,
  ScrapedProduct,
  ScrapedVariant,
  ScraperAdapter,
} from '../types.js'

const HOST_REGEX = /^(?:[a-z0-9-]+\.)?1688\.com$/i
const OFFER_ID_REGEX = /\/offer\/(\d{6,})\.html/i

/**
 * 1688.com offer page adapter — the most important Tier-2 source for
 * Persona A (China factory owners going global). 1688 is heavily protected,
 * so the adapter expects a ScraperAPI key with `country_code: 'cn'`.
 */
export interface Alibaba1688AdapterOptions {
  scraperApi?: ScraperApiOptions | ScraperApiClient
  fetchImpl?: typeof fetch
  storage?: AssetStorage
}

export class Alibaba1688Adapter implements ScraperAdapter {
  readonly id = 'alibaba_1688' as const
  readonly name = '1688 Offer'
  readonly priority = 60

  private readonly api: ScraperApiClient
  private readonly fetchImpl: typeof fetch
  private readonly storage?: AssetStorage

  constructor(options: Alibaba1688AdapterOptions = {}) {
    this.fetchImpl = options.fetchImpl ?? fetch
    if (options.storage) this.storage = options.storage
    this.api = isClient(options.scraperApi)
      ? options.scraperApi
      : createScraperApiClient({
          ...((options.scraperApi as ScraperApiOptions | undefined) ?? {}),
          countryCode: (options.scraperApi as ScraperApiOptions | undefined)?.countryCode ?? 'cn',
          fetchImpl: this.fetchImpl,
        })
  }

  async canHandle(url: string): Promise<boolean> {
    const parsed = safeParse(url)
    if (!parsed) return false
    if (!HOST_REGEX.test(parsed.hostname.toLowerCase())) return false
    return OFFER_ID_REGEX.test(parsed.pathname)
  }

  async scrape(url: string, options: ScrapeOptions = {}): Promise<ScrapedData> {
    const parsed = safeParse(url)
    if (!parsed) throw new UnsupportedPlatformError(url)
    const offerMatch = parsed.pathname.match(OFFER_ID_REGEX)
    const offerId = offerMatch?.[1]
    if (!offerId) throw new UnsupportedPlatformError(url)

    const apiOptions: { signal?: AbortSignal; timeoutMs?: number } = {}
    if (options.signal !== undefined) apiOptions.signal = options.signal
    if (options.timeoutMs !== undefined) apiOptions.timeoutMs = options.timeoutMs
    const html = await this.api.fetchHtml(url, apiOptions)
    const $ = cheerio.load(html)

    const title =
      $('meta[property="og:title"]').attr('content')?.trim() ||
      $('h1.d-title, h1.title-text').first().text().trim() ||
      $('title').first().text().trim()
    if (!title) {
      throw new DataValidationError(`1688 offer missing title (id=${offerId})`)
    }

    const description =
      $('meta[property="og:description"]').attr('content')?.trim() ||
      $('meta[name="description"]').attr('content')?.trim() ||
      ''

    const priceText = pickFirst($, [
      'span.price-now .value',
      '.mod-detail-price .price',
      '.price-original',
      '.price.fd-clr',
      'meta[property="og:price:amount"]',
    ])

    const images = collectImages($, url)
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

    const vendor =
      $('.company-name a').first().text().trim() ||
      $('.company-info .name').first().text().trim() ||
      undefined

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
      url,
    }
    if (vendor) product.vendor = vendor

    return {
      source: 'alibaba_1688',
      sourceUrl: url,
      store: {
        name: vendor ?? '1688 Marketplace',
        currency: 'CNY',
        language: 'zh',
        domain: apexHostname(url),
      },
      products: [product],
      collections: [],
      screenshots: {},
      scrapedAt: new Date(),
      confidence: 0.7,
      meta: { offerId },
    }
  }
}

function safeParse(input: string): URL | null {
  try {
    return new URL(input)
  } catch {
    return null
  }
}

function isClient(value: unknown): value is ScraperApiClient {
  return typeof value === 'object' && value !== null && 'fetchHtml' in value
}

function pickFirst($: cheerio.CheerioAPI, selectors: string[]): string | null {
  for (const sel of selectors) {
    if (sel.startsWith('meta[')) {
      const v = $(sel).attr('content')
      if (v) return v.trim()
    } else {
      const t = $(sel).first().text().trim()
      if (t) return t
    }
  }
  return null
}

function collectImages($: cheerio.CheerioAPI, base: string): ScrapedImage[] {
  const seen = new Set<string>()
  const out: ScrapedImage[] = []

  const og = $('meta[property="og:image"]').attr('content')
  const ogAbs = og ? absoluteUrl(og, base) : null
  if (ogAbs) {
    out.push({ url: ogAbs })
    seen.add(ogAbs)
  }

  $('.vertical-img img, .preview-image img, ul.detail-gallery img').each((_, el) => {
    const src = $(el).attr('src') ?? $(el).attr('data-src')
    const abs = src ? absoluteUrl(src, base) : null
    if (abs && !seen.has(abs)) {
      out.push({ url: abs })
      seen.add(abs)
    }
  })

  return out
}
