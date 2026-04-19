/**
 * robots.txt 生成
 *
 * 默认策略:
 * - allow: *
 * - disallow: /api/, /admin/, /super/, /_next/
 * - 自动加 sitemap 指向
 *
 * 支持: 屏蔽特定 AI 爬虫 / 反之专门允许 (GEO 模式)
 */

import type { SiteMeta } from './types.js'
import { joinUrl } from './utils/url.js'

export interface RobotsRule {
  userAgent: string
  allow?: string[]
  disallow?: string[]
  crawlDelay?: number
}

export interface BuildRobotsOptions {
  /** 完全自定义规则集（覆盖默认） */
  rules?: RobotsRule[]
  /** 额外屏蔽路径（默认基础上） */
  extraDisallow?: string[]
  /**
   * AI 爬虫策略:
   *   'allow-all'  全部允许（GEO 推荐）
   *   'block-all'  全部屏蔽
   *   'block-list' 屏蔽列表中的 user-agent
   */
  aiPolicy?: 'allow-all' | 'block-all' | 'block-list'
  /** aiPolicy='block-list' 时的列表（默认包含 GPTBot/Google-Extended/CCBot 等） */
  blockedAiAgents?: string[]
  /** sitemap.xml 路径（默认 /sitemap.xml） */
  sitemapPath?: string
}

const DEFAULT_DISALLOW = ['/api/', '/admin/', '/super/', '/_next/', '/draft/']

const DEFAULT_AI_AGENTS = [
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'Google-Extended',
  'CCBot',
  'anthropic-ai',
  'ClaudeBot',
  'PerplexityBot',
  'cohere-ai',
  'Bytespider',
  'Amazonbot',
]

export function buildRobots(site: SiteMeta, options: BuildRobotsOptions = {}): string {
  const rules: RobotsRule[] =
    options.rules ?? [
      {
        userAgent: '*',
        allow: ['/'],
        disallow: [...DEFAULT_DISALLOW, ...(options.extraDisallow ?? [])],
      },
    ]

  const aiPolicy = options.aiPolicy ?? 'allow-all'
  if (aiPolicy === 'block-all') {
    rules.push({ userAgent: 'GPTBot', disallow: ['/'] })
    rules.push({ userAgent: 'CCBot', disallow: ['/'] })
    rules.push({ userAgent: 'Google-Extended', disallow: ['/'] })
    rules.push({ userAgent: 'anthropic-ai', disallow: ['/'] })
    rules.push({ userAgent: 'PerplexityBot', disallow: ['/'] })
  } else if (aiPolicy === 'block-list') {
    for (const ua of options.blockedAiAgents ?? DEFAULT_AI_AGENTS) {
      rules.push({ userAgent: ua, disallow: ['/'] })
    }
  }

  const lines: string[] = []
  for (const r of rules) {
    lines.push(`User-agent: ${r.userAgent}`)
    for (const a of r.allow ?? []) lines.push(`Allow: ${a}`)
    for (const d of r.disallow ?? []) lines.push(`Disallow: ${d}`)
    if (r.crawlDelay !== undefined) lines.push(`Crawl-delay: ${r.crawlDelay}`)
    lines.push('')
  }

  const sitemapPath = options.sitemapPath ?? '/sitemap.xml'
  lines.push(`Sitemap: ${joinUrl(site.baseUrl, sitemapPath)}`)
  return lines.join('\n').trim() + '\n'
}
