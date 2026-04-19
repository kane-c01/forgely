import type {
  BrowserAdapter,
  RenderHtmlOptions,
  RenderHtmlResult,
  ScreenshotOptions,
  ScreenshotResult,
} from '@forgely/scraper'
import { chromium, type Browser, type LaunchOptions } from 'playwright'

/**
 * Subset of `playwright` we depend on. Tests can inject a fake matching
 * this shape without bundling the real browser.
 */
export interface BrowserLauncher {
  launch(options?: LaunchOptions): Promise<Browser>
}

export interface PlaywrightBrowserAdapterOptions {
  /** Passed straight to `chromium.launch()`. Default: `{ headless: true }`. */
  launchOptions?: LaunchOptions
  /**
   * Reuse a single Browser across calls. Default true. Set false when running
   * one-shot scrapes where lifetime cleanliness matters more than warm-start.
   */
  persistent?: boolean
  /** Default viewport for screenshots / pages. */
  defaultViewport?: { width: number; height: number }
  /** Custom launcher (test seam). Defaults to playwright's chromium. */
  launcher?: BrowserLauncher
}

/**
 * Thin Playwright wrapper that fulfills `@forgely/scraper`'s BrowserAdapter
 * contract. Lives in its own package so the core scraper stays Worker /
 * Lambda-friendly.
 */
export class PlaywrightBrowserAdapter implements BrowserAdapter {
  private browserPromise: Promise<Browser> | null = null
  private readonly launcher: BrowserLauncher
  private readonly launchOptions: LaunchOptions
  private readonly persistent: boolean
  private readonly defaultViewport: { width: number; height: number }

  constructor(options: PlaywrightBrowserAdapterOptions = {}) {
    this.launcher = options.launcher ?? chromium
    this.launchOptions = { headless: true, ...(options.launchOptions ?? {}) }
    this.persistent = options.persistent !== false
    this.defaultViewport = options.defaultViewport ?? { width: 1440, height: 900 }
  }

  async screenshot(url: string, options: ScreenshotOptions = {}): Promise<ScreenshotResult> {
    const lease = await this.acquire()
    try {
      const context = await lease.browser.newContext({
        viewport: options.viewport ?? this.defaultViewport,
      })
      try {
        const page = await context.newPage()
        await page.goto(url, {
          waitUntil: 'networkidle',
          timeout: options.waitForIdleMs ?? 30_000,
        })
        const buffer = await page.screenshot({
          fullPage: options.fullPage ?? true,
          type: 'png',
        })
        // Always normalise to a plain Uint8Array (Node Buffer subclasses
        // Uint8Array but its `type: 'Buffer'` baggage breaks downstream
        // deep equality).
        const bytes = Uint8Array.from(buffer)
        return { bytes, contentType: 'image/png' }
      } finally {
        await context.close()
      }
    } finally {
      await lease.release()
    }
  }

  async renderHtml(url: string, options: RenderHtmlOptions = {}): Promise<RenderHtmlResult> {
    const lease = await this.acquire()
    try {
      const context = await lease.browser.newContext({ viewport: this.defaultViewport })
      try {
        const page = await context.newPage()
        const response = await page.goto(url, {
          waitUntil: 'networkidle',
          timeout: options.waitForIdleMs ?? 30_000,
        })
        if (options.scrollToBottom !== false) {
          await page.evaluate(async () => {
            await new Promise<void>((resolve) => {
              let total = 0
              const step = () => {
                window.scrollBy(0, 600)
                total += 600
                if (total >= document.body.scrollHeight - window.innerHeight) {
                  resolve()
                  return
                }
                setTimeout(step, 120)
              }
              step()
            })
          })
          await page.waitForTimeout(500)
        }
        const html = await page.content()
        const finalUrl = response?.url() ?? url
        return { html, finalUrl }
      } finally {
        await context.close()
      }
    } finally {
      await lease.release()
    }
  }

  /** Close the underlying browser. Always call before process exit. */
  async close(): Promise<void> {
    if (this.browserPromise) {
      const browser = await this.browserPromise
      this.browserPromise = null
      await browser.close()
    }
  }

  private async acquire(): Promise<{ browser: Browser; release: () => Promise<void> }> {
    if (this.persistent) {
      if (!this.browserPromise) {
        this.browserPromise = this.launcher.launch(this.launchOptions)
      }
      const browser = await this.browserPromise
      return { browser, release: async () => {} }
    }
    const browser = await this.launcher.launch(this.launchOptions)
    return {
      browser,
      release: async () => {
        await browser.close()
      },
    }
  }
}
