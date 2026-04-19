import * as cheerio from 'cheerio'
import { z } from 'zod'

import { NoopBrowserAdapter, type BrowserAdapter } from '../browser/types.js'
import {
  DataValidationError,
  NotFoundError,
  ScraperError,
  UnauthorizedError,
  UnsupportedPlatformError,
} from '../errors.js'
import { httpRequest, type HttpRequestOptions } from '../http/client.js'
import { mirrorImages } from '../normalize/images.js'
import { lowestPrice, makeMoney } from '../normalize/price.js'
import { absoluteUrl, apexHostname, slugify } from '../normalize/url.js'
import type { AssetStorage } from '../storage/types.js'
import type {
  ScrapeOptions,
  ScrapedCollection,
  ScrapedData,
  ScrapedImage,
  ScrapedProduct,
  ScrapedStore,
  ScrapedVariant,
  ScraperAdapter,
} from '../types.js'

/**
 * Storefront REST schema (no auth required when enabled).
 * https://developer.woocommerce.com/docs/category/store-api/
 */
const wcStorefrontPriceSchema = z.object({
  currency_code: z.string().length(3),
  currency_minor_unit: z.number().int().min(0).max(6),
  price: z.string(),
  regular_price: z.string().nullish(),
  sale_price: z.string().nullish(),
})

const wcStorefrontImageSchema = z.object({
  id: z.number().int().nullish(),
  src: z.string(),
  alt: z.string().nullish(),
  thumbnail: z.string().nullish(),
})

const wcStorefrontProductSchema = z.object({
  id: z.union([z.number(), z.string()]).transform((v) => String(v)),
  name: z.string(),
  slug: z.string(),
  permalink: z.string().url(),
  description: z.string().nullish(),
  short_description: z.string().nullish(),
  sku: z.string().nullish(),
  prices: wcStorefrontPriceSchema,
  is_in_stock: z.boolean().optional(),
  on_sale: z.boolean().optional(),
  images: z.array(wcStorefrontImageSchema),
  categories: z
    .array(z.object({ id: z.number().int(), name: z.string(), slug: z.string() }))
    .optional()
    .default([]),
  tags: z
    .array(z.object({ id: z.number().int(), name: z.string(), slug: z.string() }))
    .optional()
    .default([]),
  type: z.string().optional(),
  parent: z.number().int().nullish(),
  variation: z.string().nullish(),
})

const wcStorefrontCategorySchema = z.object({
  id: z.union([z.number(), z.string()]).transform((v) => String(v)),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullish(),
  count: z.number().int().nullish(),
  permalink: z.string().url().nullish(),
  image: z
    .object({ src: z.string(), alt: z.string().nullish() })
    .nullish(),
})

export interface WooCommerceAdapterOptions {
  fetchImpl?: typeof fetch
  browser?: BrowserAdapter
  storage?: AssetStorage
  /** Maximum products per page request. Default 100 (WC Storefront max). */
  pageLimit?: number
  /** Hard ceiling on pages walked. */
  maxPages?: number
}

export interface WooCommerceCredentials {
  /** WooCommerce REST consumer key. */
  consumerKey?: string
  consumerSecret?: string
}

type WcStorefrontProduct = z.infer<typeof wcStorefrontProductSchema>
type WcStorefrontCategory = z.infer<typeof wcStorefrontCategorySchema>

export class WooCommerceAdapter implements ScraperAdapter {
  readonly id = 'woocommerce' as const
  readonly name = 'WooCommerce'
  readonly priority = 80

  private readonly fetchImpl: typeof fetch
  private readonly browser: BrowserAdapter
  private readonly storage?: AssetStorage
  private readonly pageLimit: number
  private readonly maxPages: number

  constructor(options: WooCommerceAdapterOptions = {}) {
    this.fetchImpl = options.fetchImpl ?? fetch
    this.browser = options.browser ?? new NoopBrowserAdapter()
    if (options.storage) this.storage = options.storage
    this.pageLimit = Math.min(Math.max(options.pageLimit ?? 100, 1), 100)
    this.maxPages = Math.max(options.maxPages ?? 50, 1)
  }

  async canHandle(url: string): Promise<boolean> {
    const parsed = safeParse(url)
    if (!parsed) return false

    if (await this.probeStorefrontApi(parsed.origin)) return true
    return this.probeHtmlForWoo(parsed.origin)
  }

