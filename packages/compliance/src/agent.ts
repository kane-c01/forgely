/**
 * Compliance Agent
 *
 * 把"纯规则引擎"包装成与 Claude / Vision 集成的 Agent:
 * 1. 先跑 ruleEngine 拿到结构化 Findings
 * 2. 可选: 调用 Claude 对每条 finding 重写更高质量的 suggestion
 * 3. 可选: 调用 Vision 对图像内容进行二次审查
 *
 * 设计要点:
 * - 不强依赖任何 SDK；所有外部调用通过依赖注入接口
 * - 同步规则引擎是 fallback：即使 LLM 不可用也能给出基础 report
 * - 与 Generation Pipeline (T17 Compiler/Deployer) 形成 Deployment Gate
 */

import type {
  ComplianceContent,
  ComplianceFinding,
  ComplianceReport,
  DeploymentGate,
  RunRulesOptions,
} from './types.js'
import { runRules } from './engine.js'

/**
 * LLM 客户端接口（可注入 Claude / 任何模型）
 *
 * 与 packages/ai-agents 解耦：本包只描述需要什么，由调用方传具体实现。
 */
export interface LlmClient {
  /** 文本 → 文本（用于改写 suggestion） */
  complete(args: {
    system: string
    user: string
    /** Claude Sonnet 即可 */
    model?: string
    maxTokens?: number
  }): Promise<{ text: string }>
}

/** Vision 客户端接口（可注入 Claude Vision） */
export interface VisionClient {
  describe(args: {
    /** 图片 URL 或 base64 */
    image: string
    /** 关注点（"是否含禁用化学符号" / "是否暗示医疗效果"） */
    focus: string
    model?: string
  }): Promise<{ description: string; flags: string[] }>
}

export interface ComplianceAgentDeps {
  llm?: LlmClient
  vision?: VisionClient
}

export interface ReviewOptions extends RunRulesOptions {
  /** 是否调用 LLM 改写每条 finding 的 suggestion（更自然）。默认 false */
  enhanceSuggestions?: boolean
  /** 是否调用 Vision 审查 image-vision 类型条目。默认 true（如果传了 vision client） */
  enableVision?: boolean
}

export class ComplianceAgent {
  constructor(private readonly deps: ComplianceAgentDeps = {}) {}

  /** 静态工厂：方便业务代码 `ComplianceAgent.create({ llm, vision })` */
  static create(deps: ComplianceAgentDeps = {}): ComplianceAgent {
    return new ComplianceAgent(deps)
  }

  /** 主入口 */
  async review(content: ComplianceContent, options: ReviewOptions = {}): Promise<ComplianceReport> {
    const enriched = await this.maybeRunVision(content, options)
    const baseReport = runRules(enriched, options)

    if (!options.enhanceSuggestions || !this.deps.llm) {
      return baseReport
    }
    const enhancedFindings = await this.enhanceSuggestions(baseReport.findings)
    return { ...baseReport, findings: enhancedFindings }
  }

  /** 把 ComplianceReport 转成部署门禁结果 */
  static gate(report: ComplianceReport): DeploymentGate {
    if (report.mustFix > 0) {
      return {
        allow: false,
        reason: `Compliance failed: ${report.mustFix} critical finding(s) must be resolved before deploy.`,
        report,
      }
    }
    return { allow: true, report }
  }

  /**
   * 对 image-vision 类型 ContentItem 调用 Vision，把图像描述插入文本以触发常规规则。
   *
   * 同时，flags 会被合并成 ContentItem.text 末尾，便于 keyword/regex 命中。
   */
  private async maybeRunVision(
    content: ComplianceContent,
    options: ReviewOptions,
  ): Promise<ComplianceContent> {
    const enableVision = options.enableVision ?? true
    if (!enableVision || !this.deps.vision) return content

    const items = await Promise.all(
      content.items.map(async (item) => {
        if (item.type !== 'image-vision') return item
        if (item.text.length > 0) return item
        const ref = item.ref?.mediaId ?? ''
        if (!ref) return item
        try {
          const v = await this.deps.vision!.describe({
            image: ref,
            focus:
              'List any visible chemical hazard symbols, age indicators, medical claims, brand logos that might be counterfeit, or text overlays.',
          })
          return {
            ...item,
            text: `${v.description}\nFLAGS: ${v.flags.join(', ')}`,
          }
        } catch {
          return item
        }
      }),
    )
    return { ...content, items }
  }

  private async enhanceSuggestions(findings: ComplianceFinding[]): Promise<ComplianceFinding[]> {
    if (!this.deps.llm) return findings
    const llm = this.deps.llm
    const out: ComplianceFinding[] = []
    for (const f of findings) {
      try {
        const { text } = await llm.complete({
          model: 'claude-sonnet-4',
          maxTokens: 200,
          system:
            'You are a compliance copy editor. Rewrite the user-provided non-compliant snippet into compliant brand-friendly copy. Keep the same selling intent. Output ONLY the rewrite, no explanation.',
          user: `Rule violated: ${f.ruleName}\nOriginal snippet:\n"""${f.content}"""\nCurrent suggestion: ${f.suggestion}`,
        })
        out.push({ ...f, suggestion: text.trim(), autoFixable: true })
      } catch {
        out.push(f)
      }
    }
    return out
  }
}
