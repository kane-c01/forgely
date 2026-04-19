import * as cheerio from 'cheerio'

import { InMemoryRuleStore, type RuleStore, type ScraperRule } from '../ai/rule-store.js'
import type { SelectorBundle, VisionClient } from '../ai/vision.js'
import { NoopBrowserAdapter, type BrowserAdapter } from '../browser/types.js'
import { ScraperError, UnsupportedPlatformError } from '../errors.js'
import { mirrorImages } from '../normalize/images.js'
import { makeMoney } from '../normalize/price.js'
import { absoluteUrl, apexHostname, slugify } from '../normalize/url.js'
import type { AssetStorage } from '../storage/types.js'
import type {
  ScrapeOptions,
  ScrapedData,
  ScrapedImage,
  ScrapedProduct,
  ScrapedVariant,
  ScraperAdapter,
} from '../types.js'

const PROMOTE_RULE_THRESHOLD = 3

export interface GenericAIAdapterOptions {
  browser: BrowserAdapter
  vision: VisionClient
  storage?: AssetStorage
  ruleStore?: RuleStore
  fetchImpl?: typeof fetch
  /**
   * When the rule store has a saved selector bundle for this hostname AND
   * its successRate exceeds this threshold, vision is skipped.
   * Default: 0.7.
   */
  cachedRuleConfidence?: number
}

/**
 * Last-resort adapter for unknown e-commerce sites.
 *
 * Pipeline:
 *  1. Look up a cached rule for the hostname (skip vision if confident).
 *  2. Render the page with the BrowserAdapter (HTML + screenshot).
 *  3. Ask the VisionClient to identify e-commerce structure + selectors.
 *  4. Apply selectors to the rendered HTML.
 *  5. Persist the rule when extraction yields enough products.
 */
export class GenericAIAdapter implements ScraperAdapter {
  readonly id = 'generic_ai' as const
  readonly name = 'Generic AI Fallback'
  readonly priority = 1

  private readonly browser: BrowserAdapter
  private readonly vision: VisionClient
  private readonly storage?: AssetStorage
  private readonly ruleStore: RuleStore
  private readonly fetchImpl: typeof fetch
  private readonly cachedRuleConfidence: number

  constructor(options: GenericAIAdapterOptions) {
    if (options.browser instanceof NoopBrowserAdapter) {
      throw new Error(
        'GenericAIAdapter requires a real BrowserAdapter (e.g. PlaywrightBrowserAdapter)',
      )
    }
    this.browser = options.browser
    this.vision = options.vision
    if (options.storage) this.storage = options.storage
    this.ruleStore = options.ruleStore ?? new InMemoryRuleStore()
    this.fetchImpl = options.fetchImpl ?? fetch
    this.cachedRuleConfidence = options.cachedRuleConfidence ?? 0.7
  }

  async canHandle(_url: string): Promise<boolean> {
    return true
  }

