/**
 * Forgely AI Copilot — chat orchestration.
 *
 * Bridges the tRPC `copilot.chat` mutation to the underlying LLM provider
 * (DeepSeek > Qwen > Anthropic > Mock, region-aware). Returns a structured
 * reply that the React drawer can render verbatim, including any tool
 * calls the model wants to make.
 *
 * Two surfaces are supported:
 *   - `kind: 'user'`   — tenant-side dashboard Copilot (apps/app/sites/...)
 *   - `kind: 'super'`  — super-admin Copilot (apps/app/super/...)
 *
 * The system prompt and the tool catalogue differ per surface so the
 * super admin doesn't accidentally call user-mutating tools and vice-versa.
 *
 * @owner W12 (DevOps + AI plumbing)
 */

import { resolveProvider, type LlmProvider, type LlmModel } from '@forgely/ai-agents'
import { z } from 'zod'

export const CopilotChatSurface = z.enum(['user', 'super'])
export type CopilotChatSurface = z.infer<typeof CopilotChatSurface>

export const CopilotPageContextSchema = z.object({
  kind: z.string(),
  siteId: z.string().optional(),
  productId: z.string().optional(),
  productTitle: z.string().optional(),
  orderId: z.string().optional(),
  orderNumber: z.string().optional(),
  customerId: z.string().optional(),
  customerName: z.string().optional(),
  brandKitId: z.string().optional(),
  selectedBlockId: z.string().optional(),
  selectedBlockType: z.string().optional(),
})
export type CopilotPageContext = z.infer<typeof CopilotPageContextSchema>

export const CopilotChatMessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  text: z.string().min(0).max(4000),
})
export type CopilotChatMessage = z.infer<typeof CopilotChatMessageSchema>

export interface CopilotChatToolCall {
  id: string
  name: string
  arguments: Record<string, unknown>
  destructive: boolean
  estimatedCredits?: number
}

export interface CopilotChatReply {
  text: string
  toolCalls: CopilotChatToolCall[]
  /** Provider that actually answered ('deepseek', 'qwen', 'mock', etc). */
  providerName: string
  /** Estimated USD spend for this turn — used for super-admin AI Ops dashboard. */
  costUsd: number
  inputTokens: number
  outputTokens: number
}

export interface BuildChatInput {
  surface: CopilotChatSurface
  context: CopilotPageContext
  messages: CopilotChatMessage[]
  /** Force a specific provider. Useful for tests / per-tenant overrides. */
  prefer?: 'deepseek' | 'qwen' | 'anthropic' | 'mock' | 'real'
  /** Override model (e.g. claude-sonnet-4 for premium plan). */
  model?: LlmModel
  /** locale for the assistant's reply (defaults to zh-CN). */
  locale?: 'zh-CN' | 'en'
}

