/**
 * Meta tags 生成
 *
 * 输出 Next.js metadata API / Helmet / 直接 SSR 都能用的中性结构 (MetaTagSet)。
 *
 * 涵盖:
 * - title / description / canonical
 * - robots (index/follow + noindex 处理)
 * - Open Graph (og:title/description/url/image/site_name/type/locale)
 * - Twitter Card
 * - hreflang alternates
 * - JSON-LD schemas (汇总到 MetaTagSet.jsonLd)
 */

import { buildSchemasFor } from './schemaOrg.js'
import type { MetaTagSet, PageMeta, SiteMeta, SchemaObject } from './types.js'
import { joinUrl, truncate } from './utils/url.js'

const TITLE_MAX = 60
const DESC_MAX = 160
const TWITTER_DESC_MAX = 200

export interface BuildMetaOptions {
  /** 全局默认 OG 图（站点封面） */
  defaultOgImage?: string
  /** 是否在主页同时输出 WebSite + Organization schema (默认 true) */
  includeOrganizationOnHome?: boolean
  /** 主题色（移动端 toolbar / iOS Safari） */
  themeColor?: string
  /** 是否输出 viewport (默认 true) */
  viewport?: boolean
  /** 自定义额外 meta */
  extraMeta?: Array<{ name?: string; property?: string; content: string }>
  /** breadcrumbList */
  breadcrumb?: { items: Array<{ name: string; url: string }> }
  /** 强制输出指定 schema (用于已生成好的额外 schema) */
  extraSchemas?: SchemaObject[]
}

export function buildMeta(site: SiteMeta, page: PageMeta, options: BuildMetaOptions = {}): MetaTagSet {
  const locale = page.locale ?? site.defaultLocale
  const title = truncate(page.title, TITLE_MAX)
  const description = truncate(page.description, DESC_MAX)
  const canonical = joinUrl(site.baseUrl, page.path)
  const ogImage = page.ogImage
    ? joinUrl(site.baseUrl, page.ogImage)
    : options.defaultOgImage
      ? joinUrl(site.baseUrl, options.defaultOgImage)
      : undefined

  const meta: MetaTagSet['meta'] = []

  meta.push({ name: 'robots', content: page.noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large' })
  if (options.viewport ?? true) {
    meta.push({ name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' })
  }
  if (options.themeColor) meta.push({ name: 'theme-color', content: options.themeColor })

  meta.push({ property: 'og:title', content: title })
  meta.push({ property: 'og:description', content: description })
  meta.push({ property: 'og:url', content: canonical })
  meta.push({ property: 'og:site_name', content: site.brandName })
  meta.push({ property: 'og:type', content: site.siteType === 'storefront' ? 'website' : 'website' })
  meta.push({ property: 'og:locale', content: locale.replace('-', '_') })
  if (ogImage) meta.push({ property: 'og:image', content: ogImage })

  meta.push({ name: 'twitter:card', content: page.twitterCard ?? (ogImage ? 'summary_large_image' : 'summary') })
  meta.push({ name: 'twitter:title', content: title })
  meta.push({ name: 'twitter:description', content: truncate(page.description, TWITTER_DESC_MAX) })
  if (ogImage) meta.push({ name: 'twitter:image', content: ogImage })
  if (site.social?.twitter) meta.push({ name: 'twitter:site', content: `@${site.social.twitter.replace(/^@/, '')}` })

  if (options.extraMeta) meta.push(...options.extraMeta)

  const alternates: MetaTagSet['alternates'] = []
  if (page.alternates) {
    for (const [hreflang, href] of Object.entries(page.alternates)) {
      alternates.push({ hreflang, href: joinUrl(site.baseUrl, href) })
    }
    if (!alternates.some((a) => a.hreflang === 'x-default')) {
      alternates.push({ hreflang: 'x-default', href: canonical })
    }
  }

  const jsonLd = buildSchemasFor(site, page, {
    includeSiteOrg: options.includeOrganizationOnHome ?? page.path === '/',
    breadcrumb: options.breadcrumb,
  })
  if (options.extraSchemas) jsonLd.push(...options.extraSchemas)

  return { title, description, canonical, meta, alternates, jsonLd }
}

/** 把 MetaTagSet 渲染成 raw HTML (适合非 Next.js 模板) */
export function renderMetaHtml(set: MetaTagSet): string {
  const lines: string[] = []
  lines.push(`<title>${escapeAttr(set.title)}</title>`)
  lines.push(`<link rel="canonical" href="${escapeAttr(set.canonical)}" />`)
  lines.push(`<meta name="description" content="${escapeAttr(set.description)}" />`)
  for (const m of set.meta) {
    const attr = m.name ? `name="${escapeAttr(m.name)}"` : `property="${escapeAttr(m.property!)}"`
    lines.push(`<meta ${attr} content="${escapeAttr(m.content)}" />`)
  }
  for (const a of set.alternates) {
    lines.push(`<link rel="alternate" hreflang="${escapeAttr(a.hreflang)}" href="${escapeAttr(a.href)}" />`)
  }
  for (const j of set.jsonLd) {
    lines.push(`<script type="application/ld+json">${JSON.stringify(j)}</script>`)
  }
  return lines.join('\n')
}

function escapeAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
}
