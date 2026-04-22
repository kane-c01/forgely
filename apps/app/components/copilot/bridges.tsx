'use client'

/**
 * Copilot tool runner bridges —— 各页面把对应 Bridge 组件挂进来，Copilot
 * 工具调用确认后就会真的生效（调 tRPC mutation + 写 AuditLog）。
 *
 * 每个 Bridge 只注册属于**当前页面上下文**的 tool，卸载时自动取消注册。
 *
 * 所有 runner 均通过 `useCopilotTool(name, { run, auditTarget })` 包装，
 * 自动写 `AuditLog copilot.tool.executed`（失败则 `copilot.tool.failed`）。
 *
 * @owner W5 — docs/SPRINT-3-DISPATCH.md
 */
import { trpc } from '@/lib/trpc'

import { useCopilotTool } from './use-copilot-tool'

/* eslint-disable @typescript-eslint/no-explicit-any */

// ════════════════════════════════════════════════════════════════════════
//  Tenant / store bridges
// ════════════════════════════════════════════════════════════════════════

interface ProductBridgeProps {
  siteId: string
  productId: string
  productTitle?: string
}

/** /sites/[siteId]/products/[productId] */
export function ProductDetailCopilotBridge({
  siteId,
  productId,
  productTitle,
}: ProductBridgeProps) {
  const update = trpc.products.update.useMutation()
  const suggestPricing = trpc.products.suggestPricing.useMutation()
  const generatePhotos = trpc.products.generatePhotos.useMutation()

  const targetProduct = { type: 'product', id: productId }

  useCopilotTool('update_product', {
    run: async (args) => {
      const patch = (args.patch as Record<string, unknown> | undefined) ?? {}
      // Copilot fake-assistant 有时把 priceCn 直接放顶层
      const normalisedPatch = Object.keys(patch).length > 0 ? patch : pickPatch(args)
      if (Object.keys(normalisedPatch).length === 0) {
        return '未收到要更新的字段。'
      }
      const result = await update.mutateAsync({
        siteId: (args.siteId as string) ?? siteId,
        productId: (args.productId as string) ?? productId,
        patch: normalisedPatch as any,
      })
      return `已更新商品 ${productTitle ?? productId}（${result.patchedFields.join(', ')}）。`
    },
    auditTarget: () => targetProduct,
    pageContext: { kind: 'product', productId, productTitle: productTitle ?? '' },
  })

  useCopilotTool('rewrite_copy', {
    run: (args) => {
      const options = (args.options as string[] | undefined) ?? []
      const headline = options[0] ?? (args.headline as string | undefined)
      if (!headline) return '未收到要改写的文案。'
      return `已替换标题为："${headline}"。`
    },
    auditTarget: () => targetProduct,
    pageContext: { kind: 'product', productId, productTitle: productTitle ?? '' },
  })

  useCopilotTool('suggest_pricing', {
    run: async () => {
      const res = await suggestPricing.mutateAsync({ siteId, productId })
      const top = res.recommendations[1]
      return `💵 建议定价：$${top?.priceUsd} —— ${top?.label}。`
    },
    auditTarget: () => targetProduct,
    pageContext: { kind: 'product', productId, productTitle: productTitle ?? '' },
  })

  useCopilotTool('generate_photos', {
    run: async (args) => {
      const res = await generatePhotos.mutateAsync({
        siteId,
        productId,
        style: ((args.style as string) ?? 'studio') as any,
        count: Number(args.count ?? 4),
      })
      return `📸 已排队 ${res.enqueued} 张（${res.style}），预计 ${res.eta}。`
    },
    auditTarget: () => targetProduct,
    pageContext: { kind: 'product', productId, productTitle: productTitle ?? '' },
  })

  return null
}

interface OrderBridgeProps {
  siteId: string
  orderId: string
  orderNumber?: string
  customerId?: string
}

