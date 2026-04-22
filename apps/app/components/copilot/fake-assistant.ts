/**
 * Fake assistant — context-aware, locale-aware (zh-CN by default)
 * canned answers that demonstrate the Tool Use UX without any LLM
 * round-trip.
 *
 * Sprint-3 added the persistence layer; sprint-4 (this file) adds:
 *
 *   - 中文优先 + 英文 fallback (面向中国用户)
 *   - super-admin 上下文识别 + super_* 工具调用
 *   - 关键词匹配同时识别中英文 (eg. "退款" + "refund")
 *
 * When the real LLM ships (W1 T16/T17 + W3 trpc.copilot.chat) this
 * file is replaced by `await trpc.copilot.chat.mutate(...)` in
 * `copilot-provider.tsx`. The output shape stays identical.
 */
import type { CopilotLocale, CopilotPageContext, ToolCall, ToolName } from './types'

/**
 * Pick the default Copilot locale.
 *
 * Resolution order:
 *   1. Explicit `localStorage['forgely:locale']` (synced from User.locale
 *      by `<LocaleProvider>` on login)
 *   2. Browser `navigator.language`  (en* → 'en', anything else → zh-CN)
 *   3. `'zh-CN'` (we target Chinese users primarily)
 *
 * Server-side rendering paths can't see `navigator`, so they always
 * resolve to `'zh-CN'`.
 */
export function defaultLocale(): CopilotLocale {
  if (typeof window === 'undefined') return 'zh-CN'
  try {
    const stored = window.localStorage.getItem('forgely:locale')
    if (stored === 'en' || stored === 'zh-CN') return stored
  } catch {
    /* localStorage may be blocked */
  }
  const lang = (navigator.language ?? '').toLowerCase()
  return lang.startsWith('en') ? 'en' : 'zh-CN'
}

interface AssistantReply {
  text: string
  toolCalls?: Omit<ToolCall, 'id' | 'status'>[]
}

const tc = (
  name: ToolName,
  args: Record<string, unknown>,
  destructive = false,
  estimatedCredits?: number,
): Omit<ToolCall, 'id' | 'status'> => ({
  name,
  arguments: args,
  destructive,
  estimatedCredits,
})

/* ────────────────────── 上下文识别 / Context line ────────────────── */

function isSuperContext(ctx: CopilotPageContext): boolean {
  return ctx.kind.startsWith('super-')
}

const ZH_CTX: Partial<Record<CopilotPageContext['kind'], (ctx: CopilotPageContext) => string>> = {
  product: (c) => `当前商品:**${(c as { productTitle: string }).productTitle}**。`,
  'product-list': () => '我能看到你的商品列表。',
  order: (c) => `当前订单:**${(c as { orderNumber: string }).orderNumber}**。`,
  'order-list': () => '正在浏览订单。',
  customer: (c) => `客户档案:**${(c as { customerName: string }).customerName}**。`,
  'customer-list': () => '正在浏览客户列表。',
  media: () => '媒体库已加载。',
  'brand-kit': () => '正在阅读品牌资产。',
  editor: (c) => {
    const e = c as { selectedBlockId?: string; selectedBlockType?: string }
    return e.selectedBlockId
      ? `主题编辑器 — 当前选中:**${e.selectedBlockType ?? '区块'}**。`
      : '主题编辑器 — 未选中区块。'
  },
  dashboard: () => '已经看到你的数据看板。',
  global: () => '',
  'super-overview': () => '🛡 超级管理员视角 · 平台总览。',
  'super-users': () => '🛡 超级管理员视角 · 用户管理。',
  'super-user': (c) => {
    const u = c as { userEmail: string; userId: string }
    return `🛡 超管视角 · 用户:**${u.userEmail}** (id ${u.userId})。`
  },
  'super-finance': () => '🛡 超管视角 · 财务对账。',
  'super-audit': () => '🛡 超管视角 · 审计日志。',
  'super-team': () => '🛡 超管视角 · 内部团队。',
  'super-marketing': () => '🛡 超管视角 · 营销 / Push。',
  'super-plugins': () => '🛡 超管视角 · 插件审核。',
  'super-health': () => '🛡 超管视角 · 系统健康。',
  'super-ai-ops': () => '🛡 超管视角 · AI 运营 / 成本监控。',
  'super-sites': () => '🛡 超管视角 · 站点管理 / 冻结。',
  'super-content': () => '🛡 超管视角 · 平台内容与文档。',
  'super-analytics': () => '🛡 超管视角 · 平台数据分析。',
  'super-support': () => '🛡 超管视角 · 客服与工单。',
  'super-settings': () => '🛡 超管视角 · 平台设置。',
}

function contextLine(ctx: CopilotPageContext): string {
  const fn = ZH_CTX[ctx.kind]
  return fn ? fn(ctx) : ''
}

