import { z } from 'zod'

import { NoopBrowserAdapter, type BrowserAdapter } from '../browser/types.js'
import { DataValidationError, UnsupportedPlatformError } from '../errors.js'
import { httpRequest, type HttpRequestOptions } from '../http/client.js'
import { mirrorImage, mirrorImages } from '../normalize/images.js'
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

const SHOPIFY_HOST_HINT = '.myshopify.com'
const DEFAULT_PAGE_LIMIT = 250
const DEFAULT_MAX_PAGES = 50

const shopifyVariantSchema = z.object({
  id: z.union([z.number(), z.string()]).transform((v) => String(v)),
  title: z.string().nullish().transform((v) => v ?? 'Default'),
  price: z.union([z.string(), z.number()]),
  compare_at_price: z.union([z.string(), z.number()]).nullish(),
  sku: z.string().nullish(),
  available: z.boolean().optional(),
  inventory_quantity: z.number().int().nullish(),
  featured_image: z.object({ src: z.string().url().or(z.string()) }).nullish(),
  option1: z.string().nullish(),
  option2: z.string().nullish(),
  option3: z.string().nullish(),
})

const shopifyImageSchema = z.object({
  src: z.string(),
  alt: z.string().nullish(),
  width: z.number().int().nullish(),
  height: z.number().int().nullish(),
})

const shopifyProductSchema = z.object({
  id: z.union([z.number(), z.string()]).transform((v) => String(v)),
  title: z.string(),
  handle: z.string(),
  body_html: z
    .string()
    .nullish()
    .transform((v) => v ?? ''),
  vendor: z.string().nullish(),
  product_type: z.string().nullish(),
  tags: z
    .union([z.string(), z.array(z.string())])
    .nullish()
    .transform((v) => {
      if (Array.isArray(v)) return v.filter(Boolean)
      if (typeof v === 'string')
        return v
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      return [] as string[]
    }),
  variants: z.array(shopifyVariantSchema).min(1),
  images: z.array(shopifyImageSchema),
  options: z
    .array(z.object({ name: z.string(), values: z.array(z.string()) }))
    .optional()
    .default([]),
})

const shopifyProductsResponseSchema = z.object({
  products: z.array(shopifyProductSchema),
})

const shopifyCollectionSchema = z.object({
  id: z.union([z.number(), z.string()]).transform((v) => String(v)),
  handle: z.string(),
  title: z.string(),
  description: z.string().nullish(),
  products_count: z.number().int().nullish(),
  image: z
    .object({
      src: z.string(),
      alt: z.string().nullish(),
      width: z.number().int().nullish(),
      height: z.number().int().nullish(),
    })
    .nullish(),
})

const shopifyCollectionsResponseSchema = z.object({
  collections: z.array(shopifyCollectionSchema),
})

const shopifyMetaSchema = z.object({
  shop: z
    .object({
      name: z.string().nullish(),
      currency: z.string().length(3).nullish(),
      money_format: z.string().nullish(),
    })
    .nullish(),
})

export interface ShopifyAdapterOptions {
  /** Custom fetch (used by tests). */
  fetchImpl?: typeof fetch
  /** Browser adapter for screenshots. Defaults to no-op (screenshots skipped). */
  browser?: BrowserAdapter
  /** Storage to mirror images into. */
  storage?: AssetStorage
  /** Per-page limit for /products.json. Default 250 (Shopify maximum). */
  pageLimit?: number
  /** Hard ceiling on pages walked. Default 50 (= 12,500 products). */
  maxPages?: number
}

type ShopifyProduct = z.infer<typeof shopifyProductSchema>
type ShopifyCollection = z.infer<typeof shopifyCollectionSchema>

export class ShopifyAdapter implements ScraperAdapter {
  readonly id = 'shopify' as const
  readonly name = 'Shopify Storefront'
  readonly priority = 90

  private readonly fetchImpl: typeof fetch
  private readonly browser: BrowserAdapter
  private readonly storage?: AssetStorage
  private readonly pageLimit: number
  private readonly maxPages: number

  constructor(options: ShopifyAdapterOptions = {}) {
    this.fetchImpl = options.fetchImpl ?? fetch
    this.browser = options.browser ?? new NoopBrowserAdapter()
    if (options.storage) this.storage = options.storage
    this.pageLimit = Math.min(Math.max(options.pageLimit ?? DEFAULT_PAGE_LIMIT, 1), 250)
    this.maxPages = Math.max(options.maxPages ?? DEFAULT_MAX_PAGES, 1)
  }

  async canHandle(url: string): Promise<boolean> {
    const parsed = safeParseUrl(url)
    if (!parsed) return false
    if (parsed.hostname.toLowerCase().endsWith(SHOPIFY_HOST_HINT)) return true

    try {
      const probe = await this.fetchJson<unknown>(productsUrl(parsed.origin, 1, 1), {
        retries: 0,
        timeoutMs: 8_000,
        allowNotFound: true,
      })
      if (!probe) return false
      const parsedProducts = shopifyProductsResponseSchema.safeParse(probe)
      return parsedProducts.success
    } catch {
      return false
    }
  }

