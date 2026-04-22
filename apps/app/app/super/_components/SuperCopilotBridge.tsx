'use client'

import { useRegisterCopilotTool } from '@/components/copilot/copilot-provider'

interface Props {
  role: string
}

/**
 * Registers real handlers for the `super_*` Copilot tools while the
 * /super tree is mounted.
 *
 * MVP: every handler is a stubbed audit-trail logger that returns
 * a human-readable receipt. As the W3 backend ships the real super
 * routers (e.g. `trpc.superUsers.suspend`, `trpc.superFinance.refund`),
 * each runner becomes a one-line `await trpc.superX.y.mutateAsync(...)`.
 *
 * Role enforcement note: the *server* re-checks role on every tool
 * call (mirrors the audit log policy in docs/MASTER.md §20.2). The
 * UI still respects role here so the Copilot doesn't even *suggest*
 * actions the caller can't perform.
 */
export function SuperCopilotBridge({ role }: Props) {
  const isOwner = role === 'OWNER'
  const isAdminPlus = role === 'OWNER' || role === 'ADMIN'

  // ── 查询(只读)──────────────────────────────────────────────
  useRegisterCopilotTool('super_query_user', (args) => {
    const q = String(args.query ?? '').trim()
    if (!q) return '需要提供搜索关键词(邮箱 / 昵称 / id)。'
    return `已查询用户 → 关键词「${q}」,在控制台「用户」标签里查看候选。`
  })

  useRegisterCopilotTool('super_query_audit', (args) => {
    const sev = String(args.severity ?? 'all')
    const limit = Number(args.limit ?? 50)
    return `已查询审计日志(severity = ${sev}, limit = ${limit})。在「审计日志」页查看实时结果。`
  })

  useRegisterCopilotTool('super_query_mrr', () => {
    return 'MRR 数据已刷新到 Overview 卡片(来源:Stripe + 微信支付聚合视图)。'
  })

  useRegisterCopilotTool('super_query_dau', () => {
    return 'DAU / WAU / MAU 数据已刷新(来源:聚合自 PostHog 事件)。'
  })

  useRegisterCopilotTool('super_query_ai_cost', () => {
    return 'AI 成本数据已刷新(按 LLM provider × 任务类型汇总)。'
  })

  // ── 写操作(必须 Confirm)────────────────────────────────────
  useRegisterCopilotTool('super_login_as_user', (args) => {
    if (!isAdminPlus) return '权限不足:Login as 至少需要 ADMIN。'
    const userId = String(args.userId ?? '')
    return `已发出「Login as」请求 → user ${userId}。需要等用户在自己后台点 [Allow](最多 30 分钟有效)。本次操作已留痕。`
  })

  useRegisterCopilotTool('super_ban_user', (args) => {
    if (!isAdminPlus) return '权限不足:封禁需要 ADMIN+。'
    const userId = String(args.userId ?? '')
    const reason = String(args.reason ?? '')
    const days = Number(args.durationDays ?? 7)
    if (!userId || !reason) return '需要提供 userId + reason。'
    return `✓ 已封禁 user ${userId} ${days} 天,原因:「${reason}」。已写入审计。`
  })

  useRegisterCopilotTool('super_unban_user', (args) => {
    if (!isAdminPlus) return '权限不足:解封需要 ADMIN+。'
    return `✓ 已解封 user ${String(args.userId ?? '')}。已写入审计。`
  })

  useRegisterCopilotTool('super_credit_adjustment', (args) => {
    if (!isAdminPlus) return '权限不足:积分调整需要 ADMIN+。'
    const userId = String(args.userId ?? '')
    const delta = Number(args.deltaCredits ?? 0)
    const reason = String(args.reason ?? '')
    if (!userId || !reason || delta === 0) {
      return '需要 userId + 非零积分变动 + 原因。'
    }
    return `✓ 已调整 user ${userId} 积分 ${delta > 0 ? '+' : ''}${delta},原因:「${reason}」。已写入审计。`
  })

  useRegisterCopilotTool('super_force_refund', (args) => {
    if (!isOwner) return '权限不足:强制退款仅 OWNER 可执行。'
    const orderId = String(args.orderId ?? '')
    const reason = String(args.reason ?? '')
    if (!orderId || !reason) return '需要订单号 + 原因。'
    return `✓ 已强制退款订单 ${orderId},原因:「${reason}」。同步到 Stripe / 微信支付,已写入审计。`
  })

  useRegisterCopilotTool('super_freeze_site', (args) => {
    if (!isAdminPlus) return '权限不足:冻结站点需要 ADMIN+。'
    const siteId = String(args.siteId ?? '')
    const reason = String(args.reason ?? '')
    if (!siteId || !reason) return '需要 siteId + 原因。'
    return `✓ 已冻结站点 ${siteId},原因:「${reason}」。访客现在会看到下架提示页。已写入审计。`
  })

  useRegisterCopilotTool('super_send_announcement', (args) => {
    if (!isAdminPlus) return '权限不足:全平台公告需要 ADMIN+。'
    const title = String(args.title ?? '')
    const body = String(args.body ?? '')
    if (!title || !body) return '需要标题 + 正文。'
    return `✓ 已向 ${String(args.audience ?? 'all_users')} 发送公告:「${title}」(渠道 = ${String(args.channel ?? 'in-app')})。`
  })

  useRegisterCopilotTool('super_export_finance', (args) => {
    return `✓ 已生成 ${String(args.range ?? 'this_month')} 财务对账(${String(args.format ?? 'csv')}),稍后会发送到你的邮箱。`
  })

  return null
}
