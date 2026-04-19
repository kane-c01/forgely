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

export { NoopBrowserAdapter } from './browser/types.js'
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

export type {
  PrismaLikeClient,
  PrismaRuleStoreOptions,
  PrismaScraperRuleDelegate,
  PrismaScraperRuleRow,
} from './ai/prisma-rule-store.js'
export { PrismaRuleStore } from './ai/prisma-rule-store.js'

// ── adapters ────────────────────────────────────────────────────
export { ShopifyAdapter } from './adapters/shopify.js'
export type { ShopifyAdapterOptions } from './adapters/shopify.js'

export { WooCommerceAdapter } from './adapters/woocommerce.js'
export type { WooCommerceAdapterOptions, WooCommerceCredentials } from './adapters/woocommerce.js'

export { AmazonAdapter } from './adapters/amazon.js'
export type { AmazonAdapterOptions } from './adapters/amazon.js'

export { AliExpressAdapter } from './adapters/aliexpress.js'
export type { AliExpressAdapterOptions } from './adapters/aliexpress.js'

export { EtsyAdapter } from './adapters/etsy.js'
export type { EtsyAdapterOptions } from './adapters/etsy.js'

export { Alibaba1688Adapter } from './adapters/alibaba1688/index.js'
export type { Alibaba1688AdapterOptions } from './adapters/alibaba1688/index.js'

export { TaobaoAdapter } from './adapters/taobao/index.js'
export type { TaobaoAdapterOptions } from './adapters/taobao/index.js'

export { JdAdapter } from './adapters/jd/index.js'
export type { JdAdapterOptions } from './adapters/jd/index.js'

export { PinduoduoAdapter } from './adapters/pinduoduo/index.js'
export type { PinduoduoAdapterOptions } from './adapters/pinduoduo/index.js'

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

import { Alibaba1688Adapter } from './adapters/alibaba1688/index.js'
import { AliExpressAdapter } from './adapters/aliexpress.js'
import { AmazonAdapter } from './adapters/amazon.js'
import { EtsyAdapter } from './adapters/etsy.js'
import { GenericAIAdapter } from './adapters/generic-ai.js'
import { JdAdapter } from './adapters/jd/index.js'
import { PinduoduoAdapter } from './adapters/pinduoduo/index.js'
import { ShopifyAdapter } from './adapters/shopify.js'
import { TaobaoAdapter } from './adapters/taobao/index.js'
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
  disable?: Array<
    | 'shopify'
    | 'woocommerce'
    | 'amazon'
    | 'aliexpress'
    | 'alibaba_1688'
    | 'taobao'
    | 'jd'
    | 'pinduoduo'
    | 'etsy'
    | 'generic_ai'
  >
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

  // ── China Tier-2 (Persona A) — prefer Playwright browser when supplied,
  // fall back to ScraperAPI / direct fetch.
  const cnDeps = {
    fetchImpl,
    ...(options.browser ? { browser: options.browser } : {}),
    ...(options.scraperApi !== undefined ? { scraperApi: options.scraperApi } : {}),
    ...(options.storage ? { storage: options.storage } : {}),
  }
  if (enable('alibaba_1688')) registry.register(new Alibaba1688Adapter(cnDeps))
  if (enable('taobao')) registry.register(new TaobaoAdapter(cnDeps))
  if (enable('jd')) registry.register(new JdAdapter(cnDeps))
  if (enable('pinduoduo')) registry.register(new PinduoduoAdapter(cnDeps))

  return registry
}

export const __packageName = '@forgely/scraper'