  async scrape(url: string, options: ScrapeOptions = {}): Promise<ScrapedData> {
    const parsed = safeParse(url)
    if (!parsed) throw new UnsupportedPlatformError(url)
    const origin = parsed.origin
    const domain = apexHostname(origin)

    const credentials = readCredentials(options)
    const errors: string[] = []

    // Strategy A: Storefront REST (no auth required when enabled)
    try {
      return await this.scrapeViaStorefront(url, origin, domain, options)
    } catch (err) {
      if (err instanceof UnauthorizedError) throw err
      if (err instanceof DataValidationError) throw err
      errors.push(`storefront: ${(err as Error).message}`)
    }

    // Strategy B: Authenticated REST (wc/v3) — only if credentials present
    const { consumerKey, consumerSecret } = credentials
    if (consumerKey && consumerSecret) {
      try {
        return await this.scrapeViaAuthenticatedRest(url, origin, domain, options, {
          consumerKey,
          consumerSecret,
        })
      } catch (err) {
        errors.push(`auth-rest: ${(err as Error).message}`)
      }
    }

    // Strategy C: HTML fallback
    try {
      return await this.scrapeViaHtml(url, origin, domain, options)
    } catch (err) {
      errors.push(`html: ${(err as Error).message}`)
    }

    throw new ScraperError(
      'WooCommerce scraping failed for all strategies. Provide REST API credentials via `options.credentials` (consumerKey + consumerSecret) and ensure the Storefront API or shop page is reachable.',
      {
        code: 'WOO_ALL_STRATEGIES_FAILED',
        retryable: false,
        source: 'woocommerce',
        meta: { errors },
      },
    )
  }

  // ── Strategy A: Storefront REST ────────────────────────────────

  private async probeStorefrontApi(origin: string): Promise<boolean> {
    try {
      const res = await httpRequest<unknown>(
        `${origin}/wp-json/wc/store/v1/products?per_page=1`,
        {
          fetchImpl: this.fetchImpl,
          retries: 0,
          timeoutMs: 8_000,
          allowNotFound: true,
        },
      )
      if (res.status !== 200) return false
      return Array.isArray(res.data)
    } catch {
      return false
    }
  }

  private async probeHtmlForWoo(origin: string): Promise<boolean> {
    try {
      const res = await httpRequest<string>(origin, {
        fetchImpl: this.fetchImpl,
        retries: 0,
        timeoutMs: 8_000,
        allowNotFound: true,
      })
      const html = String(res.data)
      return /(wp-content|woocommerce|wc-block)/i.test(html)
    } catch {
      return false
    }
  }

  private async scrapeViaStorefront(
    sourceUrl: string,
    origin: string,
    domain: string,
    options: ScrapeOptions,
  ): Promise<ScrapedData> {
    const products: WcStorefrontProduct[] = []
    const max = options.maxProducts ?? Number.POSITIVE_INFINITY

    for (let page = 1; page <= this.maxPages; page++) {
      const url = `${origin}/wp-json/wc/store/v1/products?per_page=${this.pageLimit}&page=${page}`
      const res = await this.fetchJson<unknown>(url, options)
      if (!Array.isArray(res)) {
        throw new DataValidationError('WooCommerce Storefront /products did not return an array')
      }
      if (res.length === 0) break

      for (const raw of res) {
        const parsed = wcStorefrontProductSchema.safeParse(raw)
        if (!parsed.success) {
          throw new DataValidationError('Unexpected WooCommerce Storefront product payload', {
            issues: parsed.error.issues,
          })
        }
        if (parsed.data.parent && parsed.data.parent > 0) continue
        products.push(parsed.data)
        if (products.length >= max) break
      }
      if (products.length >= max || res.length < this.pageLimit) break
    }

    const categories = await this.fetchStorefrontCategories(origin, options)

    const normalizedProducts = await Promise.all(
      products.map((p) => this.normalizeStorefrontProduct(p, options)),
    )
    const normalizedCollections = await Promise.all(
      categories.map((c) => this.normalizeStorefrontCategory(c, origin)),
    )

    const store = await this.fetchStore(origin, domain, options)
    if (products[0]) store.currency = products[0].prices.currency_code

    const screenshots = options.skipScreenshots
      ? {}
      : await this.captureScreenshots(origin, normalizedProducts, normalizedCollections, options)

    return {
      source: 'woocommerce',
      sourceUrl,
      store,
      products: normalizedProducts,
      collections: normalizedCollections,
      screenshots,
      scrapedAt: new Date(),
      confidence: 0.92,
      meta: { strategy: 'storefront-api', productCount: normalizedProducts.length },
    }
  }