/* ────────────────────── 关键词匹配 ────────────────────────────── */

const matchAny = (input: string, terms: string[]): boolean =>
  terms.some((t) => input.toLowerCase().includes(t.toLowerCase()))

/* ────────────────────── Super-admin 路径 ──────────────────────── */

function fakeSuperAssistant(input: string, ctx: CopilotPageContext): AssistantReply {
  const ctxLine = contextLine(ctx)
  const prefix = ctxLine ? `${ctxLine}\n\n` : ''

  // 销售 / MRR / DAU
  if (matchAny(input, ['mrr', 'arr', '收入', '订阅'])) {
    return {
      text:
        prefix +
        '本月 MRR **¥1,025,400**(↑12.3% MoM),ARR ≈ **¥12,300K**。订阅用户 **18,234**(净增 +342),DAU **4,921**。AI 成本占比 **18.7%**(目标 < 25%)。',
      toolCalls: [
        tc('super_query_mrr', { range: 'this_month', compare: 'last_month' }, false),
        tc('super_query_dau', { window: '30d' }, false),
        tc('super_query_ai_cost', { range: 'this_month' }, false),
      ],
    }
  }

  // 用户 / 用户管理
  if (matchAny(input, ['user', '用户', '禁用', 'ban', 'suspend'])) {
    return {
      text:
        prefix +
        '我可以查询用户、临时登录(Login as)、调整积分、封禁/解禁。请确认你要执行的具体操作 — 所有写入都会留痕到审计日志。',
      toolCalls: [
        tc('super_query_user', { query: input.trim() }, false),
        tc('super_ban_user', { userId: '<待填>', reason: '<待填>', durationDays: 7 }, true),
      ],
    }
  }

  // 退款 / refund
  if (matchAny(input, ['refund', '退款', '退单'])) {
    return {
      text:
        prefix +
        '我可以**强制退款**。请填订单号 + 原因。退款会同步到 Stripe / 微信支付,并记入审计。',
      toolCalls: [
        tc('super_force_refund', { orderId: '<待填>', amountCents: 0, reason: '<待填>' }, true),
      ],
    }
  }

  // 积分 / credit
  if (matchAny(input, ['积分', 'credit'])) {
    return {
      text: prefix + '我可以**增减用户积分**。需要填用户 id + 数量(正负皆可)+ 原因(必填)。',
      toolCalls: [
        tc(
          'super_credit_adjustment',
          { userId: '<待填>', deltaCredits: 1000, reason: '<待填>' },
          true,
        ),
      ],
    }
  }

  // 站点 takedown / freeze
  if (matchAny(input, ['takedown', 'freeze', '下架', '冻结', 'suspend site'])) {
    return {
      text:
        prefix + '⚠️ 站点冻结会立即停止访问 + 通知站主。请提供站点 id + 冻结原因(违规/欠费/其他)。',
      toolCalls: [tc('super_freeze_site', { siteId: '<待填>', reason: '<待填>' }, true)],
    }
  }

  // 审计 / audit
  if (matchAny(input, ['audit', '审计', '日志'])) {
    return {
      text:
        prefix +
        '查询审计日志:可按 actor / action / target / 时间筛选。我把最近 50 条 critical 事件拉给你。',
      toolCalls: [tc('super_query_audit', { severity: 'critical', limit: 50 }, false)],
    }
  }

  // 全平台公告 / push
  if (matchAny(input, ['公告', 'announcement', 'push', '推送'])) {
    return {
      text: prefix + '即将向**全部 18,234 个用户**发送站内公告。请确认标题 + 正文(支持 Markdown)。',
      toolCalls: [
        tc(
          'super_send_announcement',
          {
            channel: 'in-app',
            audience: 'all_users',
            title: '<标题>',
            body: '<正文>',
          },
          true,
        ),
      ],
    }
  }

  // 财务导出
  if (matchAny(input, ['export', '导出', '对账', 'finance'])) {
    return {
      text: prefix + '我把本月对账(收入 / 退款 / AI 成本 / 净利)导出为 CSV。',
      toolCalls: [tc('super_export_finance', { range: 'this_month', format: 'csv' }, false)],
    }
  }

  // 默认
  return {
    text:
      prefix +
      '🛡 我是**超管 Copilot**。试试:**「本月 MRR」**、**「找到 user_7a8f」**、**「给 u_123 加 1000 积分」**、**「退订单 #2042」**、**「冻结站点 site_xx」**、**「发全平台公告」**、**「最近 critical 审计」**、**「导出本月对账」**。',
  }
}

/* ────────────────────── 用户后台路径 ──────────────────────────── */