  async scrape(url: string, options: ScrapeOptions = {}): Promise<ScrapedData> {
    const parsed = safeParseUrl(url)
    if (!parsed) throw new UnsupportedPlatformError(url)

    const origin = parsed.origin
    const domain = apexHostname(origin)

    const [products, collections, store] = await Promise.all([
      this.fetchAllProducts(origin, options),
      this.fetchCollections(origin, options),
      this.fetchStore(origin, domain, options),
    ])

    const normalizedProducts = await Promise.all(
      products.map((p) => this.normalizeProduct(p, origin, store.currency, options)),
    )

    const collectionResults = await Promise.all(
      collections.map((c) => this.normalizeCollection(c, origin, options)),
    )

    const screenshots = options.skipScreenshots
      ? {}
      : await this.captureScreenshots(origin, normalizedProducts, collectionResults, options)

    return {
      source: 'shopify',
      sourceUrl: url,
      store,
      products: normalizedProducts,
      collections: collectionResults,
      screenshots,
      scrapedAt: new Date(),
      confidence: 0.97,
      meta: {
        productCount: normalizedProducts.length,
        collectionCount: collectionResults.length,
      },
    }
  }

  // ── data fetching ───────────────────────────────────────────────

  private async fetchAllProducts(
    origin: string,
    options: ScrapeOptions,
  ): Promise<ShopifyProduct[]> {
    const collected: ShopifyProduct[] = []
    const max = options.maxProducts ?? Number.POSITIVE_INFINITY

    for (let page = 1; page <= this.maxPages; page++) {
      const url = productsUrl(origin, page, this.pageLimit)
      const body = await this.fetchJson<unknown>(url, {
        retries: 2,
        timeoutMs: options.timeoutMs ?? 30_000,
        signal: options.signal,
      })
      if (!body) break

      const parseResult = shopifyProductsResponseSchema.safeParse(body)
      if (!parseResult.success) {
        throw new DataValidationError(
          `Shopify /products.json returned unexpected payload at page ${page}`,
          { issues: parseResult.error.issues },
        )
      }
      if (parseResult.data.products.length === 0) break

      for (const product of parseResult.data.products) {
        collected.push(product)
        if (collected.length >= max) return collected
      }

      if (parseResult.data.products.length < this.pageLimit) break
    }

    return collected
  }

  private async fetchCollections(
    origin: string,
    options: ScrapeOptions,
  ): Promise<ShopifyCollection[]> {
    try {
      const body = await this.fetchJson<unknown>(`${origin}/collections.json?limit=250`, {
        retries: 1,
        timeoutMs: options.timeoutMs ?? 15_000,
        signal: options.signal,
        allowNotFound: true,
      })
      if (!body) return []
      const parseResult = shopifyCollectionsResponseSchema.safeParse(body)
      return parseResult.success ? parseResult.data.collections : []
    } catch {
      return []
    }
  }

  private async fetchStore(
    origin: string,
    domain: string,
    options: ScrapeOptions,
  ): Promise<ScrapedStore> {
    let currency = 'USD'
    let name = domain
    try {
      const body = await this.fetchJson<unknown>(`${origin}/meta.json`, {
        retries: 1,
        timeoutMs: 10_000,
        signal: options.signal,
        allowNotFound: true,
      })
      if (body) {
        const parsed = shopifyMetaSchema.safeParse(body)
        if (parsed.success && parsed.data.shop) {
          if (parsed.data.shop.currency) currency = parsed.data.shop.currency.toUpperCase()
          if (parsed.data.shop.name) name = parsed.data.shop.name
        }
      }
    } catch {
      /* swallow — store info is best-effort */
    }
    return {
      name,
      currency,
      language: 'en',
      domain,
    }
  }

  // ── normalisation ───────────────────────────────────────────────

