// ── public types ────────────────────────────────────────────────
export type {
  AdapterRouteResult,
  MoneyAmount,
  ScrapeOptions,
  ScrapedCollection,
  ScrapedData,
  ScrapedImage,
  ScrapedProduct,
  ScrapedScreenshots,
  ScrapedStore,
  ScrapedVariant,
  ScraperAdapter,
  SourcePlatform,
} from './types.js'

export {
  scrapedDataSchema,
  scrapedProductSchema,
  scrapedCollectionSchema,
  scrapedStoreSchema,
} from './schemas.js'

// ── errors ──────────────────────────────────────────────────────
export {
  BlockedError,
  DataValidationError,
  NetworkError,
  NotFoundError,
  RateLimitedError,
  ScraperError,
  TimeoutError,
  UnauthorizedError,
  UnsupportedPlatformError,
  isRetryable,
} from './errors.js'

// ── infrastructure ──────────────────────────────────────────────
export { httpRequest } from './http/client.js'
export type { HttpRequestOptions, HttpResponse } from './http/client.js'

export { createScraperApiClient } from './http/scraperapi.js'
export type { ScraperApiClient, ScraperApiOptions } from './http/scraperapi.js'

export {
  NoopBrowserAdapter,
} from './browser/types.js'
export type {
  BrowserAdapter,
  RenderHtmlOptions,
  RenderHtmlResult,
  ScreenshotOptions,
  ScreenshotResult,
} from './browser/types.js'

export type {
  AssetStorage,
  GetAssetResult,
  PutAssetInput,
  PutAssetResult,
} from './storage/types.js'
export { InMemoryAssetStorage } from './storage/memory.js'
export { LocalAssetStorage } from './storage/local.js'

// ── AI fallback primitives ──────────────────────────────────────
export type {
  SelectorBundle,
  VisionAnalyzeInput,
  VisionAnalysisResult,
  VisionClient,
} from './ai/vision.js'
export type { RuleStore, ScraperRule } from './ai/rule-store.js'
export { InMemoryRuleStore } from './ai/rule-store.js'

// ── adapters ────────────────────────────────────────────────────
export { ShopifyAdapter } from './adapters/shopify.js'
export type { ShopifyAdapterOptions } from './adapters/shopify.js'

export { WooCommerceAdapter } from './adapters/woocommerce.js'
export type {
  WooCommerceAdapterOptions,
  WooCommerceCredentials,
} from './adapters/woocommerce.js'

export { AmazonAdapter } from './adapters/amazon.js'
export type { AmazonAdapterOptions } from './adapters/amazon.js'

export { AliExpressAdapter } from './adapters/aliexpress.js'
export type { AliExpressAdapterOptions } from './adapters/aliexpress.js'

export { EtsyAdapter } from './adapters/etsy.js'
export type { EtsyAdapterOptions } from './adapters/etsy.js'

export { GenericAIAdapter } from './adapters/generic-ai.js'
export type { GenericAIAdapterOptions } from './adapters/generic-ai.js'

// ── registry + factory ──────────────────────────────────────────
export { ScraperRegistry } from './registry.js'
export type { ScraperRegistryOptions } from './registry.js'

import type { BrowserAdapter } from './browser/types.js'
import type { ScraperApiClient, ScraperApiOptions } from './http/scraperapi.js'
import type { AssetStorage } from './storage/types.js'
import type { VisionClient } from './ai/vision.js'
import type { RuleStore } from './ai/rule-store.js'

import { AliExpressAdapter } from './adapters/aliexpress.js'
import { AmazonAdapter } from './adapters/amazon.js'
import { EtsyAdapter } from './adapters/etsy.js'
import { GenericAIAdapter } from './adapters/generic-ai.js'
import { ShopifyAdapter } from './adapters/shopify.js'
import { WooCommerceAdapter } from './adapters/woocommerce.js'
import { ScraperRegistry } from './registry.js'

export interface BuildScraperRegistryOptions {
  browser?: BrowserAdapter
  storage?: AssetStorage
  vision?: VisionClient
  ruleStore?: RuleStore
  scraperApi?: ScraperApiOptions | ScraperApiClient
  fetchImpl?: typeof fetch
  /** Disable specific adapters by id. */
  disable?: Array<'shopify' | 'woocommerce' | 'amazon' | 'aliexpress' | 'etsy' | 'generic_ai'>
}

/**
 * Convenience factory wiring up Forgely's default adapter set.
 *
 * The GenericAI fallback is only registered when both a `vision` client and
 * a real `browser` adapter are provided.
 */
export function buildDefaultScraperRegistry(
  options: BuildScraperRegistryOptions = {},
): ScraperRegistry {
  const disabled = new Set(options.disable ?? [])

  const enable = (id: string): boolean => !disabled.has(id as never)

  const fetchImpl = options.fetchImpl ?? fetch
  const sharedAdapterDeps = {
    fetchImpl,
    ...(options.browser ? { browser: options.browser } : {}),
    ...(options.storage ? { storage: options.storage } : {}),
  }

  let fallback: GenericAIAdapter | undefined
  if (enable('generic_ai') && options.vision && options.browser) {
    fallback = new GenericAIAdapter({
      browser: options.browser,
      vision: options.vision,
      ...(options.storage ? { storage: options.storage } : {}),
      ...(options.ruleStore ? { ruleStore: options.ruleStore } : {}),
      fetchImpl,
    })
  }

  const registry = new ScraperRegistry(fallback ? { fallback } : {})

  if (enable('shopify')) registry.register(new ShopifyAdapter(sharedAdapterDeps))
  if (enable('woocommerce')) registry.register(new WooCommerceAdapter(sharedAdapterDeps))

  if (enable('amazon')) {
    registry.register(
      new AmazonAdapter({
        ...(options.scraperApi !== undefined ? { scraperApi: options.scraperApi } : {}),
        ...(options.storage ? { storage: options.storage } : {}),
        fetchImpl,
      }),
    )
  }
  if (enable('aliexpress')) {
    registry.register(
      new AliExpressAdapter({
        ...(options.scraperApi !== undefined ? { scraperApi: options.scraperApi } : {}),
        ...(options.storage ? { storage: options.storage } : {}),
        fetchImpl,
      }),
    )
  }
  if (enable('etsy')) {
    registry.register(
      new EtsyAdapter({
        ...(options.scraperApi !== undefined ? { scraperApi: options.scraperApi } : {}),
        ...(options.storage ? { storage: options.storage } : {}),
        fetchImpl,
      }),
    )
  }

  return registry
}

export const __packageName = '@forgely/scraper'
