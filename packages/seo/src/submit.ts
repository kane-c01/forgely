/**
 * Sitemap submission to search consoles
 *
 * 支持向 Google / Bing / 百度站长平台 / 头条 自动 ping 提交 sitemap.xml。
 *
 * 设计要点:
 * - fetcher DI（便于测试 + 在 Cloudflare Worker / Edge 跑）
 * - 所有结果通过 `SubmitResult[]` 一次性返回，不抛异常（部分失败不阻塞其他）
 * - 百度站长平台需 `BAIDU_ZZ_TOKEN` 环境变量
 * - 头条搜索需 `TOUTIAO_TOKEN`
 * - Google Indexing API（可选）需 OAuth；本文件先实现 ping 形式
 */

import { joinUrl } from './utils/url.js'
import type { SiteMeta } from './types.js'

export type SearchEngine = 'google' | 'bing' | 'baidu' | 'toutiao'

export interface SubmitOptions {
  /** override fetch (test) */
  fetcher?: typeof fetch
  /** 仅向这些引擎提交；默认全部 */
  engines?: SearchEngine[]
  /** 站点 sitemap URL（默认 ${baseUrl}/sitemap.xml） */
  sitemapPath?: string
  /** 百度站长平台 site token（必须） */
  baiduToken?: string
  /** 头条搜索 token（必须） */
  toutiaoToken?: string
  /** 是否使用 https / http2 ping（Google / Bing 已停止 ping，仅记录尝试） */
  legacyPing?: boolean
}

export interface SubmitResult {
  engine: SearchEngine
  status: 'ok' | 'skipped' | 'failed'
  /** HTTP status returned (if any) */
  httpStatus?: number
  /** Endpoint that was hit */
  endpoint: string
  message?: string
}

const BAIDU_PUSH = 'http://data.zz.baidu.com/urls'
const TOUTIAO_PUSH = 'https://zz.toutiao.com/api/sitemap'

/**
 * 提交 sitemap.xml 到所有指定的搜索引擎。
 *
 * 不抛异常：每个引擎的成败独立写入 SubmitResult[]，调用方决定如何展示。
 */
export async function submitSitemap(
  site: SiteMeta,
  options: SubmitOptions = {},
): Promise<SubmitResult[]> {
  const fetcher = options.fetcher ?? fetch
  const sitemapUrl = joinUrl(site.baseUrl, options.sitemapPath ?? '/sitemap.xml')
  const engines: SearchEngine[] = options.engines ?? ['google', 'bing', 'baidu', 'toutiao']
  const results: SubmitResult[] = []

  for (const engine of engines) {
    if (engine === 'google') {
      results.push(await submitGoogle(fetcher, sitemapUrl, options.legacyPing ?? false))
    } else if (engine === 'bing') {
      results.push(await submitBing(fetcher, sitemapUrl, options.legacyPing ?? false))
    } else if (engine === 'baidu') {
      results.push(await submitBaidu(fetcher, site, sitemapUrl, options.baiduToken))
    } else if (engine === 'toutiao') {
      results.push(await submitToutiao(fetcher, site, sitemapUrl, options.toutiaoToken))
    }
  }
  return results
}

async function submitGoogle(
  fetcher: typeof fetch,
  sitemapUrl: string,
  legacy: boolean,
): Promise<SubmitResult> {
  const endpoint = legacy
    ? `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`
    : 'https://indexing.googleapis.com/v3/urlNotifications:publish'
  if (!legacy) {
    return {
      engine: 'google',
      status: 'skipped',
      endpoint,
      message:
        'Google deprecated the ping endpoint in 2023; use the Indexing API (OAuth) for per-URL pushes or rely on sitemap fetch via Search Console.',
    }
  }
  return tryGet(fetcher, endpoint, 'google')
}

async function submitBing(
  fetcher: typeof fetch,
  sitemapUrl: string,
  legacy: boolean,
): Promise<SubmitResult> {
  const endpoint = legacy
    ? `https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`
    : 'https://ssl.bing.com/webmaster/api.svc/json/SubmitUrlbatch'
  if (!legacy) {
    return {
      engine: 'bing',
      status: 'skipped',
      endpoint,
      message:
        'Bing recommends the Webmaster API (key required); ping endpoint may still work but is deprecated.',
    }
  }
  return tryGet(fetcher, endpoint, 'bing')
}

async function submitBaidu(
  fetcher: typeof fetch,
  site: SiteMeta,
  _sitemapUrl: string,
  token?: string,
): Promise<SubmitResult> {
  const endpoint = `${BAIDU_PUSH}?site=${encodeURIComponent(site.baseUrl)}&token=${token ?? '<TOKEN>'}`
  if (!token) {
    return {
      engine: 'baidu',
      status: 'skipped',
      endpoint,
      message: 'Set options.baiduToken (from 百度站长平台 → 站点管理 → 链接提交).',
    }
  }
  try {
    const body = `${site.baseUrl}/\n` // minimal — caller can extend with all URLs
    const res = await fetcher(endpoint, {
      method: 'POST',
      body,
      headers: { 'Content-Type': 'text/plain' },
    })
    return {
      engine: 'baidu',
      status: res.ok ? 'ok' : 'failed',
      httpStatus: res.status,
      endpoint,
      message: res.ok ? 'Submitted to 百度站长平台' : `HTTP ${res.status}`,
    }
  } catch (err) {
    return { engine: 'baidu', status: 'failed', endpoint, message: (err as Error).message }
  }
}

async function submitToutiao(
  fetcher: typeof fetch,
  site: SiteMeta,
  sitemapUrl: string,
  token?: string,
): Promise<SubmitResult> {
  const endpoint = `${TOUTIAO_PUSH}/submit`
  if (!token) {
    return {
      engine: 'toutiao',
      status: 'skipped',
      endpoint,
      message: 'Set options.toutiaoToken (from 头条搜索 → 站长平台 → 资源提交).',
    }
  }
  try {
    const res = await fetcher(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ site: site.baseUrl, sitemap: sitemapUrl }),
    })
    return {
      engine: 'toutiao',
      status: res.ok ? 'ok' : 'failed',
      httpStatus: res.status,
      endpoint,
      message: res.ok ? 'Submitted to 头条搜索' : `HTTP ${res.status}`,
    }
  } catch (err) {
    return { engine: 'toutiao', status: 'failed', endpoint, message: (err as Error).message }
  }
}

async function tryGet(
  fetcher: typeof fetch,
  endpoint: string,
  engine: SearchEngine,
): Promise<SubmitResult> {
  try {
    const res = await fetcher(endpoint)
    return {
      engine,
      status: res.ok ? 'ok' : 'failed',
      httpStatus: res.status,
      endpoint,
    }
  } catch (err) {
    return { engine, status: 'failed', endpoint, message: (err as Error).message }
  }
}