  private async fetchStorefrontCategories(
    origin: string,
    options: ScrapeOptions,
  ): Promise<WcStorefrontCategory[]> {
    try {
      const res = await this.fetchJson<unknown>(
        `${origin}/wp-json/wc/store/v1/products/categories?per_page=100`,
        options,
      )
      if (!Array.isArray(res)) return []
      const out: WcStorefrontCategory[] = []
      for (const raw of res) {
        const parsed = wcStorefrontCategorySchema.safeParse(raw)
        if (parsed.success) out.push(parsed.data)
      }
      return out
    } catch {
      return []
    }
  }

  private async normalizeStorefrontProduct(
    raw: WcStorefrontProduct,
    options: ScrapeOptions,
  ): Promise<ScrapedProduct> {
    const minor = raw.prices.currency_minor_unit
    const factor = Math.pow(10, minor) / 100
    const toCents = (v: string): number => Math.round(Number.parseFloat(v) / factor)

    const currency = raw.prices.currency_code

    const variant: ScrapedVariant = {
      id: `${raw.id}-default`,
      title: raw.name,
      price: { amountCents: toCents(raw.prices.price), currency, raw: raw.prices.price },
      available: raw.is_in_stock ?? true,
    }
    if (raw.sku) variant.sku = raw.sku
    if (raw.prices.regular_price) {
      variant.compareAtPrice = {
        amountCents: toCents(raw.prices.regular_price),
        currency,
        raw: raw.prices.regular_price,
      }
    }

    const images: ScrapedImage[] = raw.images
      .map((img) => {
        const out: ScrapedImage = { url: img.src }
        if (img.alt) out.alt = img.alt
        return out
      })
      .filter((img): img is ScrapedImage => Boolean(img.url))

    const mirrored =
      options.mirrorImages !== false
        ? await mirrorImages(images, {
            source: 'woocommerce',
            ...(this.storage ? { storage: this.storage } : {}),
            ...(options.siteId ? { siteId: options.siteId } : {}),
            ...(options.signal ? { signal: options.signal } : {}),
            fetchImpl: this.fetchImpl,
          })
        : images

    const product: ScrapedProduct = {
      id: raw.id,
      handle: raw.slug,
      title: raw.name,
      description: stripHtml(raw.description ?? raw.short_description ?? ''),
      tags: raw.tags.map((t) => t.name),
      images: mirrored,
      variants: [variant],
      priceFrom: variant.price,
      available: variant.available,
      url: raw.permalink,
    }
    if (raw.short_description) product.descriptionHtml = raw.short_description
    if (raw.categories[0]) product.category = raw.categories[0].name
    return product
  }

  private async normalizeStorefrontCategory(
    raw: WcStorefrontCategory,
    origin: string,
  ): Promise<ScrapedCollection> {
    const collection: ScrapedCollection = {
      id: raw.id,
      handle: raw.slug,
      title: raw.name,
      productIds: [],
      url: raw.permalink ?? `${origin}/product-category/${raw.slug}/`,
    }
    if (raw.description) collection.description = raw.description
    if (raw.count != null) collection.productCount = raw.count
    if (raw.image?.src) {
      const image: ScrapedImage = { url: raw.image.src }
      if (raw.image.alt) image.alt = raw.image.alt
      collection.image = image
    }
    return collection
  }

  // ── Strategy B: Authenticated REST (wc/v3) ─────────────────────

  private async scrapeViaAuthenticatedRest(
    sourceUrl: string,
    origin: string,
    domain: string,
    options: ScrapeOptions,
    credentials: { consumerKey: string; consumerSecret: string },
  ): Promise<ScrapedData> {
    const products: ScrapedProduct[] = []
    const max = options.maxProducts ?? Number.POSITIVE_INFINITY

    for (let page = 1; page <= this.maxPages; page++) {
      const url = `${origin}/wp-json/wc/v3/products?per_page=${this.pageLimit}&page=${page}`
      const res = await this.fetchJson<unknown>(url, options, credentials)
      if (!Array.isArray(res)) {
        throw new DataValidationError('WC v3 /products did not return an array')
      }
      if (res.length === 0) break

      for (const raw of res) {
        const product = wcV3ToScrapedProduct(raw as Record<string, unknown>, origin)
        if (product) products.push(product)
        if (products.length >= max) break
      }
      if (products.length >= max || res.length < this.pageLimit) break
    }

    const store: ScrapedStore = {
      name: domain,
      currency: products[0]?.priceFrom.currency ?? 'USD',
      language: 'en',
      domain,
    }

    return {
      source: 'woocommerce',
      sourceUrl,
      store,
      products,
      collections: [],
      screenshots: {},
      scrapedAt: new Date(),
      confidence: 0.95,
      meta: { strategy: 'wc-v3-rest', productCount: products.length },
    }
  }