function fakeUserAssistant(input: string, ctx: CopilotPageContext): AssistantReply {
  const ctxLine = contextLine(ctx)
  const prefix = ctxLine ? `${ctxLine}\n\n` : ''

  // 定价
  if (matchAny(input, ['price', '定价', '价格', '提价', '降价'])) {
    return {
      text:
        prefix +
        '建议把 **Primary Essentials Blend** 调到 **¥168**(基于竞品中位数 + 你的 AOV)。确认后我就改你的草稿。',
      toolCalls: [
        tc(
          'suggest_pricing',
          { productId: 'p_001', target: 16800, basis: 'competitor-median+AOV' },
          false,
        ),
        tc('update_product', { productId: 'p_001', priceCents: 16800 }, true),
      ],
    }
  }

  // 文案
  if (matchAny(input, ['rewrite', '重写', '文案', 'headline', '标题'])) {
    return {
      text: prefix + '我给你三个文案 A/B/C,选一个我直接换上草稿。',
      toolCalls: [
        tc(
          'rewrite_copy',
          {
            target: ctx.kind === 'product' ? 'product.title' : 'theme.hero.headline',
            options: [
              '一杯让人愿意起床的清晨。',
              '凌晨摘豆,周五到你手里。',
              '只做一件事 · 单一产地。',
            ],
          },
          true,
        ),
      ],
    }
  }

  // 视频 / hero
  if (matchAny(input, ['video', '视频', 'hero', '英雄区', '重新生成'])) {
    return {
      text: prefix + '我重新生成 hero 视频(**暖色光线**)+ 2 个备选,大约消耗 150 积分。',
      toolCalls: [
        tc(
          'regenerate_hero_moment',
          { moment: 'Liquid Bath', lighting: 'warmer', count: 3 },
          true,
          150,
        ),
      ],
    }
  }

  // 配色
  if (matchAny(input, ['color', '配色', '颜色', '暖', '冷'])) {
    return {
      text: prefix + '把主色往**琥珀 / 余烬**方向偏移 + 对比度 +6%,实时刷新预览。',
      toolCalls: [
        tc('change_colors', { primary: '#C74A0A', accent: '#FFD166', shift: '+warm' }, true),
      ],
    }
  }

  // 销售 / 报表
  if (matchAny(input, ['sales', '销售', '收入', 'revenue', '本月', '上周'])) {
    return {
      text:
        prefix +
        '近 30 天:**¥20,500** 收入 / **23 单** / **3.2% 转化**(环比 ↑12.3%)。**Primary Essentials** 是你的第一爆款,转化高于全店均值 **23%**。',
      toolCalls: [
        tc('query_sales', { range: '30d' }, false),
        tc('compare_periods', { current: '30d', baseline: 'previous_30d' }, false),
      ],
    }
  }

  // 优惠码
  if (matchAny(input, ['discount', 'coupon', '优惠', '折扣', '抵扣'])) {
    return {
      text: prefix + '我创建一个 **8.5 折** 限时码,7 天内有效,封顶 200 次使用。',
      toolCalls: [
        tc(
          'create_discount',
          { code: 'WARMUP15', percent: 15, expiresInDays: 7, maxRedemptions: 200 },
          true,
        ),
      ],
    }
  }

  // 退款
  if (matchAny(input, ['refund', '退款', '退单'])) {
    return {
      text: prefix + '我帮你**全额退款**这个订单,并把客户标记为「需要回访」。',
      toolCalls: [
        tc('issue_refund', { orderId: 'o_2037', reason: 'damaged-shipment' }, true),
        tc('tag_customer', { customerId: 'c_001', tag: 'recovery' }, true),
      ],
    }
  }

  // 默认
  return {
    text:
      prefix +
      '我是 Forgely **Copilot**。你可以让我:分析销售、重写文案、改配色、生成视频/图片、编辑主题、发优惠码、给客户发消息……试试 **「本月销售」**、**「重写 Hero 标题」** 或 **「把配色改暖一点」**。',
  }
}

/* ────────────────────── 入口 ──────────────────────────────────── */

/**
 * Generate a canned assistant reply for `input` given the page `ctx`.
 *
 * `locale` is accepted to match the production `trpc.copilot.chat`
 * signature once it lands; for the MVP we always reply in Chinese
 * because the target user base is Chinese sellers. English support is
 * intentionally minimal — pure copy-pass-through of the same text — so
 * we don't ship a stale English mock that drifts from the Chinese one.
 */
export function fakeAssistant(
  input: string,
  ctx: CopilotPageContext,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- locale is part of the future trpc.copilot.chat signature; reserved here for API parity.
  _locale: CopilotLocale = 'zh-CN',
): AssistantReply {
  return isSuperContext(ctx) ? fakeSuperAssistant(input, ctx) : fakeUserAssistant(input, ctx)
}