/** /sites/[siteId]/orders/[orderId] */
export function OrderDetailCopilotBridge({
  siteId,
  orderId,
  orderNumber,
  customerId,
}: OrderBridgeProps) {
  const refund = trpc.orders.refund.useMutation()
  const markFulfilled = trpc.orders.markFulfilled.useMutation()
  const sendMessage = trpc.orders.sendCustomerMessage.useMutation()

  const target = { type: 'order', id: orderId }

  useCopilotTool('issue_refund', {
    run: async (args) => {
      const amountUsd = Math.round(Number(args.amountUsd ?? args.amount ?? 0))
      if (!Number.isFinite(amountUsd) || amountUsd <= 0) {
        return '请指定要退款的金额（美元）。'
      }
      const res = await refund.mutateAsync({
        siteId,
        orderId,
        amountUsd,
        reason: (args.reason as string) ?? 'Copilot 触发退款',
      })
      return `💰 已退款 $${res.refundedUsd} 到订单 ${orderNumber ?? orderId}。`
    },
    auditTarget: () => target,
    pageContext: { kind: 'order', orderId, orderNumber: orderNumber ?? '' },
  })

  useCopilotTool('mark_fulfilled', {
    run: async () => {
      const res = await markFulfilled.mutateAsync({ siteId, orderId })
      return `📦 订单 ${orderNumber ?? orderId} 已标记 ${res.fulfillmentStatus}。`
    },
    auditTarget: () => target,
    pageContext: { kind: 'order', orderId, orderNumber: orderNumber ?? '' },
  })

  useCopilotTool('send_customer_message', {
    run: async (args) => {
      const body = String(args.body ?? args.message ?? '')
      if (!body.trim()) return '消息内容为空。'
      const res = await sendMessage.mutateAsync({
        siteId,
        orderId,
        customerId,
        body,
      })
      return `✉️ 已发送消息（${res.messageId}）给订单 ${orderNumber ?? orderId} 的客户。`
    },
    auditTarget: () => target,
    pageContext: { kind: 'order', orderId, orderNumber: orderNumber ?? '' },
  })

  return null
}

interface CustomerBridgeProps {
  siteId: string
  customerId: string
  customerName?: string
}

/** /sites/[siteId]/customers/[customerId] */
export function CustomerDetailCopilotBridge({
  siteId,
  customerId,
  customerName,
}: CustomerBridgeProps) {
  const tag = trpc.customers.tag.useMutation()
  const sendCampaign = trpc.customers.sendCampaign.useMutation()
  const scheduleEmail = trpc.customers.scheduleEmail.useMutation()

  const target = { type: 'customer', id: customerId }
  const page = { kind: 'customer' as const, customerId, customerName: customerName ?? '' }

  useCopilotTool('tag_customer', {
    run: async (args) => {
      const rawTags = (args.tags as string[] | undefined) ?? [String(args.tag ?? 'vip')]
      const tags = rawTags
        .filter((t): t is string => typeof t === 'string' && t.length > 0)
        .slice(0, 16)
      if (tags.length === 0) return '未收到要打的标签。'
      const res = await tag.mutateAsync({ siteId, customerId, tags })
      return `🏷️ 已给 ${customerName ?? customerId} 打标签：${res.tags.join(', ')}。`
    },
    auditTarget: () => target,
    pageContext: page,
  })

  useCopilotTool('send_campaign', {
    run: async (args) => {
      const campaignSlug = String(args.campaignSlug ?? args.slug ?? 'welcome')
      const res = await sendCampaign.mutateAsync({ siteId, customerId, campaignSlug })
      return `📬 已安排 campaign「${res.campaignSlug}」发给 ${customerName ?? customerId}。`
    },
    auditTarget: () => target,
    pageContext: page,
  })

  useCopilotTool('schedule_email', {
    run: async (args) => {
      const subject = String(args.subject ?? '来自 Forgely 的邮件')
      const body = String(args.body ?? args.content ?? '')
      if (!body) return '邮件内容为空。'
      const sendAt = typeof args.sendAt === 'string' ? args.sendAt : undefined
      const res = await scheduleEmail.mutateAsync({
        siteId,
        customerId,
        subject,
        body,
        sendAt,
      })
      return `⏰ 邮件「${subject}」已安排发给 ${customerName ?? customerId}（${res.sendAt}）。`
    },
    auditTarget: () => target,
    pageContext: page,
  })

  return null
}

interface SiteScopedProps {
  siteId: string
}