  // ── Strategy C: HTML fallback ──────────────────────────────────

  private async scrapeViaHtml(
    sourceUrl: string,
    origin: string,
    domain: string,
    options: ScrapeOptions,
  ): Promise<ScrapedData> {
    const shopUrl = `${origin}/shop/`
    let html: string
    try {
      const res = await httpRequest<string>(shopUrl, {
        fetchImpl: this.fetchImpl,
        retries: 1,
        timeoutMs: options.timeoutMs ?? 20_000,
        signal: options.signal,
      })
      html = String(res.data)
    } catch (err) {
      if (err instanceof NotFoundError) {
        throw new ScraperError('No /shop page on this site', {
          code: 'WOO_NO_SHOP',
          source: 'woocommerce',
        })
      }
      throw err
    }

    const $ = cheerio.load(html)
    const cards = $('.products .product, ul.products li.product, .wc-block-grid__product').toArray()
    if (cards.length === 0) {
      throw new ScraperError('Could not find any WooCommerce product cards on /shop', {
        code: 'WOO_NO_CARDS',
        source: 'woocommerce',
      })
    }

    const max = Math.min(cards.length, options.maxProducts ?? cards.length)
    const products: ScrapedProduct[] = []
    for (let i = 0; i < max; i++) {
      const el = cards[i]
      if (!el) continue
      const $card = $(el)
      const title = $card.find('.woocommerce-loop-product__title, h2, h3').first().text().trim()
      const link = $card.find('a').first().attr('href') ?? shopUrl
      const url = absoluteUrl(link, origin) ?? shopUrl
      const priceText = $card.find('.price .amount, .price').first().text().trim()
      const imgSrc = $card.find('img').first().attr('src')
      const imageAbs = imgSrc ? absoluteUrl(imgSrc, origin) : null

      let price
      try {
        price = makeMoney(priceText || '0', 'USD', priceText)
      } catch {
        price = makeMoney(0, 'USD')
      }

      const handle = link.split('/').filter(Boolean).slice(-1)[0] ?? slugify(title)
      const variant: ScrapedVariant = {
        id: `${handle}-default`,
        title: title || 'Default',
        price,
        available: true,
      }

      products.push({
        id: handle,
        handle,
        title: title || handle,
        description: '',
        tags: [],
        images: imageAbs ? [{ url: imageAbs }] : [],
        variants: [variant],
        priceFrom: variant.price,
        available: true,
        url,
      })
    }

    return {
      source: 'woocommerce',
      sourceUrl,
      store: { name: domain, currency: 'USD', language: 'en', domain },
      products,
      collections: [],
      screenshots: {},
      scrapedAt: new Date(),
      confidence: 0.7,
      meta: { strategy: 'html-shop' },
    }
  }

  // ── shared helpers ─────────────────────────────────────────────

  private async fetchStore(
    origin: string,
    domain: string,
    _options: ScrapeOptions,
  ): Promise<ScrapedStore> {
    try {
      const res = await httpRequest<string>(origin, {
        fetchImpl: this.fetchImpl,
        retries: 1,
        timeoutMs: 8_000,
        allowNotFound: true,
      })
      const html = String(res.data)
      const $ = cheerio.load(html)
      const name = $('meta[property="og:site_name"]').attr('content') ?? $('title').first().text().trim()
      const description = $('meta[name="description"]').attr('content') ?? undefined
      const language = $('html').attr('lang')?.split('-')[0] ?? 'en'
      const store: ScrapedStore = {
        name: name || domain,
        currency: 'USD',
        language,
        domain,
      }
      if (description) store.description = description
      return store
    } catch {
      return { name: domain, currency: 'USD', language: 'en', domain }
    }
  }

