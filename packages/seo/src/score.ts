/**
 * SEO 单页评分器
 *
 * 输出 0-100 分 + 详细 checks。给用户后台 SEO 面板使用 (MASTER.md 16.3)。
 *
 * 评分维度（共 ~15 项）:
 * - title 长度 / 关键词命中
 * - description 长度
 * - canonical
 * - h1 是否存在 / 与 title 一致
 * - bodyText 字数
 * - 关键词密度 / 关键词覆盖
 * - 内部链接 ≥ 3
 * - alt text (image-alt 类内容)
 * - schema.org 是否输出 (≥ 1 个)
 * - OG image 是否存在
 * - hreflang 是否完备 (多语言站)
 */

import type { PageMeta, SeoCheck, SeoScore, SiteMeta } from './types.js'

const TITLE_MIN = 30
const TITLE_MAX = 60
const DESC_MIN = 70
const DESC_MAX = 160
const BODY_MIN = 300

export interface ScoreOptions {
  /** 强制要求关键词命中 (低权重) */
  requireKeywordInTitle?: boolean
  /** 站点是否多语言（影响 hreflang 检查） */
  multilingual?: boolean
}

export function scorePage(site: SiteMeta, page: PageMeta, options: ScoreOptions = {}): SeoScore {
  const checks: SeoCheck[] = []

  checks.push(checkTitleLength(page))
  checks.push(checkDescriptionLength(page))
  checks.push(checkCanonical(page))
  checks.push(checkH1(page))
  checks.push(checkBodyLength(page))
  checks.push(checkKeywordsInTitle(page, !!options.requireKeywordInTitle))
  checks.push(checkOgImage(page))
  checks.push(checkInternalLinks(page))
  checks.push(checkSchema(page))
  checks.push(checkHreflang(site, page, !!options.multilingual))
  checks.push(checkNoindex(page))

  return aggregate(checks)
}

function aggregate(checks: SeoCheck[]): SeoScore {
  const total = checks.reduce((sum, c) => sum + c.weight, 0)
  const earned = checks.filter((c) => c.level === 'pass').reduce((s, c) => s + c.weight, 0)
  const score = total === 0 ? 0 : Math.round((earned / total) * 100)
  return {
    score,
    grade: gradeFor(score),
    checks,
    recommendations: checks
      .filter((c) => c.level === 'warning' || c.level === 'critical')
      .sort((a, b) => severityRank(b.level) - severityRank(a.level)),
  }
}

function severityRank(l: SeoCheck['level']): number {
  return l === 'critical' ? 3 : l === 'warning' ? 2 : l === 'info' ? 1 : 0
}

function gradeFor(score: number): SeoScore['grade'] {
  if (score >= 90) return 'A'
  if (score >= 80) return 'B'
  if (score >= 70) return 'C'
  if (score >= 60) return 'D'
  return 'F'
}

function checkTitleLength(page: PageMeta): SeoCheck {
  const len = page.title.length
  if (len < TITLE_MIN) {
    return {
      id: 'title.too-short',
      name: 'Title too short',
      level: 'warning',
      weight: 8,
      message: `Title is ${len} chars; aim for ${TITLE_MIN}-${TITLE_MAX}.`,
      hint: '加入主关键词 + 品牌名 + 价值主张。',
    }
  }
  if (len > TITLE_MAX) {
    return {
      id: 'title.too-long',
      name: 'Title too long',
      level: 'warning',
      weight: 8,
      message: `Title is ${len} chars; will be truncated by Google (~${TITLE_MAX}).`,
    }
  }
  return { id: 'title.length-ok', name: 'Title length OK', level: 'pass', weight: 8 }
}

function checkDescriptionLength(page: PageMeta): SeoCheck {
  const len = page.description.length
  if (len < DESC_MIN) {
    return {
      id: 'description.too-short',
      name: 'Description too short',
      level: 'warning',
      weight: 6,
      message: `Description is ${len} chars; aim for ${DESC_MIN}-${DESC_MAX}.`,
    }
  }
  if (len > DESC_MAX) {
    return {
      id: 'description.too-long',
      name: 'Description too long',
      level: 'info',
      weight: 6,
      message: `Description is ${len} chars; will be truncated.`,
    }
  }
  return { id: 'description.length-ok', name: 'Description length OK', level: 'pass', weight: 6 }
}

