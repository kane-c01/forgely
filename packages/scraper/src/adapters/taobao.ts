/**
 * Taobao / Tmall Adapter — 中国最大的 C2C / B2C 平台。
 *
 * 反爬最重（滑块验证码 + 设备指纹 + 限频 + 分布式封禁），生产环境必须配
 * 国内住宅代理池 + 真实 Chromium UA + 处理 _m_h5_tk token。
 *
 * 实现策略：
 *   A. tmall 旗舰店 PDP — `detail.tmall.com/item.htm?id=xxx` Playwright
 *   B. taobao C2C — 同上 + 卖家信誉抓取
 *   C. AI Vision 兜底
 *
 * @owner W1 — CN pivot (docs/PIVOT-CN.md §7)
 */
import { ScraperError, UnsupportedPlatformError } from '../errors.js'
import type { ScrapedData, ScraperAdapter, ScrapeOptions } from '../types.js'
import { GenericAIAdapter, type GenericAIAdapterOptions } from './generic-ai.js'

const HOSTS = [
  'taobao.com',
  'tmall.com',
  'detail.tmall.com',
  'item.taobao.com',
  'shop.tmall.com',
  'shop.taobao.com',
  'm.tb.cn',
]

export class TaobaoAdapter implements ScraperAdapter {
  readonly id = 'aliexpress' as const // 同属 Alibaba 集团，复用 platform 枚举
  readonly name = 'Taobao / Tmall'
  readonly priority = 75

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
        'Taobao adapter requires a Playwright + Vision fallback to be configured.',
        { code: 'NOT_CONFIGURED', retryable: false },
      )
    }
    try {
      return await this.fallback.scrape(url, options)
    } catch (err) {
      if (err instanceof ScraperError) throw err
      throw new ScraperError(`Taobao scrape failed: ${(err as Error).message}`, {
        code: 'SCRAPE_FAILED',
        retryable: true,
        cause: err,
      })
    }
  }
}
