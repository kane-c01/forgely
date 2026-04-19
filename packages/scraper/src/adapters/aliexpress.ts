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

const ALIEXPRESS_HOST_REGEX = /^(?:[a-z0-9-]+\.)?aliexpress\.(?:com|us|ru|fr|de|es|it|pl|jp|nl|com\.br)$/i
const ITEM_ID_REGEX = /\/item\/(\d{6,})\.html/i
const RUNPARAMS_REGEX = /window\.runParams\s*=\s*(\{[\s\S]*?\});\s*var/i

export interface AliExpressAdapterOptions {
  scraperApi?: ScraperApiOptions | ScraperApiClient
  fetchImpl?: typeof fetch
  storage?: AssetStorage
}

export class AliExpressAdapter implements ScraperAdapter {
  readonly id = 'aliexpress' as const
  readonly name = 'AliExpress Item'
  readonly priority = 65

  private readonly api: ScraperApiClient
  private readonly fetchImpl: typeof fetch
  private readonly storage?: AssetStorage

  constructor(options: AliExpressAdapterOptions = {}) {
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
    if (!ALIEXPRESS_HOST_REGEX.test(parsed.hostname.toLowerCase())) return false
    return ITEM_ID_REGEX.test(parsed.pathname)
  }

  async scrape(url: string, options: ScrapeOptions = {}): Promise<ScrapedData> {
    const parsed = safeParse(url)
    if (!parsed) throw new UnsupportedPlatformError(url)
    const itemMatch = parsed.pathname.match(ITEM_ID_REGEX)
    const itemId = itemMatch?.[1]
    if (!itemId) throw new UnsupportedPlatformError(url)

    const apiOptions: { signal?: AbortSignal; timeoutMs?: number } = {}
    if (options.signal !== undefined) apiOptions.signal = options.signal
    if (options.timeoutMs !== undefined) apiOptions.timeoutMs = options.timeoutMs
    const html = await this.api.fetchHtml(url, apiOptions)
    const $ = cheerio.load(html)

    const runParams = parseRunParams(html)
    const titleFromMeta =
      $('meta[property="og:title"]').attr('content') ?? $('title').first().text().trim()

    let title = ''
    let description = ''
    let currency = 'USD'
    let priceText: string | null = null
    const images: ScrapedImage[] = []

    if (runParams) {
      const data = runParams.data ?? runParams
      const titleModule = (data as Record<string, unknown>).titleModule as Record<string, unknown> | undefined
      title = (titleModule?.['subject'] as string | undefined) ?? title
      const descriptionModule = (data as Record<string, unknown>).descriptionModule as Record<string, unknown> | undefined
      description = (descriptionModule?.['descriptionUrl'] as string | undefined) ?? description

      const priceModule = (data as Record<string, unknown>).priceModule as Record<string, unknown> | undefined
      const minActivityAmount = (priceModule?.['minActivityAmount'] as { value?: number; currency?: string } | undefined) ?? undefined
      const formatedActivityPrice = priceModule?.['formatedActivityPrice'] as string | undefined
      if (minActivityAmount?.value != null) {
        priceText = String(minActivityAmount.value)
        if (minActivityAmount.currency) currency = String(minActivityAmount.currency)
      }
      if (!priceText && formatedActivityPrice) priceText = formatedActivityPrice

      const imageModule = (data as Record<string, unknown>).imageModule as Record<string, unknown> | undefined
      const imagePathList = imageModule?.['imagePathList'] as string[] | undefined
      if (Array.isArray(imagePathList)) {
        for (const src of imagePathList) {
          const abs = absoluteUrl(src, url)
          if (abs) images.push({ url: abs })
        }
      }
    }

    if (!title) {
      title = titleFromMeta || $('h1').first().text().trim()
    }
    if (!title) {
      throw new DataValidationError(`AliExpress page missing title (item=${itemId})`)
    }

    if (!priceText) {
      priceText = $('span.product-price-value, .uniform-banner-box-price').first().text().trim() || null
    }

    if (images.length === 0) {
      $('.images-view-item img, img.magnifier-image').each((_, el) => {
        const src = $(el).attr('src')
        const abs = src ? absoluteUrl(src, url) : null
        if (abs) images.push({ url: abs })
      })
    }

    const mirrored =
      options.mirrorImages !== false
        ? await mirrorImages(images, {
            source: 'aliexpress',
            ...(this.storage ? { storage: this.storage } : {}),
            ...(options.siteId ? { siteId: options.siteId } : {}),
            ...(options.signal ? { signal: options.signal } : {}),
            fetchImpl: this.fetchImpl,
          })
        : images

    const variant: ScrapedVariant = {
      id: `${itemId}-default`,
      title,
      price: priceText ? makeMoney(priceText, currency, priceText) : makeMoney(0, currency),
      available: true,
      sku: itemId,
    }

    const product: ScrapedProduct = {
      id: itemId,
      handle: itemId,
      title,
      description: description || $('meta[name="description"]').attr('content') || '',
      tags: [],
      images: mirrored,
      variants: [variant],
      priceFrom: variant.price,
      available: true,
      url,
    }

    return {
      source: 'aliexpress',
      sourceUrl: url,
      store: {
        name: 'AliExpress',
        currency,
        language: 'en',
        domain: apexHostname(url),
      },
      products: [product],
      collections: [],
      screenshots: {},
      scrapedAt: new Date(),
      confidence: runParams ? 0.78 : 0.6,
      meta: { itemId, structuredDataAvailable: !!runParams },
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

function parseRunParams(html: string): Record<string, unknown> | null {
  const match = html.match(RUNPARAMS_REGEX)
  if (!match?.[1]) return null
  try {
    return JSON.parse(match[1]) as Record<string, unknown>
  } catch {
    return null
  }
}