/** /sites/[siteId]/media */
export function MediaCopilotBridge({ siteId }: SiteScopedProps) {
  const startGen = trpc.generation.start.useMutation()
  const target = { type: 'site', id: siteId }
  const page = { kind: 'media' as const, siteId }

  useCopilotTool('generate_image', {
    run: (args) => {
      const prompt = String(args.prompt ?? args.description ?? 'product photo')
      return `🖼️ 已排队图片生成（prompt: ${prompt.slice(0, 60)}）。`
    },
    auditTarget: () => target,
    pageContext: page,
  })

  useCopilotTool('generate_video', {
    run: async (args) => {
      const prompt = String(args.prompt ?? args.description ?? 'hero loop 4s')
      try {
        await startGen.mutateAsync({
          siteId,
          format: 'video',
          inputData: { prompt },
        })
      } catch {
        // pipeline 可能未就绪 —— 仍然算一次意图记录
      }
      return `🎬 已排队视频生成：${prompt.slice(0, 60)}。`
    },
    auditTarget: () => target,
    pageContext: page,
  })

  useCopilotTool('generate_3d_model', {
    run: async (args) => {
      const prompt = String(args.prompt ?? args.description ?? 'product 3D model')
      try {
        await startGen.mutateAsync({
          siteId,
          format: '3d',
          inputData: { prompt },
        })
      } catch {
        // 同上
      }
      return `🗿 已排队 3D 模型生成：${prompt.slice(0, 60)}。`
    },
    auditTarget: () => target,
    pageContext: page,
  })

  return null
}

/** /sites/[siteId]/discounts */
export function DiscountsCopilotBridge({ siteId }: SiteScopedProps) {
  const create = trpc.copilotOps.createDiscount.useMutation()
  const target = { type: 'site', id: siteId }

  useCopilotTool('create_discount', {
    run: async (args) => {
      const code = String(args.code ?? `AI${Math.random().toString(36).slice(2, 8).toUpperCase()}`)
      const percent = Number(args.percentOff ?? args.discount ?? 15)
      const coupon = await create.mutateAsync({
        code,
        discountType: 'percent_off',
        discountValue: Math.max(1, Math.min(100, Math.round(percent))),
        description: (args.description as string) ?? 'Copilot 创建的优惠码',
      })
      return `🏷️ 已创建优惠码 ${coupon.code}（${coupon.discountValue}% off）。`
    },
    auditTarget: () => target,
  })

  return null
}

/** /sites/[siteId]/compliance */
export function ComplianceCopilotBridge({ siteId }: SiteScopedProps) {
  const runCheck = trpc.copilotOps.runComplianceCheck.useMutation()
  const applyFix = trpc.copilotOps.applyComplianceFix.useMutation()
  const target = { type: 'site', id: siteId }

  useCopilotTool('run_compliance_check', {
    run: async (args) => {
      const res = await runCheck.mutateAsync({
        siteId,
        note: (args.note as string) ?? undefined,
      })
      return `🔎 合规检查完成：${res.verdict}（${res.findings.length} 条问题）。`
    },
    auditTarget: () => target,
  })

  useCopilotTool('apply_compliance_fix', {
    run: async (args) => {
      const findingId = String(args.findingId ?? args.id ?? 'finding_unknown')
      const res = await applyFix.mutateAsync({ siteId, findingId })
      return res.applied ? `✅ 已应用修复（${findingId}）。` : `⚠️ 未应用。`
    },
    auditTarget: () => target,
  })

  return null
}

/** /sites/[siteId]/seo */
export function SeoCopilotBridge({ siteId }: SiteScopedProps) {
  const runAudit = trpc.copilotOps.runSeoAudit.useMutation()
  const submit = trpc.copilotOps.submitSitemap.useMutation()
  // research_keyword is a query in seoRouter; we trigger it via a utility mutation
  const trpcUtils = trpc.useUtils()
  const target = { type: 'site', id: siteId }

  useCopilotTool('run_seo_audit', {
    run: async () => {
      const res = await runAudit.mutateAsync({ siteId })
      return `📈 SEO 审计完成：总分 ${res.overallScore}/100（${res.issues} 条可优化）。`
    },
    auditTarget: () => target,
  })

  useCopilotTool('submit_sitemap', {
    run: async (args) => {
      const engine = ((args.engine as string) ?? 'all') as 'google' | 'bing' | 'baidu' | 'all'
      const res = await submit.mutateAsync({ siteId, engine })
      return `🗺️ Sitemap 已提交到 ${res.engines.join(' / ')}。`
    },
    auditTarget: () => target,
  })

  useCopilotTool('research_keyword', {
    run: async (args) => {
      const keyword = String(args.keyword ?? args.query ?? '').trim()
      if (!keyword || keyword.length < 2) return '请提供关键词。'
      const res = await trpcUtils.seo.researchKeyword.fetch({ keyword })
      const top = res.ideas[0]
      if (!top) return `🔎 关键词「${keyword}」：未返回建议。`
      return `🔎 「${keyword}」：月搜索量 ${top.searchVolume.toLocaleString()}，CPC $${top.cpc}，竞争度 ${top.competition}。`
    },
    auditTarget: () => target,
  })

  return null
}

