import * as cheerio from 'cheerio'

import { DataValidationError, UnsupportedPlatformError } from '../errors.js'
import { createScraperApiClient, type ScraperApiClient, type ScraperApiOptions } from '../http/scraperapi.js'
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

const ETSY_HOST_REGEX = /^(?:[a-z0-9-]+\.)?etsy\.com$/i
const LISTING_ID_REGEX = /\/listing\/(\d+)/i
const SHOP_REGEX = /\/shop\/([\w-]+)/i

export interface EtsyAdapterOptions {
  scraperApi?: ScraperApiOptions | ScraperApiClient
  fetchImpl?: typeof fetch
  storage?: AssetStorage
}

export class EtsyAdapter implements ScraperAdapter {
  readonly id = 'etsy' as const
  readonly name = 'Etsy Listing / Shop'
  readonly priority = 60

  private readonly api: ScraperApiClient
  private readonly fetchImpl: typeof fetch
  private readonly storage?: AssetStorage

  constructor(options: EtsyAdapterOptions = {}) {
    this.fetchImpl = options.fetchImpl ?? fetch
    if (options.storage) this.storage = options.storage
    this.api = isClient(options.scraperApi)
      ? options.scraperApi
      : createScraperApiClient({
          ...((options.scraperApi as ScraperApiOptions | undefined) ?? {}),
          fetchImpl: this.fetchImpl,
        })
  }

  async canHandle(url: string): Promise<boolean> {
    const parsed = safeParse(url)
    if (!parsed) return false
    if (!ETSY_HOST_REGEX.test(parsed.hostname.toLowerCase())) return false
    return LISTING_ID_REGEX.test(parsed.pathname) || SHOP_REGEX.test(parsed.pathname)
  }

  async scrape(url: string, options: ScrapeOptions = {}): Promise<ScrapedData> {
    const parsed = safeParse(url)
    if (!parsed) throw new UnsupportedPlatformError(url)

    const apiOptions: { signal?: AbortSignal; timeoutMs?: number } = {}
    if (options.signal !== undefined) apiOptions.signal = options.signal
    if (options.timeoutMs !== undefined) apiOptions.timeoutMs = options.timeoutMs
    const html = await this.api.fetchHtml(url, apiOptions)
    const $ = cheerio.load(html)
    const domain = apexHostname(url)

    const listingMatch = parsed.pathname.match(LISTING_ID_REGEX)
    if (listingMatch?.[1]) {
      const product = await this.parseListing($, url, listingMatch[1], options)
      return {
        source: 'etsy',
        sourceUrl: url,
        store: { name: product.vendor ?? 'Etsy Shop', currency: product.priceFrom.currency, language: 'en', domain },
        products: [product],
        collections: [],
        screenshots: {},
        scrapedAt: new Date(),
        confidence: 0.82,
        meta: { listingId: listingMatch[1] },
      }
    }

    const shopMatch = parsed.pathname.match(SHOP_REGEX)
    if (shopMatch?.[1]) {
      return this.parseShop($, url, shopMatch[1], domain, options)
    }

    throw new UnsupportedPlatformError(url)
  }

  private async parseListing(
    $: cheerio.CheerioAPI,
    url: string,
    listingId: string,
    options: ScrapeOptions,
  ): Promise<ScrapedProduct> {
    const title =
      $('h1[data-buy-box-listing-title]').text().trim() ||
      $('meta[property="og:title"]').attr('content') ||
      $('title').first().text().trim()
    if (!title) {
      throw new DataValidationError(`Etsy listing missing title (id=${listingId})`)
    }

    const currency = $('meta[itemprop="priceCurrency"]').attr('content') ?? 'USD'
    const priceText =
      $('p[data-buy-box-region="price"]').first().text().trim() ||
      $('meta[itemprop="price"]').attr('content') ||
      ''

    const description = $('div[data-product-details-description-text-content]')
      .text()
      .replace(/\s+/g, ' ')
      .trim()

    const vendor = $('a[href*="/shop/"]').first().text().trim() || undefined
    const tags = $('a[href*="/c/"]')
      .map((_, el) => $(el).text().trim())
      .toArray()
      .filter(Boolean)
      .slice(0, 8)

    const images: ScrapedImage[] = []
    const seen = new Set<string>()
    $('img[data-index]').each((_, el) => {
      const src = $(el).attr('data-src-zoom-image') ?? $(el).attr('src')
      const abs = src ? absoluteUrl(src, url) : null
      if (abs && !seen.has(abs)) {
        images.push({ url: abs })
        seen.add(abs)
      }
    })
    if (images.length === 0) {
      const og = $('meta[property="og:image"]').attr('content')
      const abs = og ? absoluteUrl(og, url) : null
      if (abs) images.push({ url: abs })
    }

    const mirrored =
      options.mirrorImages !== false
        ? await mirrorImages(images, {
            source: 'etsy',
            ...(this.storage ? { storage: this.storage } : {}),
            ...(options.siteId ? { siteId: options.siteId } : {}),
            ...(options.signal ? { signal: options.signal } : {}),
            fetchImpl: this.fetchImpl,
          })
        : images

    const price = priceText ? makeMoney(priceText, currency, priceText) : makeMoney(0, currency)
    const variant: ScrapedVariant = {
      id: `${listingId}-default`,
      title,
      sku: listingId,
      price,
      available: true,
    }

    const product: ScrapedProduct = {
      id: listingId,
      handle: listingId,
      title,
      description,
      tags,
      images: mirrored,
      variants: [variant],
      priceFrom: price,
      available: true,
      url,
    }
    if (vendor) product.vendor = vendor
    return product
  }

  private async parseShop(
    $: cheerio.CheerioAPI,
    url: string,
    shopHandle: string,
    domain: string,
    _options: ScrapeOptions,
  ): Promise<ScrapedData> {
    const products: ScrapedProduct[] = []
    const cards = $('a[href*="/listing/"]').toArray()

    const seen = new Set<string>()
    for (const el of cards) {
      const href = $(el).attr('href')
      if (!href) continue
      const abs = absoluteUrl(href, url)
      if (!abs) continue
      const m = abs.match(LISTING_ID_REGEX)
      const id = m?.[1]
      if (!id || seen.has(id)) continue
      seen.add(id)

      const title =
        $(el).find('h3, p').first().text().trim() ||
        $(el).attr('aria-label') ||
        `Listing ${id}`
      const priceText = $(el).find('span.currency-value, p.lc-price').first().text().trim()
      const price = priceText ? makeMoney(priceText, 'USD', priceText) : makeMoney(0, 'USD')
      const imgSrc = $(el).find('img').first().attr('src')
      const imgAbs = imgSrc ? absoluteUrl(imgSrc, url) : null

      const variant: ScrapedVariant = {
        id: `${id}-default`,
        title,
        price,
        sku: id,
        available: true,
      }
      products.push({
        id,
        handle: id,
        title,
        description: '',
        tags: [],
        images: imgAbs ? [{ url: imgAbs }] : [],
        variants: [variant],
        priceFrom: price,
        available: true,
        url: abs,
      })
    }

    return {
      source: 'etsy',
      sourceUrl: url,
      store: {
        name: shopHandle,
        currency: 'USD',
        language: 'en',
        domain,
      },
      products,
      collections: [],
      screenshots: {},
      scrapedAt: new Date(),
      confidence: 0.7,
      meta: { shopHandle },
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
