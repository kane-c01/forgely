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

const AMAZON_HOST_REGEX = /^(?:[a-z0-9-]+\.)?amazon\.(?:com|co\.uk|de|fr|es|it|ca|com\.au|co\.jp|in|com\.mx|com\.br|nl|sg|ae|sa|com\.tr|pl|se)$/i

const ASIN_REGEX = /\/(?:dp|gp\/product)\/([A-Z0-9]{10})(?:[/?]|$)/i

const CURRENCY_BY_HOST: Record<string, string> = {
  'amazon.com': 'USD',
  'amazon.co.uk': 'GBP',
  'amazon.de': 'EUR',
  'amazon.fr': 'EUR',
  'amazon.it': 'EUR',
  'amazon.es': 'EUR',
  'amazon.ca': 'CAD',
  'amazon.com.au': 'AUD',
  'amazon.co.jp': 'JPY',
  'amazon.in': 'INR',
}

export interface AmazonAdapterOptions {
  scraperApi?: ScraperApiOptions | ScraperApiClient
  fetchImpl?: typeof fetch
  storage?: AssetStorage
}

export class AmazonAdapter implements ScraperAdapter {
  readonly id = 'amazon' as const
  readonly name = 'Amazon Product'
  readonly priority = 70

  private readonly api: ScraperApiClient
  private readonly fetchImpl: typeof fetch
  private readonly storage?: AssetStorage

  constructor(options: AmazonAdapterOptions = {}) {
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
    if (!AMAZON_HOST_REGEX.test(parsed.hostname.toLowerCase())) return false
    return ASIN_REGEX.test(parsed.pathname)
  }

  async scrape(url: string, options: ScrapeOptions = {}): Promise<ScrapedData> {
    const parsed = safeParse(url)
    if (!parsed) throw new UnsupportedPlatformError(url)

    const asinMatch = parsed.pathname.match(ASIN_REGEX)
    const asin = asinMatch?.[1]
    if (!asin) throw new UnsupportedPlatformError(url)

    const apiOptions: { signal?: AbortSignal; timeoutMs?: number } = {}
    if (options.signal !== undefined) apiOptions.signal = options.signal
    if (options.timeoutMs !== undefined) apiOptions.timeoutMs = options.timeoutMs
    const html = await this.api.fetchHtml(url, apiOptions)
    const $ = cheerio.load(html)

    const title = $('#productTitle').text().trim()
    if (!title) {
      throw new DataValidationError(`Amazon product page missing #productTitle (asin=${asin})`)
    }

    const currency = currencyForHost(parsed.hostname)
    const priceText = pickPriceText($)
    const price = priceText ? makeMoney(priceText, currency, priceText) : makeMoney(0, currency)

    const compareText = $('.priceBlockStrikePrice, .a-text-strike').first().text().trim()
    const description = $('#feature-bullets, #productDescription').first().text().replace(/\s+/g, ' ').trim()
    const vendor = $('#bylineInfo').text().replace(/^.*?:\s*/, '').trim() || undefined

    const images = collectImages($, url)
    const mirrored =
      options.mirrorImages !== false
        ? await mirrorImages(images, {
            source: 'amazon',
            ...(this.storage ? { storage: this.storage } : {}),
            ...(options.siteId ? { siteId: options.siteId } : {}),
            ...(options.signal ? { signal: options.signal } : {}),
            fetchImpl: this.fetchImpl,
          })
        : images

    const variant: ScrapedVariant = {
      id: `${asin}-default`,
      title,
      price,
      sku: asin,
      available: !/currently unavailable|out of stock/i.test($('#availability').text()),
    }
    if (compareText) variant.compareAtPrice = makeMoney(compareText, currency, compareText)

    const product: ScrapedProduct = {
      id: asin,
      handle: asin.toLowerCase(),
      title,
      description,
      tags: [],
      images: mirrored,
      variants: [variant],
      priceFrom: variant.price,
      available: variant.available,
      url,
    }
    if (vendor) product.vendor = vendor

    const ratingText = $('#acrPopover').attr('title') ?? ''
    const ratingMatch = ratingText.match(/([\d.]+)\s*out of/i)
    if (ratingMatch?.[1]) product.rating = Number.parseFloat(ratingMatch[1])

    const reviewText = $('#acrCustomerReviewText').text()
    const reviewMatch = reviewText.match(/([\d,]+)/)
    if (reviewMatch?.[1]) product.reviewCount = Number.parseInt(reviewMatch[1].replace(/,/g, ''), 10)

    const domain = apexHostname(url)

    return {
      source: 'amazon',
      sourceUrl: url,
      store: { name: vendor ?? 'Amazon', currency, language: 'en', domain },
      products: [product],
      collections: [],
      screenshots: {},
      scrapedAt: new Date(),
      confidence: 0.85,
      meta: { asin },
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

function currencyForHost(hostname: string): string {
  const apex = hostname.toLowerCase().replace(/^www\./, '')
  return CURRENCY_BY_HOST[apex] ?? 'USD'
}

function pickPriceText($: cheerio.CheerioAPI): string | null {
  const candidates = [
    '.a-price .a-offscreen',
    '#priceblock_ourprice',
    '#priceblock_dealprice',
    '#priceblock_saleprice',
    'span.a-price > span.a-offscreen',
  ]
  for (const sel of candidates) {
    const text = $(sel).first().text().trim()
    if (text) return text
  }
  return null
}

function collectImages($: cheerio.CheerioAPI, base: string): ScrapedImage[] {
  const seen = new Set<string>()
  const images: ScrapedImage[] = []

  const main = $('#landingImage').attr('data-old-hires') ?? $('#landingImage').attr('src')
  const mainAbs = main ? absoluteUrl(main, base) : null
  if (mainAbs && !seen.has(mainAbs)) {
    images.push({ url: mainAbs })
    seen.add(mainAbs)
  }

  $('#altImages img, #imageBlock img').each((_, el) => {
    const src = $(el).attr('src')
    const abs = src ? absoluteUrl(src.replace(/\._[^.]+_\./, '.'), base) : null
    if (abs && !seen.has(abs)) {
      images.push({ url: abs })
      seen.add(abs)
    }
  })

  return images
}