const SUPER_TOOLS_CATALOGUE_ZH = `
你可以调用下列管理工具，每个工具都会以 JSON 形式追加到回复末尾：

【财务 / 增长】
- query_mrr({ window?: '24h'|'7d'|'30d' }) — 查询订阅收入
- query_dau({ window?: '24h'|'7d'|'30d' }) — 查日活
- query_ai_cost({ window?: '24h'|'7d'|'30d' }) — AI 成本聚合（¥/$）
- list_pending_refunds({ limit?: number }) — 列出待审退款
- approve_refund({ refundId: string }) — 批准退款（destructive）
- deny_refund({ refundId: string, reason: string }) — 拒绝退款（destructive）
- export_finance({ range: 'this_month'|'last_month'|'this_quarter', format: 'csv'|'xlsx' })

【用户 / 风控】
- query_user({ q: string }) — 模糊查询用户（邮箱 / 手机号 / 微信昵称）
- list_at_risk_users({ limit?: number }) — 列出近 7 天异常活跃用户
- ban_user({ userId: string, durationDays: number, reason: string }) — destructive
- unban_user({ userId: string }) — destructive
- credit_adjustment({ userId: string, deltaCredits: number, reason: string }) — destructive
- impersonate_user({ userId: string, reason: string }) — 申请 Login-as token（destructive）

【站点管理】
- list_sites({ status?: 'live'|'frozen'|'failed', limit?: number })
- freeze_site({ siteId: string, reason: string }) — destructive，立即下线 + 通知商家
- unfreeze_site({ siteId: string }) — destructive
- regenerate_site({ siteId: string, scope: 'theme'|'copy'|'media'|'all' }) — 触发 12 步流水线

【插件审核】
- list_plugins({ decision?: 'pending'|'approve'|'reject' })
- review_plugin({ pluginId: string, decision: 'approve'|'reject', notes?: string }) — destructive

【系统健康 / AI Ops】
- system_health() — 拉一遍 DB / Redis / Sentry / PostHog / R2 / 阿里云 OSS 当前状态
- ai_provider_status({ provider?: 'deepseek'|'qwen'|'anthropic'|'kling'|'vidu'|'flux'|'meshy' })
- top_ai_consumers({ limit?: number, window?: '24h'|'7d' }) — AI 成本最高的用户

【运营 / 营销】
- post_announcement({ subject: string, body: string, audience: 'all'|'paying'|'cn'|'global' }) — 全站公告（destructive）
- launch_email_campaign({ campaignId: string }) — destructive
- create_coupon({ code: string, percentOff: number, expiresInDays?: number, maxRedemptions?: number }) — destructive

【审计】
- query_audit({ severity?: 'critical'|'warning'|'info', actorId?: string, limit?: number })

只有当用户**显式提出请求**时才返回 tool_call。其它情况下用纯文字回答。
所有 destructive 操作必须在回复中**先列出会发生什么 + 风险提示**，由前端二次确认。
`.trim()

const SUPER_TOOLS_CATALOGUE_EN = `
You can call the following admin tools. Each call is appended as JSON at the end of your reply:

[Finance / Growth]
- query_mrr({ window?: '24h'|'7d'|'30d' }) — query subscription revenue
- query_dau({ window?: '24h'|'7d'|'30d' }) — query daily active users
- query_ai_cost({ window?: '24h'|'7d'|'30d' }) — AI cost aggregation
- list_pending_refunds({ limit?: number }) — list pending refunds
- approve_refund({ refundId: string }) — approve refund (destructive)
- deny_refund({ refundId: string, reason: string }) — deny refund (destructive)
- export_finance({ range: 'this_month'|'last_month'|'this_quarter', format: 'csv'|'xlsx' })

[Users / Risk Control]
- query_user({ q: string }) — fuzzy search users (email / phone / WeChat)
- list_at_risk_users({ limit?: number }) — list at-risk users (7-day window)
- ban_user({ userId: string, durationDays: number, reason: string }) — destructive
- unban_user({ userId: string }) — destructive
- credit_adjustment({ userId: string, deltaCredits: number, reason: string }) — destructive
- impersonate_user({ userId: string, reason: string }) — request Login-as token (destructive)

[Site Management]
- list_sites({ status?: 'live'|'frozen'|'failed', limit?: number })
- freeze_site({ siteId: string, reason: string }) — destructive, takes site offline + notifies owner
- unfreeze_site({ siteId: string }) — destructive
- regenerate_site({ siteId: string, scope: 'theme'|'copy'|'media'|'all' }) — trigger 12-step pipeline

[Plugin Review]
- list_plugins({ decision?: 'pending'|'approve'|'reject' })
- review_plugin({ pluginId: string, decision: 'approve'|'reject', notes?: string }) — destructive

[System Health / AI Ops]
- system_health() — check DB / Redis / Sentry / PostHog / R2 / Aliyun OSS status
- ai_provider_status({ provider?: 'deepseek'|'qwen'|'anthropic'|'kling'|'vidu'|'flux'|'meshy' })
- top_ai_consumers({ limit?: number, window?: '24h'|'7d' }) — top AI cost users

[Operations / Marketing]
- post_announcement({ subject: string, body: string, audience: 'all'|'paying'|'cn'|'global' }) — platform-wide announcement (destructive)
- launch_email_campaign({ campaignId: string }) — destructive
- create_coupon({ code: string, percentOff: number, expiresInDays?: number, maxRedemptions?: number }) — destructive

[Audit]
- query_audit({ severity?: 'critical'|'warning'|'info', actorId?: string, limit?: number })

Only return tool_call when the user **explicitly requests** an action. Otherwise reply in plain text.
All destructive operations must **list what will happen + risk warnings** before the frontend confirmation.
`.trim()

