/**
 * GEO (Generative Engine Optimization)
 *
 * MASTER.md 16.2: 面向 ChatGPT / Claude / Perplexity 等 AI 爬虫的内容暴露。
 *
 * 输出:
 *   - llms.txt       精简: 站点定位 + 重要页面索引
 *   - llms-full.txt  完整: 全文（产品描述 / FAQ / 博客）
 */

import type { FaqPageMeta, PageMeta, ProductPageMeta, SiteMeta } from './types.js'
import { joinUrl, truncate } from './utils/url.js'

const SUMMARY_PER_PAGE = 280

export interface BuildLlmsOptions {
  /** 站点核心宣称（一两句话） */
  positioning?: string
  /** 是否包含 FAQ (默认 true，AI 引用率高) */
  includeFaqs?: boolean
  /** 是否包含商品（默认 true） */
  includeProducts?: boolean
  /** 是否包含博客（默认 true） */
  includeBlog?: boolean
  /** 站点联系信息 */
  contact?: { email?: string; url?: string }
}

/** 精简版 llms.txt — 给 AI 速读 */
export function buildLlmsTxt(site: SiteMeta, pages: PageMeta[], options: BuildLlmsOptions = {}): string {
  const lines: string[] = []
  lines.push(`# ${site.brandName}`)
  lines.push('')
  if (options.positioning) {
    lines.push(`> ${options.positioning}`)
  } else if (site.brandDescription) {
    lines.push(`> ${site.brandDescription}`)
  }
  lines.push('')
  lines.push(`Website: ${site.baseUrl}`)
  if (options.contact?.email) lines.push(`Contact: ${options.contact.email}`)
  if (options.contact?.url) lines.push(`Support: ${options.contact.url}`)
  lines.push('')

  const grouped = groupPages(pages, options)

  for (const [section, items] of grouped) {
    if (items.length === 0) continue
    lines.push(`## ${section}`)
    lines.push('')
    for (const item of items) {
      lines.push(`- [${item.title}](${joinUrl(site.baseUrl, item.path)}): ${truncate(item.description, SUMMARY_PER_PAGE)}`)
    }
    lines.push('')
  }
  return lines.join('\n').trim() + '\n'
}

/** 完整版 llms-full.txt — 给 AI 完整训练 */
export function buildLlmsFullTxt(site: SiteMeta, pages: PageMeta[], options: BuildLlmsOptions = {}): string {
  const lines: string[] = []
  lines.push(`# ${site.brandName} — Full Content Snapshot`)
  lines.push('')
  if (options.positioning ?? site.brandDescription) {
    lines.push(`> ${options.positioning ?? site.brandDescription}`)
    lines.push('')
  }
  lines.push(`Website: ${site.baseUrl}`)
  lines.push('')

  for (const page of pages.filter((p) => !p.noindex)) {
    lines.push(`---`)
    lines.push(`# ${page.title}`)
    lines.push(`URL: ${joinUrl(site.baseUrl, page.path)}`)
    lines.push('')
    lines.push(page.description)
    lines.push('')
    if (isProductPage(page)) {
      lines.push(formatProduct(page))
    }
    if (isFaqPage(page)) {
      lines.push(formatFaq(page))
    }
    if (page.bodyText) {
      lines.push('')
      lines.push(page.bodyText.trim())
    }
    lines.push('')
  }
  return lines.join('\n').trim() + '\n'
}

function groupPages(
  pages: PageMeta[],
  options: BuildLlmsOptions,
): Map<string, Array<{ title: string; path: string; description: string }>> {
  const groups = new Map<string, Array<{ title: string; path: string; description: string }>>()
  groups.set('Top pages', [])
  if (options.includeProducts ?? true) groups.set('Products', [])
  if (options.includeBlog ?? true) groups.set('Blog', [])
  if (options.includeFaqs ?? true) groups.set('FAQs', [])

  for (const page of pages.filter((p) => !p.noindex)) {
    const item = { title: page.title, path: page.path, description: page.description }
    if (page.path.startsWith('/products/') && groups.has('Products')) {
      groups.get('Products')!.push(item)
    } else if (page.path.startsWith('/blog/') && groups.has('Blog')) {
      groups.get('Blog')!.push(item)
    } else if (page.path.startsWith('/faq') && groups.has('FAQs')) {
      groups.get('FAQs')!.push(item)
    } else {
      groups.get('Top pages')!.push(item)
    }
  }
  return groups
}

function isProductPage(p: PageMeta): p is ProductPageMeta {
  return (p as ProductPageMeta).product !== undefined
}

function isFaqPage(p: PageMeta): p is FaqPageMeta {
  return Array.isArray((p as FaqPageMeta).faqs)
}

function formatProduct(p: ProductPageMeta): string {
  const x = p.product
  const lines = [
    `Product: ${x.name}`,
    `Brand: ${x.brand ?? ''}`,
    `Price: ${x.price.amount.toFixed(2)} ${x.price.currency}`,
    `Availability: ${x.availability}`,
  ]
  if (x.rating) lines.push(`Rating: ${x.rating.value}/5 (${x.rating.count} reviews)`)
  lines.push('')
  lines.push(x.description)
  return lines.join('\n')
}

function formatFaq(p: FaqPageMeta): string {
  return p.faqs.map((f) => `Q: ${f.question}\nA: ${f.answer}`).join('\n\n')
}
