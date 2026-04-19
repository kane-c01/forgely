/**
 * Browser automation contract.
 *
 * Adapters never depend on Playwright directly — the runtime injects an
 * implementation (Playwright in production, a Noop in unit tests).
 */
export interface BrowserAdapter {
  /** Capture a full-page screenshot, return raw bytes + mime type. */
  screenshot(url: string, options?: ScreenshotOptions): Promise<ScreenshotResult>
  /** Render JS, return final HTML + URL after redirects. */
  renderHtml(url: string, options?: RenderHtmlOptions): Promise<RenderHtmlResult>
}

export interface ScreenshotOptions {
  fullPage?: boolean
  viewport?: { width: number; height: number }
  /** ms to wait for network idle. Default: 2000. */
  waitForIdleMs?: number
  signal?: AbortSignal
}

export interface ScreenshotResult {
  bytes: Uint8Array
  contentType: 'image/png' | 'image/jpeg' | 'image/webp'
}

export interface RenderHtmlOptions {
  /** ms to wait for network idle. Default: 5000. */
  waitForIdleMs?: number
  /** Scroll to bottom to trigger lazy products. Default: true. */
  scrollToBottom?: boolean
  signal?: AbortSignal
}

export interface RenderHtmlResult {
  html: string
  finalUrl: string
}

/**
 * Default no-op browser. Throws on any call so adapters that need a browser
 * fail fast in environments where one wasn't provided. Use only when you've
 * deliberately chosen `skipScreenshots: true`.
 */
export class NoopBrowserAdapter implements BrowserAdapter {
  async screenshot(): Promise<ScreenshotResult> {
    throw new Error(
      'NoopBrowserAdapter.screenshot called — provide a Playwright-backed BrowserAdapter to enable screenshots.',
    )
  }

  async renderHtml(): Promise<RenderHtmlResult> {
    throw new Error(
      'NoopBrowserAdapter.renderHtml called — provide a Playwright-backed BrowserAdapter to enable JS-rendered scraping.',
    )
  }
}