const USER_TOOLS_CATALOGUE_ZH = `
你可以调用下列商家工具，每个工具都会以 JSON 形式追加在回复末尾：

【数据 / 分析】
- query_sales({ window?: '24h'|'7d'|'30d' }) — 查近期销售
- query_orders({ status?: 'paid'|'fulfilled'|'cancelled', limit?: number })
- query_customers({ segment?: 'vip'|'inactive'|'new', limit?: number })
- query_inventory({ lowStockOnly?: boolean })
- compare_periods({ current: '7d'|'30d', baseline: 'previous_7d'|'previous_30d' })

【商品】
- update_product({ productId: string, patch: object }) — destructive
- bulk_update_products({ filter: object, patch: object }) — destructive
- rewrite_copy({ productId?: string, target?: string, tone?: string }) — destructive，改写文案
- suggest_pricing({ productId: string, basis?: 'competitor'|'aov'|'margin' })

【主题 / 设计】
- modify_theme_block({ blockId: string, patch: object }) — destructive
- add_theme_block({ kind: string, position?: 'top'|'bottom', after?: string }) — destructive
- remove_theme_block({ blockId: string }) — destructive
- change_colors({ primary?: string, accent?: string, shift?: '+warm'|'+cool' }) — destructive
- change_fonts({ heading?: string, body?: string }) — destructive

【素材生成】
- generate_image({ prompt: string, ratio?: '1:1'|'4:5'|'16:9', count?: number })
- generate_video({ prompt: string, durationSec?: number }) — Kling/Vidu 自动选
- generate_3d_model({ prompt: string })
- regenerate_hero_moment({ moment: string, lighting?: 'warmer'|'cooler', count?: number })

【营销 / 客户】
- create_discount({ code: string, percentOff: number, expiresInDays?: number, maxRedemptions?: number }) — destructive
- send_customer_message({ customerId: string, subject: string, body: string }) — destructive
- tag_customer({ customerId: string, tag: string }) — destructive
- issue_refund({ orderId: string, amountCents?: number, reason?: string }) — destructive

【合规 / SEO】
- run_compliance_check({ region?: 'us'|'eu'|'uk'|'all' })
- apply_compliance_fix({ violationId: string }) — destructive
- run_seo_audit()
- submit_sitemap({ engine: 'google'|'bing'|'baidu' })
- research_keyword({ q: string, limit?: number })

如果用户描述模糊（"改一下首页"），主动追问具体颜色 / 文案 / 区块。
只有当用户**显式请求**且参数明确时才返回 tool_call，否则继续聊天。
所有 destructive 操作必须在回复中先简要描述**会修改什么 + 影响范围**，由前端 UI 二次确认。
`.trim()

const USER_TOOLS_CATALOGUE_EN = `
You can call the following merchant tools. Each call is appended as JSON at the end of your reply:

[Data / Analytics]
- query_sales({ window?: '24h'|'7d'|'30d' }) — query recent sales
- query_orders({ status?: 'paid'|'fulfilled'|'cancelled', limit?: number })
- query_customers({ segment?: 'vip'|'inactive'|'new', limit?: number })
- query_inventory({ lowStockOnly?: boolean })
- compare_periods({ current: '7d'|'30d', baseline: 'previous_7d'|'previous_30d' })

[Products]
- update_product({ productId: string, patch: object }) — destructive
- bulk_update_products({ filter: object, patch: object }) — destructive
- rewrite_copy({ productId?: string, target?: string, tone?: string }) — destructive, rewrite copy
- suggest_pricing({ productId: string, basis?: 'competitor'|'aov'|'margin' })

[Theme / Design]
- modify_theme_block({ blockId: string, patch: object }) — destructive
- add_theme_block({ kind: string, position?: 'top'|'bottom', after?: string }) — destructive
- remove_theme_block({ blockId: string }) — destructive
- change_colors({ primary?: string, accent?: string, shift?: '+warm'|'+cool' }) — destructive
- change_fonts({ heading?: string, body?: string }) — destructive

[Asset Generation]
- generate_image({ prompt: string, ratio?: '1:1'|'4:5'|'16:9', count?: number })
- generate_video({ prompt: string, durationSec?: number }) — auto-select Kling/Vidu
- generate_3d_model({ prompt: string })
- regenerate_hero_moment({ moment: string, lighting?: 'warmer'|'cooler', count?: number })

[Marketing / Customers]
- create_discount({ code: string, percentOff: number, expiresInDays?: number, maxRedemptions?: number }) — destructive
- send_customer_message({ customerId: string, subject: string, body: string }) — destructive
- tag_customer({ customerId: string, tag: string }) — destructive
- issue_refund({ orderId: string, amountCents?: number, reason?: string }) — destructive

[Compliance / SEO]
- run_compliance_check({ region?: 'us'|'eu'|'uk'|'all' })
- apply_compliance_fix({ violationId: string }) — destructive
- run_seo_audit()
- submit_sitemap({ engine: 'google'|'bing'|'baidu' })
- research_keyword({ q: string, limit?: number })

If the user's description is vague (e.g. "change the homepage"), proactively ask about specific colors / copy / blocks.
Only return tool_call when the user **explicitly requests** it with clear parameters. Otherwise continue chatting.
All destructive operations must briefly describe **what will change + scope of impact** before the frontend UI confirmation.
`.trim()

