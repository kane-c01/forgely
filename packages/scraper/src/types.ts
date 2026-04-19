/**
 * Unified scraper contracts.
 *
 * Every adapter (Shopify, WooCommerce, Amazon, AliExpress, Etsy, GenericAI ...)
 * MUST emit `ScrapedData` so downstream Analyzer / Planner agents can stay
 * source-agnostic.
 */

export type SourcePlatform =
  | 'shopify'
  | 'woocommerce'
  | 'amazon'
  | 'aliexpress'
  | 'etsy'
  | 'generic_ai'
  | 'unknown'

export interface MoneyAmount {
  /** Money value expressed in **minor units** (e.g. cents). Always integer. */
  amountCents: number
  /** ISO 4217 currency code, uppercase. */
  currency: string
  /** Original raw value as it appeared on the source (for auditing). */
  raw?: string
}

export interface ScrapedImage {
  /** Original (or proxied) image URL. */
  url: string
  /** URL on Forgely-controlled storage after mirroring (filled by storage layer). */
  storedUrl?: string
  alt?: string
  width?: number
  height?: number
}

export interface ScrapedVariant {
  id: string
  title: string
  sku?: string
  price: MoneyAmount
  compareAtPrice?: MoneyAmount
  available: boolean
  inventoryQuantity?: number
  options?: Record<string, string>
  imageUrl?: string
}

export interface ScrapedProduct {
  /** Stable id from source (e.g. shopify gid, asin, etsy listing id). */
  id: string
  handle: string
  title: string
  description: string
  descriptionHtml?: string
  vendor?: string
  productType?: string
  tags: string[]
  images: ScrapedImage[]
  variants: ScrapedVariant[]
  /** Pre-computed lowest variant price for ranking convenience. */
  priceFrom: MoneyAmount
  /** True if any variant is available. */
  available: boolean
  url: string
  category?: string
  reviewCount?: number
  rating?: number
}

export interface ScrapedCollection {
  id: string
  handle: string
  title: string
  description?: string
  productCount?: number
  productIds: string[]
  url: string
  image?: ScrapedImage
}

export interface ScrapedScreenshots {
  homepage?: string
  productPage?: string
  categoryPage?: string
}

export interface ScrapedStore {
  name: string
  description?: string
  logo?: string
  currency: string
  language: string
  domain: string
}

export interface ScrapedData {
  source: SourcePlatform
  sourceUrl: string
  store: ScrapedStore
  products: ScrapedProduct[]
  collections: ScrapedCollection[]
  screenshots: ScrapedScreenshots
  scrapedAt: Date
  /**
   * 0..1 — adapter's own confidence in the dataset.
   * - Tier 1 (official APIs): 0.95+
   * - Tier 2 (HTML scraping): 0.7-0.9
   * - Tier 3 (AI fallback): 0.5-0.7
   */
  confidence: number
  /** Free-form diagnostic info for ops. */
  meta?: Record<string, unknown>
}

export interface ScrapeOptions {
  /** Max number of products to fetch. Adapters MAY honour this for cost control. */
  maxProducts?: number
  /** Skip screenshots (fast path for analyzers). */
  skipScreenshots?: boolean
  /** Mirror remote images into Forgely storage. Default: true if storage supplied. */
  mirrorImages?: boolean
  /** Site id used as a folder prefix when mirroring assets. */
  siteId?: string
  /** Per-request timeout (ms). Default: 30_000. */
  timeoutMs?: number
  /** AbortSignal for cancellation. */
  signal?: AbortSignal
  /** Adapter-specific extras (e.g. WooCommerce API key). */
  credentials?: Record<string, string>
}

export interface ScraperAdapter {
  /** Stable identifier, also used for telemetry. */
  readonly id: SourcePlatform
  /** Human-readable name. */
  readonly name: string
  /** 0..100, higher wins when multiple adapters match the same URL. */
  readonly priority: number

  /**
   * Cheap detection — should NOT do heavy work.
   * SHOULD return false (instead of throwing) when unsure.
   */
  canHandle(url: string): Promise<boolean>

  /** Run the actual scrape. */
  scrape(url: string, options?: ScrapeOptions): Promise<ScrapedData>
}

export interface AdapterRouteResult {
  adapter: ScraperAdapter
  /** True if multiple adapters claimed the URL (winner is highest priority). */
  ambiguous: boolean
  considered: SourcePlatform[]
}