  private async captureScreenshots(
    origin: string,
    products: ScrapedProduct[],
    collections: ScrapedCollection[],
    options: ScrapeOptions,
  ): Promise<ScrapedData['screenshots']> {
    if (this.browser instanceof NoopBrowserAdapter) return {}
    const targets: Array<{ key: 'homepage' | 'productPage' | 'categoryPage'; url: string }> = [
      { key: 'homepage', url: origin },
    ]
    if (products[0]) targets.push({ key: 'productPage', url: products[0].url })
    if (collections[0]) targets.push({ key: 'categoryPage', url: collections[0].url })
    const out: ScrapedData['screenshots'] = {}
    await Promise.all(
      targets.map(async ({ key, url }) => {
        try {
          const shot = await this.browser.screenshot(url, { fullPage: true })
          if (this.storage) {
            const stored = await this.storage.put({
              key: `scrapes/${options.siteId ?? '_unbound'}/woocommerce/screenshot-${key}.png`,
              body: shot.bytes,
              contentType: shot.contentType,
            })
            out[key] = stored.url
          }
        } catch {
          /* best effort */
        }
      }),
    )
    return out
  }

  private async fetchJson<T>(
    url: string,
    options: ScrapeOptions,
    credentials?: { consumerKey: string; consumerSecret: string },
  ): Promise<T | null> {
    const reqOptions: HttpRequestOptions = {
      method: 'GET',
      headers: { Accept: 'application/json' },
      fetchImpl: this.fetchImpl,
      retries: 2,
    }
    if (options.timeoutMs !== undefined) reqOptions.timeoutMs = options.timeoutMs
    if (options.signal !== undefined) reqOptions.signal = options.signal
    if (credentials) {
      reqOptions.headers = {
        ...(reqOptions.headers ?? {}),
        Authorization: `Basic ${base64(`${credentials.consumerKey}:${credentials.consumerSecret}`)}`,
      }
    }

    const res = await httpRequest<T>(url, reqOptions)
    if (res.status === 404) return null
    return res.data
  }
}

// ── helpers ─────────────────────────────────────────────────────

function safeParse(input: string): URL | null {
  try {
    return new URL(input)
  } catch {
    return null
  }
}

function readCredentials(options: ScrapeOptions): WooCommerceCredentials {
  const ck = options.credentials?.consumerKey
  const cs = options.credentials?.consumerSecret
  return {
    ...(ck ? { consumerKey: ck } : {}),
    ...(cs ? { consumerSecret: cs } : {}),
  }
}

function base64(input: string): string {
  return Buffer.from(input, 'utf-8').toString('base64')
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Best-effort mapping for the authenticated wc/v3 product payload. */
function wcV3ToScrapedProduct(raw: Record<string, unknown>, origin: string): ScrapedProduct | null {
  const id = raw.id != null ? String(raw.id) : null
  const slug = typeof raw.slug === 'string' ? raw.slug : null
  const name = typeof raw.name === 'string' ? raw.name : null
  if (!id || !slug || !name) return null

  const currency = 'USD'
  const priceStr = typeof raw.price === 'string' ? raw.price : '0'
  const price = makeMoney(priceStr || '0', currency)
  const variants: ScrapedVariant[] = [
    {
      id: `${id}-default`,
      title: name,
      price,
      available: raw.in_stock !== false,
    },
  ]

  const imageList = Array.isArray(raw.images) ? (raw.images as Array<Record<string, unknown>>) : []
  const images: ScrapedImage[] = imageList
    .map((img) => {
      const src = typeof img.src === 'string' ? img.src : null
      if (!src) return null
      const out: ScrapedImage = { url: src }
      if (typeof img.alt === 'string' && img.alt) out.alt = img.alt
      return out
    })
    .filter((img): img is ScrapedImage => img !== null)

  const description = typeof raw.description === 'string' ? stripHtml(raw.description) : ''
  const tagList = Array.isArray(raw.tags) ? (raw.tags as Array<Record<string, unknown>>) : []
  const tags = tagList
    .map((t) => (typeof t.name === 'string' ? t.name : null))
    .filter((t): t is string => Boolean(t))

  return {
    id,
    handle: slug,
    title: name,
    description,
    tags,
    images,
    variants,
    priceFrom: lowestPrice(variants.map((v) => v.price)),
    available: variants[0]?.available ?? true,
    url: typeof raw.permalink === 'string' ? raw.permalink : `${origin}/product/${slug}/`,
  }
}