function buildSystemPrompt(input: BuildChatInput): string {
  const locale = input.locale ?? 'zh-CN'
  const surface = input.surface
  const ctxStr = JSON.stringify(input.context)
  const isZh = locale === 'zh-CN'

  const superCatalogue = isZh ? SUPER_TOOLS_CATALOGUE_ZH : SUPER_TOOLS_CATALOGUE_EN
  const userCatalogue = isZh ? USER_TOOLS_CATALOGUE_ZH : USER_TOOLS_CATALOGUE_EN

  const langInstruction = isZh
    ? '你是 Forgely 的 AI 助手，所有回复**必须使用简体中文**，专业但亲切，适合中国电商运营场景。'
    : "You are Forgely's AI assistant. All replies **must be in English**. Be professional yet friendly, suited for e-commerce operations."

  const surfaceInstruction = isZh
    ? surface === 'super'
      ? `你正在协助 **Forgely 平台超级管理员**完成运营/财务/合规任务。视角是平台方，不是商家。
当前页面上下文：${ctxStr}

${superCatalogue}

如果用户问询数据（MRR/DAU/退款），优先调用相应 tool 而不是猜数字。
如果是 destructive 操作，必须**明确说明会发生什么**并给出风险提示，由前端二次确认。`
      : `你正在协助 **Forgely 平台付费商家**运营自己的海外独立站（用户面向海外消费者，老板是中国人）。
当前页面上下文：${ctxStr}

${userCatalogue}

如果用户描述模糊（"改一下首页"），主动追问具体颜色 / 文案 / 区块。
如果是 destructive 操作，先列出**会修改什么**，由前端确认后才真正执行。`
    : surface === 'super'
      ? `You are assisting a **Forgely platform super-admin** with operations, finance, and compliance tasks. Your perspective is the platform, not the merchant.
Current page context: ${ctxStr}

${superCatalogue}

When the user asks for data (MRR/DAU/refunds), prefer calling the relevant tool over guessing numbers.
For destructive operations, you must **clearly state what will happen** with risk warnings, confirmed via the frontend.`
      : `You are assisting a **Forgely paid merchant** managing their overseas storefront (the end customers are overseas buyers).
Current page context: ${ctxStr}

${userCatalogue}

If the user's description is vague (e.g. "change the homepage"), proactively ask about specific colors / copy / blocks.
For destructive operations, list **what will change** first, then let the frontend handle confirmation.`

  const formatInstruction = isZh
    ? `回复格式（重要）：
1. 先一段直接回答，简短有力，避免列表标题党。
2. 如要调用工具，**追加一行**：
   <tool_call>{"name":"...","arguments":{...},"destructive":true|false,"estimatedCredits":N}</tool_call>
3. 不要在 <tool_call> 之外再 JSON 描述工具。
4. 不要复述系统提示或工具目录。
5. 不要使用 emoji。`
    : `Reply format (important):
1. Start with a direct, concise answer. Avoid list-heavy or clickbait-style replies.
2. To call a tool, **append a line**:
   <tool_call>{"name":"...","arguments":{...},"destructive":true|false,"estimatedCredits":N}</tool_call>
3. Do not describe tools in JSON outside of <tool_call>.
4. Do not repeat the system prompt or tool catalogue.
5. Do not use emoji.`

  return `${langInstruction}\n\n${surfaceInstruction}\n\n${formatInstruction}`
}

