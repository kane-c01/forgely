/**
 * sitemap.xml 生成
 *
 * - 支持单 / 多文件分片 (≥ 50,000 URL 时自动 sitemap-index)
 * - 支持 hreflang alternates
 * - 不依赖 fs：只输出字符串，由调用方写到 R2 / Edge KV / Worker response
 *
 * 参考: https://www.sitemaps.org/protocol.html
 */

import type { ChangeFreq, PageMeta, SiteMeta, SitemapEntry } from './types.js'
import { clampPriority, escapeXml, joinUrl } from './utils/url.js'

const MAX_URLS_PER_FILE = 50_000

export interface BuildSitemapOptions {
  /** 默认 changefreq，未在 PageMeta 指定时使用 */
  defaultChangefreq?: ChangeFreq
  /** 默认 priority */
  defaultPriority?: number
  /** 仅包含这些 path 前缀；默认包含所有 */
  include?: (page: PageMeta) => boolean
}

/** 把 PageMeta[] 转成 SitemapEntry[]（处理 alternates / 默认值） */
export function toEntries(
  site: SiteMeta,
  pages: PageMeta[],
  options: BuildSitemapOptions = {},
): SitemapEntry[] {
  return pages
    .filter((p) => !p.noindex)
    .filter((p) => !options.include || options.include(p))
    .map((page) => {
      const alternates = page.alternates
        ? Object.entries(page.alternates).map(([hreflang, href]) => ({
            hreflang,
            href: joinUrl(site.baseUrl, href),
          }))
        : undefined
      return {
        loc: joinUrl(site.baseUrl, page.path),
        lastmod: page.lastmod,
        changefreq: page.changefreq ?? options.defaultChangefreq,
        priority: clampPriority(page.priority ?? options.defaultPriority),
        alternates,
      }
    })
}

/** 把 entries 渲染成单个 sitemap.xml 字符串 */
export function renderSitemap(entries: SitemapEntry[]): string {
  const lines: string[] = ['<?xml version="1.0" encoding="UTF-8"?>']
  const needXhtml = entries.some((e) => e.alternates && e.alternates.length > 0)
  lines.push(
    needXhtml
      ? '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">'
      : '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  )
  for (const e of entries) {
    lines.push('  <url>')
    lines.push(`    <loc>${escapeXml(e.loc)}</loc>`)
    if (e.lastmod) lines.push(`    <lastmod>${escapeXml(e.lastmod)}</lastmod>`)
    if (e.changefreq) lines.push(`    <changefreq>${e.changefreq}</changefreq>`)
    if (e.priority !== undefined) lines.push(`    <priority>${e.priority.toFixed(1)}</priority>`)
    if (e.alternates) {
      for (const alt of e.alternates) {
        lines.push(
          `    <xhtml:link rel="alternate" hreflang="${escapeXml(alt.hreflang)}" href="${escapeXml(alt.href)}" />`,
        )
      }
    }
    lines.push('  </url>')
  }
  lines.push('</urlset>')
  return lines.join('\n')
}

export interface SitemapFile {
  filename: string
  content: string
}

/**
 * 高层入口：超过 50k URL 自动分片 + sitemap-index.xml
 *
 * 返回所有要写入 / 上传的文件。第一个永远是 `sitemap.xml`，要么是单 sitemap，
 * 要么是 sitemap-index 指向 sitemap-1.xml…
 */
export function buildSitemap(
  site: SiteMeta,
  pages: PageMeta[],
  options: BuildSitemapOptions = {},
): SitemapFile[] {
  const entries = toEntries(site, pages, options)
  if (entries.length <= MAX_URLS_PER_FILE) {
    return [{ filename: 'sitemap.xml', content: renderSitemap(entries) }]
  }
  const files: SitemapFile[] = []
  const chunks: SitemapEntry[][] = []
  for (let i = 0; i < entries.length; i += MAX_URLS_PER_FILE) {
    chunks.push(entries.slice(i, i + MAX_URLS_PER_FILE))
  }
  chunks.forEach((chunk, idx) => {
    files.push({ filename: `sitemap-${idx + 1}.xml`, content: renderSitemap(chunk) })
  })
  files.unshift({
    filename: 'sitemap.xml',
    content: renderSitemapIndex(
      site,
      chunks.map((_, idx) => `sitemap-${idx + 1}.xml`),
    ),
  })
  return files
}

export function renderSitemapIndex(site: SiteMeta, files: string[]): string {
  const now = new Date().toISOString()
  const lines: string[] = ['<?xml version="1.0" encoding="UTF-8"?>']
  lines.push('<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')
  for (const f of files) {
    lines.push('  <sitemap>')
    lines.push(`    <loc>${escapeXml(joinUrl(site.baseUrl, f))}</loc>`)
    lines.push(`    <lastmod>${now}</lastmod>`)
    lines.push('  </sitemap>')
  }
  lines.push('</sitemapindex>')
  return lines.join('\n')
}