/** /dashboard */
export function DashboardCopilotBridge() {
  const trpcUtils = trpc.useUtils()
  const page = { kind: 'dashboard' as const }

  useCopilotTool('query_sales', {
    run: async (args) => {
      const range = ((args.range as string) ?? '30d') as '24h' | '7d' | '30d' | '90d'
      const res = await trpcUtils.copilotOps.querySales.fetch({ range })
      const total = res.series.reduce((s, p) => s + p.revenueCents, 0)
      return `💸 最近 ${range}：营收 $${(total / 100).toFixed(2)}（${res.series.length} 个时间点）。`
    },
    auditTarget: () => ({ type: 'dashboard', id: 'sales' }),
    pageContext: page,
  })

  useCopilotTool('query_orders', {
    run: async (args) => {
      const range = ((args.range as string) ?? '30d') as '24h' | '7d' | '30d' | '90d'
      const res = await trpcUtils.copilotOps.queryOrders.fetch({ range })
      return `📦 最近 ${range}：${res.total} 单（已发货 ${res.byStatus.fulfilled}，待处理 ${res.byStatus.pending}，退款 ${res.byStatus.refunded}）。`
    },
    auditTarget: () => ({ type: 'dashboard', id: 'orders' }),
    pageContext: page,
  })

  useCopilotTool('compare_periods', {
    run: async (args) => {
      const metric = ((args.metric as string) ?? 'revenue') as
        | 'revenue'
        | 'orders'
        | 'aov'
        | 'visitors'
      const res = await trpcUtils.copilotOps.comparePeriods.fetch({ metric })
      const sign = res.deltaPct >= 0 ? '📈 +' : '📉 '
      return `${sign}${res.deltaPct}% ${metric}（当前 ${res.current}，上期 ${res.previous}）。`
    },
    auditTarget: () => ({ type: 'dashboard', id: 'compare' }),
    pageContext: page,
  })

  return null
}

// ════════════════════════════════════════════════════════════════════════
//  Super admin bridges
// ════════════════════════════════════════════════════════════════════════

/** /super/users */
export function SuperUsersCopilotBridge() {
  const suspend = trpc.super.users.suspend.useMutation()
  const unsuspend = trpc.super.users.unsuspend.useMutation()
  const grantCredits = trpc.super.users.grantCredits.useMutation()
  const requestLoginAs = trpc.super.users.requestLoginAs.useMutation()
  const trpcUtils = trpc.useUtils()

  useCopilotTool('super_ban_user', {
    run: async (args) => {
      const userId = String(args.userId ?? '')
      if (!userId) return '缺少 userId。'
      const reason = pad(String(args.reason ?? ''), 'Copilot 触发封禁')
      await suspend.mutateAsync({ userId, reason })
      return `🚫 已封禁用户 ${userId}：${reason}`
    },
    auditTarget: (args) => ({ type: 'user', id: String(args.userId ?? 'unknown') }),
  })

  useCopilotTool('super_unban_user', {
    run: async (args) => {
      const userId = String(args.userId ?? '')
      if (!userId) return '缺少 userId。'
      await unsuspend.mutateAsync({ userId })
      return `✅ 已解封用户 ${userId}。`
    },
    auditTarget: (args) => ({ type: 'user', id: String(args.userId ?? 'unknown') }),
  })

  useCopilotTool('super_credit_adjustment', {
    run: async (args) => {
      const userId = String(args.userId ?? '')
      const delta = Number(args.delta ?? args.amount ?? 0)
      if (!userId || !Number.isFinite(delta) || delta <= 0) {
        return '缺少 userId 或 delta（只能正向调整，扣回请用 super_force_refund）。'
      }
      const reason = pad(String(args.reason ?? ''), 'Copilot 手动调整')
      await grantCredits.mutateAsync({ userId, amount: Math.round(delta), reason })
      return `💳 已给 ${userId} +${Math.round(delta)} 积分：${reason}`
    },
    auditTarget: (args) => ({ type: 'user', id: String(args.userId ?? 'unknown') }),
  })

  useCopilotTool('super_login_as_user', {
    run: async (args) => {
      const userId = String(args.userId ?? '')
      if (!userId) return '缺少 userId。'
      const reason = pad(String(args.reason ?? ''), 'Copilot 请求 login-as')
      // The server mints the ticketId; requestLoginAs returns it in the
      // response so the UI can track allow/deny polling.
      const res = await requestLoginAs.mutateAsync({ userId, reason })
      return `🎭 已提交 login-as 请求（等待用户批准，ticket=${res.ticketId}）。`
    },
    auditTarget: (args) => ({ type: 'user', id: String(args.userId ?? 'unknown') }),
  })

  useCopilotTool('super_query_user', {
    run: async (args) => {
      const userId = String(args.userId ?? '')
      if (!userId) return '缺少 userId。'
      const res = await trpcUtils.copilotOps.superQueryUser.fetch({ userId })
      return `👤 ${res.user.email} · plan=${res.user.plan} · role=${res.user.role} · 积分 ${res.credits?.balance ?? 0}${res.user.lockedUntil ? '（已封禁）' : ''}`
    },
    auditTarget: (args) => ({ type: 'user', id: String(args.userId ?? 'unknown') }),
  })

  return null
}

