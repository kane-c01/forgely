/**
 * 规则引擎
 *
 * 输入: ComplianceContent + (可选) 自定义规则集
 * 输出: ComplianceReport
 *
 * 设计要点:
 * - 不调用任何外部 API（纯函数），便于测试 + 在 CI 中跑
 * - 规则失败不会让整次审查崩溃（单条 try/catch）
 * - 输出按严重度排序，方便 UI 直接渲染
 */

import type {
  ComplianceContent,
  ComplianceFinding,
  ComplianceReport,
  Rule,
  RuleCheckContext,
  RunRulesOptions,
  Severity,
  OverallVerdict,
} from './types.js'
import { ALL_RULES } from './rules/index.js'
import { shouldRunRule } from './utils/pattern.js'

const SCHEMA_VERSION = '1.0.0'

const SEVERITY_RANK: Record<Severity, number> = { critical: 3, warning: 2, info: 1 }

/** 主入口：运行所有适用规则并聚合 */
export function runRules(content: ComplianceContent, options: RunRulesOptions = {}): ComplianceReport {
  const start = performance.now()

  const rules = filterRules(options)
  const ctx: RuleCheckContext = {
    category: content.category,
    subCategory: content.subCategory,
    regions: content.regions,
    locale: content.locale ?? 'en',
  }

  const findings: ComplianceFinding[] = []
  for (const item of content.items) {
    for (const rule of rules) {
      if (!shouldRunRule(rule, item, ctx)) continue
      try {
        const got = rule.check(item, ctx)
        if (got.length > 0) findings.push(...got)
      } catch (err) {
        findings.push({
          rule: 'engine.rule-error',
          ruleName: `Rule "${rule.id}" threw an error`,
          severity: 'info',
          region: 'GLOBAL',
          location: item.path,
          content: '',
          suggestion: '该规则执行失败，请提交 issue。',
          autoFixable: false,
          reason: (err as Error).message,
        })
      }
    }
  }

  findings.sort(
    (a, b) =>
      SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity] ||
      a.location.localeCompare(b.location) ||
      a.rule.localeCompare(b.rule),
  )

  const mustFix = findings.filter((f) => f.severity === 'critical').length
  const shouldFix = findings.filter((f) => f.severity === 'warning').length
  const notes = findings.filter((f) => f.severity === 'info').length

  return {
    overall: deriveVerdict({ mustFix, shouldFix }),
    regions: content.regions,
    findings,
    mustFix,
    shouldFix,
    notes,
    durationMs: Math.round(performance.now() - start),
    schemaVersion: SCHEMA_VERSION,
    generatedAt: new Date().toISOString(),
  }
}

function filterRules(opts: RunRulesOptions): Rule[] {
  const base = opts.rules ?? ALL_RULES
  let rules = base
  if (opts.only && opts.only.length > 0) {
    const set = new Set(opts.only)
    rules = rules.filter((r) => set.has(r.id))
  }
  if (opts.exclude && opts.exclude.length > 0) {
    const set = new Set(opts.exclude)
    rules = rules.filter((r) => !set.has(r.id))
  }
  return rules
}

function deriveVerdict(args: { mustFix: number; shouldFix: number }): OverallVerdict {
  if (args.mustFix > 0) return 'fail'
  if (args.shouldFix > 0) return 'warning'
  return 'pass'
}