  async scrape(url: string, options: ScrapeOptions = {}): Promise<ScrapedData> {
    const parsed = safeParse(url)
    if (!parsed) throw new UnsupportedPlatformError(url)
    const hostname = apexHostname(url)

    // 1. Render HTML
    const renderOptions: { signal?: AbortSignal; waitForIdleMs?: number } = {}
    if (options.signal !== undefined) renderOptions.signal = options.signal
    const rendered = await this.browser.renderHtml(url, renderOptions)
    const html = rendered.html
    const finalUrl = rendered.finalUrl || url

    // 2. Selectors — cached first, vision second
    let selectors: SelectorBundle | null = null
    let storeMeta: { name?: string; currency?: string; language?: string } = {}
    let usedRule: ScraperRule | null = null
    const cached = await this.ruleStore.findByHostname(hostname)
    if (cached && cached.successRate >= this.cachedRuleConfidence) {
      selectors = cached.selectors
      usedRule = cached
    }

    if (!selectors) {
      const screenshotOptions: { signal?: AbortSignal } = {}
      if (options.signal !== undefined) screenshotOptions.signal = options.signal
      const screenshot = await this.browser.screenshot(url, screenshotOptions)
      const sample = html.slice(0, 50_000)
      const analysis = await this.vision.analyzeEcommercePage({
        imageBytes: screenshot.bytes,
        imageMimeType: screenshot.contentType,
        htmlSample: sample,
        url: finalUrl,
      })
      if (!analysis.isEcommerce || analysis.confidence < 0.5) {
        throw new UnsupportedPlatformError(url)
      }
      selectors = analysis.selectors
      storeMeta = analysis.storeMeta ?? {}
    }

    // 3. Apply selectors
    const products = await this.extract(html, finalUrl, selectors, options)
    if (products.length === 0) {
      throw new ScraperError(
        `Generic AI adapter could not extract any product from ${url}`,
        { code: 'GENERIC_AI_NO_PRODUCTS', source: 'generic_ai' },
      )
    }

    // 4. Promote rule when extraction succeeds
    if (!usedRule && products.length >= PROMOTE_RULE_THRESHOLD) {
      await this.ruleStore.save({
        hostname,
        selectors,
        successRate: 0.85,
        createdAt: new Date(),
        lastUsedAt: new Date(),
      })
    } else if (usedRule) {
      await this.ruleStore.save({
        ...usedRule,
        lastUsedAt: new Date(),
        successRate: Math.min(1, usedRule.successRate + 0.02),
      })
    }

    return {
      source: 'generic_ai',
      sourceUrl: url,
      store: {
        name: storeMeta.name ?? hostname,
        currency: storeMeta.currency ?? 'USD',
        language: storeMeta.language ?? 'en',
        domain: hostname,
      },
      products,
      collections: [],
      screenshots: {},
      scrapedAt: new Date(),
      confidence: usedRule ? 0.7 : 0.6,
      meta: { reusedRule: Boolean(usedRule), selectors },
    }
  }

  private async extract(
    html: string,
    url: string,
    selectors: SelectorBundle,
    options: ScrapeOptions,
  ): Promise<ScrapedProduct[]> {
    const $ = cheerio.load(html)
    const root = selectors.productList ? $(selectors.productList) : $.root()
    const cards = root.find(selectors.productCard).toArray()

    const max = options.maxProducts ?? cards.length
    const out: ScrapedProduct[] = []

    for (let i = 0; i < Math.min(cards.length, max); i++) {
      const el = cards[i]
      if (!el) continue
      const $card = $(el)

      const title = selectors.title ? $card.find(selectors.title).first().text().trim() : ''
      if (!title) continue

      const link = selectors.link ? $card.find(selectors.link).first().attr('href') : null
      const productUrl = link ? absoluteUrl(link, url) ?? url : url
      const priceText = selectors.price ? $card.find(selectors.price).first().text().trim() : ''
      const description = selectors.description
        ? $card.find(selectors.description).first().text().replace(/\s+/g, ' ').trim()
        : ''
      const imgSrc = selectors.image ? $card.find(selectors.image).first().attr('src') : null
      const imgAbs = imgSrc ? absoluteUrl(imgSrc, url) : null

      let price
      try {
        price = makeMoney(priceText || '0', 'USD', priceText || undefined)
      } catch {
        price = makeMoney(0, 'USD')
      }

      const handle = slugify(title)
      const variant: ScrapedVariant = {
        id: `${handle}-default`,
        title,
        price,
        available: true,
      }

      const images: ScrapedImage[] = imgAbs ? [{ url: imgAbs }] : []
      const mirrored =
        options.mirrorImages !== false
          ? await mirrorImages(images, {
              source: 'generic_ai',
              ...(this.storage ? { storage: this.storage } : {}),
              ...(options.siteId ? { siteId: options.siteId } : {}),
              ...(options.signal ? { signal: options.signal } : {}),
              fetchImpl: this.fetchImpl,
            })
          : images

      out.push({
        id: handle,
        handle,
        title,
        description,
        tags: [],
        images: mirrored,
        variants: [variant],
        priceFrom: price,
        available: true,
        url: productUrl,
      })
    }

    return out
  }
}

function safeParse(input: string): URL | null {
  try {
    return new URL(input)
  } catch {
    return null
  }
}
