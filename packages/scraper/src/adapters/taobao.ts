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

const HOST_REGEX = /^(?:[a-z0-9-]+\.)?(?:taobao|tmall)\.com$/i
const ID_QUERY_REGEX = /[?&](?:id|item_id)=(\d{6,})/i

/**
 * Taobao + Tmall product page adapter. Both sites share the same Alibaba
 * detail.htm structure (URL: `?id=<itemId>`), so a single adapter handles
 * both with `meta.platform` distinguishing the two.
 *
 * Heavily protected — requires a ScraperAPI key with `country_code: 'cn'`.
 */
export interface TaobaoAdapterOptions {
  scraperApi?: ScraperApiOptions | ScraperApiClient
  fetchImpl?: typeof fetch
  storage?: AssetStorage
}

export class TaobaoAdapter implements ScraperAdapter {
  readonly id = 'taobao' as const
  readonly name = 'Taobao / Tmall Item'
  readonly priority = 58

  private readonly api: ScraperApiClient
  private readonly fetchImpl: typeof fetch
  private readonly storage?: AssetStorage

  constructor(options: TaobaoAdapterOptions = {}) {
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
    if (!parsed.pathname.includes('item.htm')) return false
    return ID_QUERY_REGEX.test(`${parsed.pathname}?${parsed.search.slice(1)}`)
  }

  async scrape(url: string, options: ScrapeOptions = {}): Promise<ScrapedData> {
    const parsed = safeParse(url)
    if (!parsed) throw new UnsupportedPlatformError(url)

    const idMatch = `${parsed.pathname}?${parsed.search.slice(1)}`.match(ID_QUERY_REGEX)
    const itemId = idMatch?.[1]
    if (!itemId) throw new UnsupportedPlatformError(url)

    const platform = parsed.hostname.toLowerCase().includes('tmall') ? 'tmall' : 'taobao'

    const apiOptions: { signal?: AbortSignal; timeoutMs?: number } = {}
    if (options.signal !== undefined) apiOptions.signal = options.signal
    if (options.timeoutMs !== undefined) apiOptions.timeoutMs = options.timeoutMs
    const html = await this.api.fetchHtml(url, apiOptions)
    const $ = cheerio.load(html)

    const title =
      $('meta[property="og:title"]').attr('content')?.trim() ||
      $('h3.tb-main-title, .tb-detail-hd h1, h1[data-spm="1000983"]').first().text().trim() ||
      $('title').first().text().trim()
    if (!title) {
      throw new DataValidationError(`${platform} item missing title (id=${itemId})`)
    }

    const description =
      $('meta[property="og:description"]').attr('content')?.trim() ||
      $('meta[name="description"]').attr('content')?.trim() ||
      ''

    const priceText = pickFirst($, [
      '.tm-price',
      '.tb-rmb-num',
      '.price.J_price.J_actualPrice em',
      '.tb-promo-price .tb-rmb-num',
      'meta[property="og:price:amount"]',
    ])

    const vendor =
      $('a.shop-name-link, .slogo-shopname strong').first().text().trim() ||
      $('meta[property="og:site_name"]').attr('content')?.trim() ||
      undefined

    const images = collectImages($, url)
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
      confidence: 0.65,
      meta: { itemId, platform },
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

  $('#J_UlThumb img, .tb-thumb img, .tm-clear .tb-pic img').each((_, el) => {
    const src = $(el).attr('src') ?? $(el).attr('data-src')
    const abs = src ? absoluteUrl(src, base) : null
    if (abs && !seen.has(abs)) {
      out.push({ url: abs })
      seen.add(abs)
    }
  })

  return out
}
