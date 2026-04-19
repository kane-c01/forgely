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
import { GenericAIAdapter } from './generic-ai.js'

const HOSTS = ['1688.com', 'detail.1688.com', 'shop.1688.com', 'm.1688.com']

export class Y1688Adapter implements ScraperAdapter {
  readonly id = 'aliexpress' as const // 复用 source platform 枚举（1688 / AE 同属 alibaba 集团）
  readonly name = '1688 Wholesale (Alibaba)'
  readonly priority = 70

  private readonly fallback = new GenericAIAdapter()

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

    // Strategy A/B: real Playwright + 1688 specific selectors would live here.
    // We currently delegate to GenericAI for completeness; subclassed selectors
    // get added in T28 (W4 already has generic-ai online).
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
