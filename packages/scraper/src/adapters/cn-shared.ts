/**
 * Shared primitives for the four China-platform adapters
 * (1688 / Taobao+Tmall / JD / Pinduoduo).
 *
 * Each platform exposes its own `selectors.ts` module with a CSS-selector
 * bundle and (optionally) a structured-data extraction function. The adapter
 * itself stays thin: it picks an HTML source (Playwright BrowserAdapter
 * preferred → ScraperAPI fallback → direct fetch as last resort) and runs
 * the selectors against it.
 */
import type * as cheerio from 'cheerio'

import type { BrowserAdapter, RenderHtmlResult } from '../browser/types.js'
import { ScraperError } from '../errors.js'
import { httpRequest, type HttpRequestOptions } from '../http/client.js'
import type { ScraperApiClient } from '../http/scraperapi.js'

export type CheerioRoot = cheerio.CheerioAPI

export interface CnSelectorBundle {
  /** Page title — used for product `title`. */
  title: string[]
  /** Price text. */
  price: string[]
  /** Vendor / shop name. */
  vendor: string[]
  /** Image candidates (multiple `img` selectors are merged + de-duped). */
  images: string[]
  /** Product gallery container (used as scope for `images`). */
  gallery?: string[]
  /** Breadcrumb-like category text. */
  category?: string[]
  /** Description text. */
  description?: string[]
}

export interface CnFetchOptions {
  url: string
  /** Preferred path: render with Playwright. */
  browser?: BrowserAdapter
  /** Fallback path: SaaS render (ScraperAPI). */
  scraperApi?: ScraperApiClient
  /** Last-resort: direct fetch (works for cached endpoints + tests). */
  fetchImpl?: typeof fetch
  /** Per-request timeout. */
  timeoutMs?: number
  /** Abort signal. */
  signal?: AbortSignal
  /** Optional proxy URL forwarded to ScraperAPI / Playwright launchOptions. */
  proxyUrl?: string
}

export interface CnFetchResult {
  html: string
  finalUrl: string
  /** How the HTML was sourced (for telemetry / confidence scoring). */
  via: 'browser' | 'scraperapi' | 'direct-fetch'
}

/**
 * Acquire HTML for `options.url` using the most reliable path available.
 *
 * Priority:
 *   1. Real browser (Playwright) — handles JS render + most anti-bot
 *   2. ScraperAPI — proxy + render-as-a-service
 *   3. Plain fetch — works for cached PDP / mobile pages / tests
 */
export async function fetchCnHtml(options: CnFetchOptions): Promise<CnFetchResult> {
  const { url, browser, scraperApi, fetchImpl, signal, timeoutMs } = options

  if (browser) {
    try {
      const renderOptions: { signal?: AbortSignal; waitForIdleMs?: number } = {}
      if (signal !== undefined) renderOptions.signal = signal
      if (timeoutMs !== undefined) renderOptions.waitForIdleMs = timeoutMs
      const rendered: RenderHtmlResult = await browser.renderHtml(url, renderOptions)
      return { html: rendered.html, finalUrl: rendered.finalUrl || url, via: 'browser' }
    } catch (err) {
      // browser rendering failed → try the next layer
      if (!scraperApi && !fetchImpl) {
        throw new ScraperError(
          `Browser-based fetch failed for ${url} and no fallback configured: ${(err as Error).message}`,
          { code: 'CN_BROWSER_FAILED', source: 'unknown', cause: err },
        )
      }
    }
  }

  if (scraperApi) {
    try {
      const apiOptions: { signal?: AbortSignal; timeoutMs?: number } = {}
      if (signal !== undefined) apiOptions.signal = signal
      if (timeoutMs !== undefined) apiOptions.timeoutMs = timeoutMs
      const html = await scraperApi.fetchHtml(url, apiOptions)
      return { html, finalUrl: url, via: 'scraperapi' }
    } catch (err) {
      if (!fetchImpl) {
        throw new ScraperError(`ScraperAPI failed for ${url}: ${(err as Error).message}`, {
          code: 'CN_SCRAPERAPI_FAILED',
          source: 'unknown',
          cause: err,
        })
      }
    }
  }

  const reqOptions: HttpRequestOptions = {
    headers: {
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.5',
    },
    retries: 1,
    timeoutMs: timeoutMs ?? 20_000,
  }
  if (fetchImpl !== undefined) reqOptions.fetchImpl = fetchImpl
  if (signal !== undefined) reqOptions.signal = signal

  const res = await httpRequest<string>(url, reqOptions)
  return { html: String(res.data), finalUrl: res.url || url, via: 'direct-fetch' }
}

/** Returns the first non-empty match across a list of selectors. */
export function pickFirst($: CheerioRoot, selectors: string[]): string | null {
  for (const sel of selectors) {
    if (sel.startsWith('meta[')) {
      const v = $(sel).attr('content')
      if (v && v.trim()) return v.trim()
    } else if (sel.includes('@')) {
      const [css, attr] = sel.split('@')
      if (!css || !attr) continue
      const v = $(css).first().attr(attr)
      if (v && v.trim()) return v.trim()
    } else {
      const t = $(sel).first().text().trim()
      if (t) return t
    }
  }
  return null
}

/** Collect deduped image URLs from a gallery + meta:og tags. */
export function collectImagesByBundle(
  $: CheerioRoot,
  bundle: CnSelectorBundle,
  base: string,
): string[] {
  const seen = new Set<string>()
  const out: string[] = []

  const og = $('meta[property="og:image"]').attr('content')
  pushIfAbsolute(og, base, seen, out)

  const scope = bundle.gallery ? $(bundle.gallery.join(',')) : $.root()
  for (const sel of bundle.images) {
    scope.find(sel).each((_, el) => {
      const $el = $(el)
      const src =
        $el.attr('src') ??
        $el.attr('data-src') ??
        $el.attr('data-lazy-src') ??
        $el.attr('data-image-src')
      pushIfAbsolute(src, base, seen, out)
    })
  }
  return out
}

function pushIfAbsolute(
  raw: string | undefined | null,
  base: string,
  seen: Set<string>,
  out: string[],
): void {
  if (!raw) return
  const trimmed = raw.trim()
  if (!trimmed) return
  let absolute: string
  try {
    absolute = new URL(trimmed, base).toString()
  } catch {
    return
  }
  if (seen.has(absolute)) return
  seen.add(absolute)
  out.push(absolute)
}
