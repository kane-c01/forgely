/**
 * 1688 Adapter — 中国 B2B 批发平台。
 *
 * 1688 没有公开 REST，且反爬严格（云盾 + 限频 + JS 渲染）。
 * 我们走 Playwright + 国内代理池 + Vision 兜底（复用 W4 generic-ai）。
 *
 * 实现策略（按优先级）：
 *   A. 商家页 GET https://shop{shopId}.1688.com/page/offerlist.htm — Playwright
 *   B. 商品搜索 + 单品页解析（PDP 结构稳定）
 *   C. AI Vision 兜底（generic-ai adapter）
 *
 * @owner W1 — CN pivot (docs/PIVOT-CN.md §7)
 */
import { ScraperError, UnsupportedPlatformError } from '../errors.js'
import type { ScrapedData, ScraperAdapter, ScrapeOptions } from '../types.js'
import { GenericAIAdapter, type GenericAIAdapterOptions } from './generic-ai.js'

const HOSTS = ['1688.com', 'detail.1688.com', 'shop.1688.com', 'm.1688.com']

/**
 * 1688 adapter — production deployments must inject the GenericAI options
 * (browser + vision) so we can fall back when 1688-specific selectors miss.
 *
 * In dev / tests the adapter just refuses gracefully so unit tests can
 * still typecheck without a Playwright runtime.
 */
export class Y1688Adapter implements ScraperAdapter {
  readonly id = 'aliexpress' as const // 复用 source platform 枚举（1688 / AE 同属 alibaba 集团）
  readonly name = '1688 Wholesale (Alibaba)'
  readonly priority = 70

  private readonly fallback?: GenericAIAdapter

  constructor(options?: { fallback?: GenericAIAdapterOptions }) {
    if (options?.fallback) {
      this.fallback = new GenericAIAdapter(options.fallback)
    }
  }

  async canHandle(url: string): Promise<boolean> {
    try {
      const u = new URL(url)
      return HOSTS.some((h) => u.hostname.endsWith(h))
    } catch {
      return false
    }
  }

  async scrape(url: string, options: ScrapeOptions = {}): Promise<ScrapedData> {
    if (!(await this.canHandle(url))) throw new UnsupportedPlatformError(url)
    if (!this.fallback) {
      throw new ScraperError(
        '1688 adapter requires a Playwright + Vision fallback to be configured.',
        { code: 'NOT_CONFIGURED', retryable: false },
      )
    }
    try {
      return await this.fallback.scrape(url, options)
    } catch (err) {
      if (err instanceof ScraperError) throw err
      throw new ScraperError(`1688 scrape failed: ${(err as Error).message}`, {
        code: 'SCRAPE_FAILED',
        retryable: true,
        cause: err,
      })
    }
  }
}