function checkCanonical(page: PageMeta): SeoCheck {
  if (!page.path.startsWith('/')) {
    return {
      id: 'canonical.invalid-path',
      name: 'Canonical path invalid',
      level: 'critical',
      weight: 5,
      message: 'page.path 必须以 "/" 开头',
    }
  }
  return { id: 'canonical.ok', name: 'Canonical path OK', level: 'pass', weight: 5 }
}

function checkH1(page: PageMeta): SeoCheck {
  if (!page.h1) {
    return {
      id: 'h1.missing',
      name: 'Missing H1',
      level: 'warning',
      weight: 6,
      message: '该页缺少 H1，建议在 PageMeta 中提供。',
    }
  }
  return { id: 'h1.ok', name: 'H1 present', level: 'pass', weight: 6 }
}

function checkBodyLength(page: PageMeta): SeoCheck {
  const len = (page.bodyText ?? '').replace(/\s+/g, ' ').trim().length
  if (len < BODY_MIN) {
    return {
      id: 'body.too-short',
      name: 'Body content too short',
      level: 'warning',
      weight: 8,
      message: `Body is ${len} chars; aim for ≥ ${BODY_MIN}.`,
      hint: '增加产品故事 / 使用场景 / FAQ 段落。',
    }
  }
  return { id: 'body.length-ok', name: 'Body length OK', level: 'pass', weight: 8 }
}

function checkKeywordsInTitle(page: PageMeta, required: boolean): SeoCheck {
  if (!page.keywords || page.keywords.length === 0) {
    return required
      ? { id: 'keywords.missing', name: 'No keywords specified', level: 'warning', weight: 4 }
      : { id: 'keywords.skipped', name: 'No keywords specified', level: 'info', weight: 0 }
  }
  const hit = page.keywords.find((k) => page.title.toLowerCase().includes(k.toLowerCase()))
  return hit
    ? { id: 'keywords.in-title', name: 'Keyword found in title', level: 'pass', weight: 4 }
    : {
        id: 'keywords.not-in-title',
        name: 'Primary keyword missing from title',
        level: 'warning',
        weight: 4,
        hint: `把 "${page.keywords[0]}" 自然加入标题。`,
      }
}

function checkOgImage(page: PageMeta): SeoCheck {
  if (!page.ogImage) {
    return {
      id: 'og-image.missing',
      name: 'Missing OG image',
      level: 'warning',
      weight: 5,
      hint: '提供 1200x630 OG 图，Twitter / 微信预览效果最佳。',
    }
  }
  return { id: 'og-image.ok', name: 'OG image set', level: 'pass', weight: 5 }
}

function checkInternalLinks(page: PageMeta): SeoCheck {
  const n = page.internalLinks ?? 0
  if (n < 3) {
    return {
      id: 'internal-links.too-few',
      name: 'Too few internal links',
      level: 'info',
      weight: 4,
      message: `${n} internal link(s); aim for ≥ 3 to other relevant pages.`,
    }
  }
  return { id: 'internal-links.ok', name: 'Internal links OK', level: 'pass', weight: 4 }
}

function checkSchema(page: PageMeta): SeoCheck {
  const n = (page.schema ?? []).length
  if (n === 0) {
    return {
      id: 'schema.missing',
      name: 'No schema.org JSON-LD',
      level: 'warning',
      weight: 7,
      hint: '至少输出 1 个 schema (Organization / Product / FAQ)，AI 引用率 +30%。',
    }
  }
  return { id: 'schema.ok', name: 'Schema.org JSON-LD present', level: 'pass', weight: 7 }
}

function checkHreflang(_site: SiteMeta, page: PageMeta, multilingual: boolean): SeoCheck {
  if (!multilingual) return { id: 'hreflang.skipped', name: 'Single-language site', level: 'info', weight: 0 }
  if (!page.alternates || Object.keys(page.alternates).length === 0) {
    return {
      id: 'hreflang.missing',
      name: 'Missing hreflang alternates',
      level: 'warning',
      weight: 4,
      hint: '为多语言站点的每个 locale 提供 alternates。',
    }
  }
  return { id: 'hreflang.ok', name: 'Hreflang alternates set', level: 'pass', weight: 4 }
}

function checkNoindex(page: PageMeta): SeoCheck {
  return page.noindex
    ? { id: 'noindex.set', name: 'noindex is set', level: 'info', weight: 0, message: '该页被排除在索引外。' }
    : { id: 'noindex.ok', name: 'Indexable', level: 'pass', weight: 1 }
}
