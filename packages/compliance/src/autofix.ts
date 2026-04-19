/**
 * AI 一键修复 (autoFix)
 *
 * 把 ComplianceReport.findings 中 `autoFixable === true` 的条目应用到原内容上。
 *
 * 设计要点:
 * - 同一 location 多条 finding：按严重度顺序应用，避免冲突
 * - 仅对"追加型"修复（如：补 disclaimer / 警告语）做自动 patch；
 *   "改写型"修复（如：删除疾病宣称）依然需要 LLM 介入
 * - 返回 patches 列表 + 修复后的 ContentItem，便于 UI diff 展示
 */

import type { ComplianceFinding, ComplianceReport, ContentItem } from './types.js'

export interface AutoFixPatch {
  location: string
  before: string
  after: string
  applied: ComplianceFinding[]
}

export interface AutoFixResult {
  patches: AutoFixPatch[]
  patchedItems: ContentItem[]
  notFixedFindings: ComplianceFinding[]
}

/** 把 report 中 autoFixable 的 findings 应用到 items 上 */
export function applyAutoFix(items: ContentItem[], report: ComplianceReport): AutoFixResult {
  const findingsByLocation = new Map<string, ComplianceFinding[]>()
  for (const f of report.findings) {
    if (!f.autoFixable) continue
    const list = findingsByLocation.get(f.location) ?? []
    list.push(f)
    findingsByLocation.set(f.location, list)
  }

  const patches: AutoFixPatch[] = []
  const patchedItems: ContentItem[] = []

  for (const item of items) {
    const list = findingsByLocation.get(item.path)
    if (!list || list.length === 0) {
      patchedItems.push(item)
      continue
    }
    const before = item.text
    let after = before
    for (const f of list) {
      after = appendOrReplace(after, f)
    }
    patches.push({ location: item.path, before, after, applied: list })
    patchedItems.push({ ...item, text: after })
  }

  const fixedKeys = new Set(report.findings.filter((f) => f.autoFixable).map((f) => f.rule + '@' + f.location))
  const notFixedFindings = report.findings.filter((f) => !fixedKeys.has(f.rule + '@' + f.location))

  return { patches, patchedItems, notFixedFindings }
}

/**
 * 当 finding.suggestion 是"追加型"模板时直接 append；
 * 否则原样保留（留给 LLM 改写）。
 */
function appendOrReplace(text: string, f: ComplianceFinding): string {
  const looksAppendable =
    /^(加入|追加|append|add|在.*?加上|补充)/i.test(f.suggestion) ||
    f.suggestion.includes('"*These statements have not been evaluated') ||
    f.suggestion.includes('Patch test before first use')

  if (!looksAppendable) return text

  const snippet = extractQuoted(f.suggestion) ?? f.suggestion
  return `${text.trim()}\n\n${snippet.trim()}`
}

function extractQuoted(s: string): string | null {
  const m = /"([^"]+)"/.exec(s)
  return m ? m[1]! : null
}