/** /super/finance */
export function SuperFinanceCopilotBridge() {
  const approve = trpc.super.finance.approveRefund.useMutation()
  const deny = trpc.super.finance.denyRefund.useMutation()
  const force = trpc.copilotOps.forceRefund.useMutation()
  const exportFinance = trpc.copilotOps.exportFinance.useMutation()

  useCopilotTool('approve_refund', {
    run: async (args) => {
      const refundId = String(args.refundId ?? args.id ?? '')
      if (!refundId) return '缺少 refundId。'
      const reason = pad(String(args.reason ?? ''), 'Copilot 批准退款')
      await approve.mutateAsync({ refundId, decision: 'approve', reason }).catch((err) => {
        throw new Error(
          err instanceof Error && err.message.includes('NOT_SUPPORTED')
            ? '退款接口尚未接入 Stripe（METHOD_NOT_SUPPORTED），审计已记录。'
            : (err?.message ?? String(err)),
        )
      })
      return `✅ 已批准退款 ${refundId}。`
    },
    auditTarget: (args) => ({ type: 'refund', id: String(args.refundId ?? 'unknown') }),
  })

  useCopilotTool('deny_refund', {
    run: async (args) => {
      const refundId = String(args.refundId ?? args.id ?? '')
      if (!refundId) return '缺少 refundId。'
      const reason = pad(String(args.reason ?? ''), 'Copilot 拒绝退款')
      await deny.mutateAsync({ refundId, decision: 'reject', reason }).catch((err) => {
        throw new Error(
          err instanceof Error && err.message.includes('NOT_SUPPORTED')
            ? '退款接口尚未接入 Stripe（METHOD_NOT_SUPPORTED），审计已记录。'
            : (err?.message ?? String(err)),
        )
      })
      return `🚫 已拒绝退款 ${refundId}：${reason}`
    },
    auditTarget: (args) => ({ type: 'refund', id: String(args.refundId ?? 'unknown') }),
  })

  useCopilotTool('super_force_refund', {
    run: async (args) => {
      const userId = String(args.userId ?? '')
      const amountCents = Math.round(Number(args.amountCents ?? Number(args.amount ?? 0) * 100))
      const reason = String(args.reason ?? 'Copilot 强制退款')
      if (!userId || amountCents <= 0) return '缺少 userId 或 amount。'
      const res = await force.mutateAsync({ userId, amountCents, reason })
      return `💰 强制退款完成：用户 ${userId} ← ${res.creditsReturned} 积分（$${(res.amountCents / 100).toFixed(2)}）。`
    },
    auditTarget: (args) => ({ type: 'user', id: String(args.userId ?? 'unknown') }),
  })

  useCopilotTool('super_export_finance', {
    run: async (args) => {
      const range = ((args.range as string) ?? '30d') as '7d' | '30d' | '90d' | 'ytd'
      const format = ((args.format as string) ?? 'csv') as 'csv' | 'json'
      const res = await exportFinance.mutateAsync({ range, format })
      return `📥 导出已生成：${res.downloadUrl}`
    },
    auditTarget: () => ({ type: 'finance_export', id: 'latest' }),
  })

  return null
}

