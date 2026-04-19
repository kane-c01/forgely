/**
 * @forgely/compliance — Core types
 *
 * 完全覆盖 docs/MASTER.md 第 15 章的合规审查模型。
 *
 * 关键概念:
 * - Rule: 单条合规规则（地域 / 品类 / 通用），输入内容 → 0-N 个 Finding
 * - ComplianceContent: 待审查内容（站点元信息 + 文案数组 + 媒体引用）
 * - Finding: 单条命中（含位置、严重度、AI 改写建议）
 * - ComplianceReport: 一次审查的聚合结果（驱动部署/UI 决策）
 */

/** 规则严重度（与 ComplianceRecord.severity 对齐） */
export type Severity = 'info' | 'warning' | 'critical'

/** 整体审查结论（决定能否部署） */
export type OverallVerdict = 'pass' | 'warning' | 'fail'

/** 受支持的合规规则地域 */
export type Region =
  | 'US-FTC'
  | 'US-FDA'
  | 'US-COPPA'
  | 'US-CPSIA'
  | 'US-CA-PROP65'
  | 'EU-GDPR'
  | 'EU-DSA'
  | 'EU-CE'
  | 'UK-ASA'
  | 'CA-CASL'
  | 'GLOBAL'

/** 受支持的品类（用于品类特殊规则匹配） */
export type ProductCategory =
  | 'supplements'
  | 'cosmetics'
  | 'children'
  | 'food'
  | 'alcohol'
  | 'cbd'
  | 'medical-device'
  | 'apparel'
  | 'electronics'
  | 'general'

/** 内容类型（影响哪些规则会被触发） */
export type ContentType =
  | 'product-title'
  | 'product-description'
  | 'product-claim'
  | 'page-copy'
  | 'hero-headline'
  | 'cta'
  | 'faq'
  | 'blog'
  | 'image-alt'
  | 'image-vision' // 由 Vision 模型分析后的图像描述
  | 'meta-title'
  | 'meta-description'
  | 'schema-markup'
  | 'logo'

/**
 * 单段待审查内容
 *
 * `path` 是这段内容在站点 DSL 中的定位路径，便于 UI 定位与 `autoFix` 写回:
 *   - `product.123.description`
 *   - `page.home.section.hero.headline`
 *   - `media.img_456.alt`
 */
export interface ContentItem {
  /** 唯一定位路径 */
  path: string
  /** 内容类型 */
  type: ContentType
  /** 文本内容（图像由 Vision 转成自然语言描述后填入） */
  text: string
  /** 可选：原始引用，便于 UI 跳转 */
  ref?: {
    productId?: string
    pageId?: string
    sectionId?: string
    mediaId?: string
  }
}

/** 完整的待审查输入 */
export interface ComplianceContent {
  /** 站点 ID（用于落库 ComplianceRecord） */
  siteId: string
  /** 目标地域（决定规则集） */
  regions: Region[]
  /** 主品类（决定品类规则集） */
  category: ProductCategory
  /** 子品类辅助（如 cbd 中的 'oil' / 'gummies'） */
  subCategory?: string
  /** 所有待审查内容片段 */
  items: ContentItem[]
  /** 站点语言（默认 en） */
  locale?: string
}

/** 单条命中（写回 ComplianceRecord） */
export interface ComplianceFinding {
  /** 触发的规则 ID（如 `us-fda.health-claim.treat-cure-prevent`） */
  rule: string
  /** 规则人类可读名称 */
  ruleName: string
  /** 严重度 */
  severity: Severity
  /** 适用地域 */
  region: Region
  /** 命中位置（来自 ContentItem.path） */
  location: string
  /** 违规的具体内容片段（截取） */
  content: string
  /** 在内容中的字符偏移（便于 UI 高亮） */
  range?: { start: number; end: number }
  /** 推荐的合规改写 */
  suggestion: string
  /** 是否可一键自动修复（无需 LLM） */
  autoFixable: boolean
  /** 进一步阅读 */
  reference?: string
  /** 触发依据简述（debug） */
  reason?: string
}

/** ComplianceAgent.review() 的最终输出 */
export interface ComplianceReport {
  /** 整体判定 */
  overall: OverallVerdict
  /** 涉及到的地域 */
  regions: Region[]
  /** 命中清单 */
  findings: ComplianceFinding[]
  /** critical 数量（必须修复） */
  mustFix: number
  /** warning 数量（建议修复） */
  shouldFix: number
  /** info 数量（提示） */
  notes: number
  /** 审查耗时（ms） */
  durationMs: number
  /** 审查时使用的 schema 版本（便于历史比对） */
  schemaVersion: string
  /** 审查时间戳 */
  generatedAt: string
}

/**
 * Rule 是合规规则库的最小单位
 *
 * 设计要点:
 * 1. 每条规则只负责检测一种违规模式（单一职责）
 * 2. `appliesTo` 决定该规则在何时触发（地域 + 品类 + 内容类型）
 * 3. `check` 是纯函数：输入 ContentItem → 0-N 个 Finding
 * 4. `autoFix` 可选：如果存在，规则可在不调用 LLM 的情况下给出修复
 */
export interface Rule {
  /** 全局唯一 ID（命名空间 + 描述，如 `us-fda.health-claim.treat-cure-prevent`） */
  id: string
  /** 人类可读名称 */
  name: string
  /** 该规则保护的法规 */
  region: Region
  /** 默认严重度（命中后写入 Finding.severity） */
  defaultSeverity: Severity
  /** 简介（UI 展示） */
  description: string
  /** 进一步阅读 */
  reference?: string
  /** 该规则触发的条件 */
  appliesTo: {
    /** 仅在这些品类下触发；为空表示所有品类 */
    categories?: ProductCategory[]
    /** 仅在这些内容类型下触发；为空表示所有 */
    contentTypes?: ContentType[]
  }
  /** 检查逻辑（同步以便规则引擎可批量并发） */
  check: (item: ContentItem, ctx: RuleCheckContext) => ComplianceFinding[]
}

/** 传给 Rule.check 的辅助上下文 */
export interface RuleCheckContext {
  category: ProductCategory
  subCategory?: string
  regions: Region[]
  locale: string
}

/** 引擎运行选项 */
export interface RunRulesOptions {
  /** 仅运行这些规则 ID */
  only?: string[]
  /** 排除这些规则 ID */
  exclude?: string[]
  /** 自定义规则集（覆盖默认全集） */
  rules?: Rule[]
}

/** 部署门禁结果（CI/部署器使用） */
export interface DeploymentGate {
  /** 是否允许部署 */
  allow: boolean
  /** 阻止原因（mustFix > 0 时填充） */
  reason?: string
  /** 引用的报告 */
  report: ComplianceReport
}