  private async normalizeProduct(
    raw: ShopifyProduct,
    origin: string,
    currency: string,
    options: ScrapeOptions,
  ): Promise<ScrapedProduct> {
    const productUrl = `${origin}/products/${raw.handle}`

    const variants: ScrapedVariant[] = raw.variants.map((v) => {
      const optionMap: Record<string, string> = {}
      if (v.option1) optionMap[raw.options[0]?.name ?? 'option1'] = v.option1
      if (v.option2) optionMap[raw.options[1]?.name ?? 'option2'] = v.option2
      if (v.option3) optionMap[raw.options[2]?.name ?? 'option3'] = v.option3

      const variant: ScrapedVariant = {
        id: v.id,
        title: v.title,
        price: makeMoney(v.price, currency),
        available: v.available ?? (v.inventory_quantity == null ? true : v.inventory_quantity > 0),
      }
      if (v.sku) variant.sku = v.sku
      if (v.compare_at_price != null) {
        variant.compareAtPrice = makeMoney(v.compare_at_price, currency)
      }
      if (v.inventory_quantity != null) variant.inventoryQuantity = v.inventory_quantity
      if (Object.keys(optionMap).length > 0) variant.options = optionMap
      const featuredSrc = v.featured_image?.src
      if (featuredSrc) {
        const abs = absoluteUrl(featuredSrc, origin)
        if (abs) variant.imageUrl = abs
      }
      return variant
    })

    const images: ScrapedImage[] = raw.images
      .map((img) => {
        const abs = absoluteUrl(img.src, origin)
        if (!abs) return null
        const out: ScrapedImage = { url: abs }
        if (img.alt) out.alt = img.alt
        if (img.width) out.width = img.width
        if (img.height) out.height = img.height
        return out
      })
      .filter((img): img is ScrapedImage => img !== null)

    const mirrored =
      options.mirrorImages !== false
        ? await mirrorImages(images, {
            source: 'shopify',
            ...(this.storage ? { storage: this.storage } : {}),
            ...(options.siteId ? { siteId: options.siteId } : {}),
            ...(options.signal ? { signal: options.signal } : {}),
            fetchImpl: this.fetchImpl,
          })
        : images

    const product: ScrapedProduct = {
      id: raw.id,
      handle: raw.handle,
      title: raw.title,
      description: stripHtml(raw.body_html).trim(),
      descriptionHtml: raw.body_html,
      tags: raw.tags,
      images: mirrored,
      variants,
      priceFrom: lowestPrice(variants.map((v) => v.price)),
      available: variants.some((v) => v.available),
      url: productUrl,
    }
    if (raw.vendor) product.vendor = raw.vendor
    if (raw.product_type) product.productType = raw.product_type
    return product
  }

  private async normalizeCollection(
    raw: ShopifyCollection,
    origin: string,
    options: ScrapeOptions,
  ): Promise<ScrapedCollection> {
    const collectionUrl = `${origin}/collections/${raw.handle}`
    const handle = raw.handle || slugify(raw.title)

    let image: ScrapedImage | undefined
    if (raw.image?.src) {
      const abs = absoluteUrl(raw.image.src, origin)
      if (abs) {
        const baseImage: ScrapedImage = { url: abs }
        if (raw.image.alt) baseImage.alt = raw.image.alt
        if (raw.image.width) baseImage.width = raw.image.width
        if (raw.image.height) baseImage.height = raw.image.height
        image =
          options.mirrorImages !== false
            ? await mirrorImage(baseImage, {
                source: 'shopify',
                ...(this.storage ? { storage: this.storage } : {}),
                ...(options.siteId ? { siteId: options.siteId } : {}),
                ...(options.signal ? { signal: options.signal } : {}),
                fetchImpl: this.fetchImpl,
              })
            : baseImage
      }
    }

    const collection: ScrapedCollection = {
      id: raw.id,
      handle,
      title: raw.title,
      productIds: [],
      url: collectionUrl,
    }
    if (raw.description) collection.description = raw.description
    if (raw.products_count != null) collection.productCount = raw.products_count
    if (image) collection.image = image
    return collection
  }

  // ── screenshots ────────────────────────────────────────────────

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
    const firstProduct = products[0]
    if (firstProduct) targets.push({ key: 'productPage', url: firstProduct.url })
    const firstCollection = collections[0]
    if (firstCollection) targets.push({ key: 'categoryPage', url: firstCollection.url })

    const out: ScrapedData['screenshots'] = {}
    await Promise.all(
      targets.map(async ({ key, url }) => {
        try {
          const shot = await this.browser.screenshot(url, {
            fullPage: true,
            ...(options.signal ? { signal: options.signal } : {}),
          })
          if (this.storage) {
            const stored = await this.storage.put({
              key: `scrapes/${options.siteId ?? '_unbound'}/shopify/screenshot-${key}.png`,
              body: shot.bytes,
              contentType: shot.contentType,
            })
            out[key] = stored.url
          }
        } catch {
          /* screenshots best-effort */
        }
      }),
    )
    return out
  }

  // ── helpers ─────────────────────────────────────────────────────

  private async fetchJson<T>(
    url: string,
    options: { retries?: number; timeoutMs?: number; signal?: AbortSignal; allowNotFound?: boolean } = {},
  ): Promise<T | null> {
    const reqOptions: HttpRequestOptions = {
      method: 'GET',
      headers: { Accept: 'application/json' },
      fetchImpl: this.fetchImpl,
    }
    if (options.retries !== undefined) reqOptions.retries = options.retries
    if (options.timeoutMs !== undefined) reqOptions.timeoutMs = options.timeoutMs
    if (options.signal !== undefined) reqOptions.signal = options.signal
    if (options.allowNotFound !== undefined) reqOptions.allowNotFound = options.allowNotFound

    const res = await httpRequest<T>(url, reqOptions)
    if (res.status === 404) return null
    return res.data
  }
}

// ── module-private utilities ────────────────────────────────────

function safeParseUrl(input: string): URL | null {
  try {
    return new URL(input)
  } catch {
    return null
  }
}

function productsUrl(origin: string, page: number, limit: number): string {
  return `${origin}/products.json?limit=${limit}&page=${page}`
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
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
}