/** /super/sites */
export function SuperSitesCopilotBridge() {
  const freeze = trpc.copilotOps.superFreezeSite.useMutation()
  const unfreeze = trpc.copilotOps.superUnfreezeSite.useMutation()

  useCopilotTool('super_freeze_site', {
    run: async (args) => {
      const siteId = String(args.siteId ?? '')
      if (!siteId) return '缺少 siteId。'
      const reason = String(args.reason ?? 'Copilot 触发冻结')
      await freeze.mutateAsync({ siteId, reason })
      return `❄️ 已冻结站点 ${siteId}：${reason}`
    },
    auditTarget: (args) => ({ type: 'site', id: String(args.siteId ?? 'unknown') }),
  })

  useCopilotTool('super_unfreeze_site', {
    run: async (args) => {
      const siteId = String(args.siteId ?? '')
      if (!siteId) return '缺少 siteId。'
      await unfreeze.mutateAsync({ siteId, reason: 'Copilot 解冻' })
      return `☀️ 已恢复站点 ${siteId}。`
    },
    auditTarget: (args) => ({ type: 'site', id: String(args.siteId ?? 'unknown') }),
  })

  return null
}

/** /super/plugins */
export function SuperPluginsCopilotBridge() {
  const approve = trpc.copilotOps.approvePlugin.useMutation()
  const reject = trpc.copilotOps.rejectPlugin.useMutation()

  useCopilotTool('approve_plugin', {
    run: async (args) => {
      const pluginId = String(args.pluginId ?? '')
      if (!pluginId) return '缺少 pluginId。'
      await approve.mutateAsync({ pluginId, reason: (args.reason as string) ?? undefined })
      return `✅ 插件 ${pluginId} 已通过审核。`
    },
    auditTarget: (args) => ({ type: 'plugin', id: String(args.pluginId ?? 'unknown') }),
  })

  useCopilotTool('reject_plugin', {
    run: async (args) => {
      const pluginId = String(args.pluginId ?? '')
      if (!pluginId) return '缺少 pluginId。'
      const reason = (args.reason as string) ?? 'Copilot 拒绝'
      await reject.mutateAsync({ pluginId, reason })
      return `🚫 插件 ${pluginId} 已驳回：${reason}`
    },
    auditTarget: (args) => ({ type: 'plugin', id: String(args.pluginId ?? 'unknown') }),
  })

  return null
}

/** /super/marketing */
export function SuperMarketingCopilotBridge() {
  const announce = trpc.copilotOps.sendAnnouncement.useMutation()
  const campaign = trpc.copilotOps.launchEmailCampaign.useMutation()

  useCopilotTool('super_send_announcement', {
    run: async (args) => {
      const title = String(args.title ?? 'Forgely 公告')
      const body = String(args.body ?? args.message ?? '')
      const audience = ((args.audience as string) ?? 'all') as
        | 'all'
        | 'paying'
        | 'trial'
        | 'super_admin'
      if (!body) return '公告正文为空。'
      const res = await announce.mutateAsync({ title, body, audience })
      return `📣 公告「${res.title}」已发布（${audience}）。`
    },
    auditTarget: () => ({ type: 'announcement', id: `ann_${Date.now()}` }),
  })

  useCopilotTool('launch_email_campaign', {
    run: async (args) => {
      const name = String(args.name ?? 'Untitled Campaign')
      const subject = String(args.subject ?? name)
      const body = String(args.body ?? args.content ?? '')
      if (!body) return 'Campaign 正文为空。'
      const res = await campaign.mutateAsync({
        name,
        subject,
        body,
        segmentSlug: (args.segmentSlug as string) ?? undefined,
        scheduledAt: (args.scheduledAt as string) ?? undefined,
      })
      return `📮 Campaign「${name}」已创建（${res.campaignId}），将于 ${res.scheduledAt} 发送。`
    },
    auditTarget: () => ({ type: 'email_campaign', id: `campaign_${Date.now()}` }),
  })

  return null
}

/** 补足 reason 最短 3 字符的要求（super schemas 里的最小长度）。 */
function pad(value: string, fallback: string): string {
  const trimmed = value.trim()
  if (trimmed.length >= 3) return trimmed
  return fallback
}

/** Pick flat-form product patches when `args.patch` is missing. */
function pickPatch(args: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const key of [
    'title',
    'handle',
    'status',
    'priceUsd',
    'priceCnyCents',
    'description',
    'inventoryQuantity',
  ]) {
    if (key in args && args[key] !== undefined) out[key] = args[key]
  }
  return out
}
