/**
 * @forgely/compliance
 *
 * MASTER.md 第 15 章 — 合规审查 Agent。
 *
 * 公开 API:
 *   - ComplianceAgent — 高层入口（含 LLM/Vision DI）
 *   - runRules — 纯函数规则引擎（CI / 离线场景）
 *   - applyAutoFix — 一键修复
 *   - ALL_RULES / selectRules / getRuleById — 规则发现
 *   - 类型 ComplianceReport / ComplianceFinding / Rule 等
 */

export type {
  ComplianceContent,
  ComplianceFinding,
  ComplianceReport,
  ContentItem,
  ContentType,
  DeploymentGate,
  OverallVerdict,
  ProductCategory,
  Region,
  Rule,
  RuleCheckContext,
  RunRulesOptions,
  Severity,
} from './types.js'

export { runRules } from './engine.js'
export { ComplianceAgent } from './agent.js'
export type {
  ComplianceAgentDeps,
  LlmClient,
  VisionClient,
  ReviewOptions,
} from './agent.js'

export { applyAutoFix } from './autofix.js'
export type { AutoFixPatch, AutoFixResult } from './autofix.js'

export {
  ALL_RULES,
  getRuleById,
  getRulesByRegion,
  getRulesByCategory,
  selectRules,
} from './rules/index.js'
