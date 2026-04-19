/**
 * 规则匹配通用工具
 *
 * 统一规则文件里"关键词列表 → 命中片段"的样板，避免每条规则各写一份。
 */

import type {
  ComplianceFinding,
  ContentItem,
  Rule,
  RuleCheckContext,
  Severity,
} from '../types.js'

export interface KeywordMatcherOptions {
  /** 不区分大小写匹配（默认 true） */
  caseInsensitive?: boolean
  /** 仅匹配整词，避免误伤（默认 true） */
  wordBoundary?: boolean
  /** 截取命中前后各 N 个字符作为 content 片段 */
  contextChars?: number
}

export interface KeywordMatch {
  match: string
  index: number
  excerpt: string
}

/** 在文本中查找关键词命中 */
export function findKeywords(
  text: string,
  keywords: readonly string[],
  opts: KeywordMatcherOptions = {},
): KeywordMatch[] {
  const {
    caseInsensitive = true,
    wordBoundary = true,
    contextChars = 40,
  } = opts

  const matches: KeywordMatch[] = []
  for (const kw of keywords) {
    const flags = caseInsensitive ? 'gi' : 'g'
    const escaped = escapeRegExp(kw)
    const pattern = wordBoundary && /^[\w]/.test(kw) && /[\w]$/.test(kw)
      ? new RegExp(`\\b${escaped}\\b`, flags)
      : new RegExp(escaped, flags)

    let m: RegExpExecArray | null
    while ((m = pattern.exec(text)) !== null) {
      const start = Math.max(0, m.index - contextChars)
      const end = Math.min(text.length, m.index + m[0].length + contextChars)
      matches.push({
        match: m[0],
        index: m.index,
        excerpt: text.slice(start, end),
      })
      if (m.index === pattern.lastIndex) pattern.lastIndex++
    }
  }
  return matches
}

/** 在文本中查找正则命中 */
export function findRegex(
  text: string,
  patterns: readonly RegExp[],
  contextChars = 40,
): KeywordMatch[] {
  const matches: KeywordMatch[] = []
  for (const re of patterns) {
    const pattern = re.global ? re : new RegExp(re.source, re.flags + 'g')
    let m: RegExpExecArray | null
    while ((m = pattern.exec(text)) !== null) {
      const start = Math.max(0, m.index - contextChars)
      const end = Math.min(text.length, m.index + m[0].length + contextChars)
      matches.push({
        match: m[0],
        index: m.index,
        excerpt: text.slice(start, end),
      })
      if (m.index === pattern.lastIndex) pattern.lastIndex++
    }
  }
  return matches
}

/** 把 KeywordMatch 转成 Finding 的工厂 */
export function toFinding(args: {
  rule: Pick<Rule, 'id' | 'name' | 'region' | 'defaultSeverity' | 'reference'>
  item: ContentItem
  match: KeywordMatch
  suggestion: string
  autoFixable?: boolean
  severity?: Severity
  reason?: string
}): ComplianceFinding {
  return {
    rule: args.rule.id,
    ruleName: args.rule.name,
    severity: args.severity ?? args.rule.defaultSeverity,
    region: args.rule.region,
    location: args.item.path,
    content: args.match.excerpt,
    range: {
      start: args.match.index,
      end: args.match.index + args.match.match.length,
    },
    suggestion: args.suggestion,
    autoFixable: args.autoFixable ?? false,
    reference: args.rule.reference,
    reason: args.reason,
  }
}

/** 该规则是否对当前内容生效 */
export function shouldRunRule(rule: Rule, item: ContentItem, ctx: RuleCheckContext): boolean {
  if (!ctx.regions.includes(rule.region) && rule.region !== 'GLOBAL') return false
  const a = rule.appliesTo
  if (a.categories && a.categories.length > 0 && !a.categories.includes(ctx.category)) {
    return false
  }
  if (a.contentTypes && a.contentTypes.length > 0 && !a.contentTypes.includes(item.type)) {
    return false
  }
  return true
}

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