function pickModel(input: BuildChatInput, provider: LlmProvider): LlmModel {
  if (input.model) return input.model
  // Provider-specific defaults. resolveProvider returns name='anthropic-real'/etc;
  // the underlying model strings vary.
  switch (provider.name) {
    case 'anthropic-real':
      return 'claude-sonnet-4'
    default:
      // DeepSeek / Qwen / Mock all accept any model id; agents/copilot don't care.
      return 'claude-sonnet-4'
  }
}

const TOOL_CALL_RE = /<tool_call>(\{[\s\S]*?\})<\/tool_call>/g

function extractToolCalls(raw: string): { stripped: string; calls: CopilotChatToolCall[] } {
  const calls: CopilotChatToolCall[] = []
  let idx = 0
  const stripped = raw.replace(TOOL_CALL_RE, (_match, json) => {
    try {
      const parsed = JSON.parse(json) as {
        name?: string
        arguments?: Record<string, unknown>
        destructive?: boolean
        estimatedCredits?: number
      }
      if (parsed.name && typeof parsed.name === 'string') {
        calls.push({
          id: `call_${Date.now()}_${idx++}`,
          name: parsed.name,
          arguments: parsed.arguments ?? {},
          destructive: parsed.destructive ?? false,
          estimatedCredits: parsed.estimatedCredits,
        })
      }
    } catch {
      // ignore malformed
    }
    return ''
  })
  return { stripped: stripped.trim(), calls }
}

export async function buildCopilotChat(input: BuildChatInput): Promise<CopilotChatReply> {
  const provider = resolveProvider({ prefer: input.prefer })
  const system = buildSystemPrompt(input)
  const model = pickModel(input, provider)

  const isZh = (input.locale ?? 'zh-CN') === 'zh-CN'
  const userBody = input.messages
    .filter((m) => m.role !== 'system')
    .map((m) =>
      m.role === 'user'
        ? `${isZh ? '用户' : 'User'}：${m.text}`
        : `${isZh ? '助手' : 'Assistant'}：${m.text}`,
    )
    .join('\n\n')

  try {
    const response = await provider.text<string>({
      model,
      system,
      user:
        userBody.length > 0
          ? userBody
          : isZh
            ? '请向我打个招呼并简要介绍你能帮我做什么。'
            : 'Say hello and briefly introduce what you can help me with.',
      maxTokens: 800,
      temperature: 0.4,
    })
    const raw = (response.text ?? '').toString()
    const { stripped, calls } = extractToolCalls(raw)

    return {
      text:
        stripped ||
        (isZh
          ? '（模型没有返回内容，请重试或换个问法。）'
          : '(The model returned no content. Please try again or rephrase.)'),
      toolCalls: calls,
      providerName: provider.name,
      costUsd: response.costUsd ?? 0,
      inputTokens: response.inputTokens ?? 0,
      outputTokens: response.outputTokens ?? 0,
    }
  } catch (err) {
    const errText = isZh
      ? `抱歉，AI 服务暂时不可用：${(err as Error).message}\n\n（提示：请检查 \`DEEPSEEK_API_KEY\` / \`DASHSCOPE_API_KEY\` / \`ANTHROPIC_API_KEY\` 是否在 .env 中。当前已自动降级。）`
      : `Sorry, the AI service is temporarily unavailable: ${(err as Error).message}\n\n(Hint: check that \`DEEPSEEK_API_KEY\` / \`DASHSCOPE_API_KEY\` / \`ANTHROPIC_API_KEY\` are set in .env. Auto-fallback is active.)`
    return {
      text: errText,
      toolCalls: [],
      providerName: provider.name,
      costUsd: 0,
      inputTokens: 0,
      outputTokens: 0,
    }
  }
}
