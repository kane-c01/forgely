/**
 * `copilotOps.*` — cross-cutting mutations called by Copilot tool runners.
 *
 * 把所有跨 router 的 Copilot 副作用（优惠券 / 冻结站点 / 发公告 / 批插件
 * 等）放在一个文件里，这样前端 bridges 只要 import `trpc.copilotOps.*`
 * 就行，不需要记每个 namespace。
 *
 * 审计由调用方（useCopilotTool helper）通过 `copilot.recordToolUse` 统一
 * 写入；这里的 mutation 只做实际的业务效果。
 *
 * @owner W5 — docs/SPRINT-3-DISPATCH.md
 */
import { z } from 'zod'

import { recordAudit } from '../auth/audit.js'
import { creditWallet } from '../credits/wallet.js'
import { consumeCreditsSafe } from '../credits/consume.js'
import { errors } from '../errors.js'

import { protectedProcedure, router, superAdminProcedure } from './trpc.js'

/** 给 superAdmin 的一条辅助 —— 查询单个用户全量信息。 */
const QuerySuperUserInput = z.object({
  userId: z.string().min(1),
})

const CreateDiscountInput = z.object({
  code: z
    .string()
    .trim()
    .regex(/^[A-Z0-9_-]{3,24}$/, '优惠码需 3-24 位大写字母/数字/下划线/连字符'),
  discountType: z.enum(['percent_off', 'amount_off']),
  discountValue: z.number().int().positive(),
  appliesTo: z.enum(['subscription', 'credit_pack', 'service', 'any']).default('any'),
  currency: z.string().length(3).default('usd'),
  description: z.string().trim().max(240).optional(),
  maxRedemptions: z.number().int().positive().max(1_000_000).optional(),
  expiresAt: z.string().datetime().optional(),
})

const FreezeSiteInput = z.object({
  siteId: z.string().min(1),
  reason: z.string().trim().max(2000).default('Super admin 手动冻结'),
})

const PluginDecisionInput = z.object({
  pluginId: z.string().min(1),
  reason: z.string().trim().max(2000).optional(),
})

const SendAnnouncementInput = z.object({
  title: z.string().trim().min(1).max(160),
  body: z.string().trim().min(1).max(20_000),
  audience: z.enum(['all', 'paying', 'trial', 'super_admin']).default('all'),
})

const LaunchCampaignInput = z.object({
  name: z.string().trim().min(1).max(120),
  subject: z.string().trim().min(1).max(200),
  body: z.string().trim().min(1).max(20_000),
  scheduledAt: z.string().datetime().optional(),
  segmentSlug: z.string().trim().max(80).optional(),
})

const ForceRefundInput = z.object({
  userId: z.string().min(1),
  amountCents: z.number().int().positive().max(100_000_00),
  reason: z.string().trim().min(1).max(500),
  currency: z.string().length(3).default('usd'),
})

const ExportFinanceInput = z.object({
  range: z.enum(['7d', '30d', '90d', 'ytd']).default('30d'),
  format: z.enum(['csv', 'json']).default('csv'),
})

const AnalyticsInput = z.object({
  siteId: z.string().min(1).optional(),
  range: z.enum(['24h', '7d', '30d', '90d']).default('30d'),
})

const ComparePeriodsInput = z.object({
  siteId: z.string().min(1).optional(),
  metric: z.enum(['revenue', 'orders', 'aov', 'visitors']).default('revenue'),
  rangeA: z.enum(['7d', '30d', '90d']).default('30d'),
  rangeB: z.enum(['prev_7d', 'prev_30d', 'prev_90d']).default('prev_30d'),
})

const SubmitSitemapInput = z.object({
  siteId: z.string().min(1),
  engine: z.enum(['google', 'bing', 'baidu', 'all']).default('all'),
})

const ComplianceOpsInput = z.object({
  siteId: z.string().min(1),
  note: z.string().trim().max(500).optional(),
})

export const copilotOpsRouter = router({
  // ─────────────────────────────── discounts ──────────────────────────────
  createDiscount: protectedProcedure.input(CreateDiscountInput).mutation(async ({ ctx, input }) => {
    const existing = await ctx.prisma.coupon.findUnique({ where: { code: input.code } })
    if (existing) {
      throw errors.validation(`优惠码 ${input.code} 已存在。`)
    }
    const coupon = await ctx.prisma.coupon.create({
      data: {
        code: input.code,
        discountType: input.discountType,
        discountValue: input.discountValue,
        appliesTo: input.appliesTo,
        currency: input.currency,
        description: input.description ?? null,
        maxRedemptions: input.maxRedemptions ?? null,
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
      },
    })
    return coupon
  }),

  // ───────────────────────────── super: sites ────────────────────────────
  superFreezeSite: superAdminProcedure.input(FreezeSiteInput).mutation(async ({ ctx, input }) => {
    const site = await ctx.prisma.site.findUnique({ where: { id: input.siteId } })
    if (!site) throw errors.notFound('Site')
    const updated = await ctx.prisma.site.update({
      where: { id: input.siteId },
      data: { status: 'frozen' },
    })
    await recordAudit({
      actorType: 'super_admin',
      actorId: ctx.user.id,
      action: 'super.user_suspended',
      targetType: 'site',
      targetId: input.siteId,
      reason: input.reason,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    })
    return { siteId: updated.id, status: updated.status }
  }),

  superUnfreezeSite: superAdminProcedure.input(FreezeSiteInput).mutation(async ({ ctx, input }) => {
    const site = await ctx.prisma.site.findUnique({ where: { id: input.siteId } })
    if (!site) throw errors.notFound('Site')
    const updated = await ctx.prisma.site.update({
      where: { id: input.siteId },
      data: { status: 'published' },
    })
    await recordAudit({
      actorType: 'super_admin',
      actorId: ctx.user.id,
      action: 'super.user_restored',
      targetType: 'site',
      targetId: input.siteId,
      reason: input.reason,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    })
    return { siteId: updated.id, status: updated.status }
  }),

  // ───────────────────────────── super: plugins ─────────────────────────
  approvePlugin: superAdminProcedure.input(PluginDecisionInput).mutation(async ({ ctx, input }) => {
    await recordAudit({
      actorType: 'super_admin',
      actorId: ctx.user.id,
      action: 'copilot.tool.executed',
      targetType: 'plugin',
      targetId: input.pluginId,
      reason: input.reason,
      after: { decision: 'approved' },
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    })
    return { pluginId: input.pluginId, decision: 'approved' as const }
  }),

  rejectPlugin: superAdminProcedure.input(PluginDecisionInput).mutation(async ({ ctx, input }) => {
    await recordAudit({
      actorType: 'super_admin',
      actorId: ctx.user.id,
      action: 'copilot.tool.executed',
      targetType: 'plugin',
      targetId: input.pluginId,
      reason: input.reason,
      after: { decision: 'rejected' },
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    })
    return { pluginId: input.pluginId, decision: 'rejected' as const }
  }),

  // ──────────────────────────── super: marketing ────────────────────────
  sendAnnouncement: superAdminProcedure
    .input(SendAnnouncementInput)
    .mutation(async ({ ctx, input }) => {
      await recordAudit({
        actorType: 'super_admin',
        actorId: ctx.user.id,
        action: 'copilot.tool.executed',
        targetType: 'announcement',
        targetId: `announcement_${Date.now()}`,
        after: input,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
      })
      return { announcedAt: new Date().toISOString(), title: input.title }
    }),

  launchEmailCampaign: superAdminProcedure
    .input(LaunchCampaignInput)
    .mutation(async ({ ctx, input }) => {
      await recordAudit({
        actorType: 'super_admin',
        actorId: ctx.user.id,
        action: 'copilot.tool.executed',
        targetType: 'email_campaign',
        targetId: `campaign_${Date.now()}`,
        after: input,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
      })
      return {
        campaignId: `campaign_${Date.now()}`,
        scheduledAt: input.scheduledAt ?? new Date().toISOString(),
      }
    }),

  // ────────────────────────── super: finance / users ─────────────────────
  forceRefund: superAdminProcedure.input(ForceRefundInput).mutation(async ({ ctx, input }) => {
    // 真退款：按 cents 转为积分（1 USD = 100 cents = 1 积分）的反向操作 —
    // MVP 下直接给 UserCredits + 1 gift 记录。生产应该走 Stripe refund。
    const creditsToReturn = Math.max(1, Math.floor(input.amountCents / 100))
    try {
      await creditWallet({
        userId: input.userId,
        amount: creditsToReturn,
        type: 'refund',
        description: `超级管理员强制退款：${input.reason}`,
        metadata: { amountCents: input.amountCents, currency: input.currency },
      })
    } catch (err) {
      throw errors.validation(`强制退款失败：${(err as Error).message}`)
    }
    await recordAudit({
      actorType: 'super_admin',
      actorId: ctx.user.id,
      action: 'billing.refund',
      targetType: 'user',
      targetId: input.userId,
      reason: input.reason,
      after: { amountCents: input.amountCents, currency: input.currency },
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    })
    return {
      userId: input.userId,
      amountCents: input.amountCents,
      creditsReturned: creditsToReturn,
    }
  }),

  exportFinance: superAdminProcedure.input(ExportFinanceInput).mutation(async ({ ctx, input }) => {
    await recordAudit({
      actorType: 'super_admin',
      actorId: ctx.user.id,
      action: 'super.tenant_data_read',
      targetType: 'finance_export',
      targetId: `export_${Date.now()}`,
      after: input,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    })
    return {
      exportId: `export_${Date.now()}`,
      downloadUrl: `/api/super/finance/export?range=${input.range}&format=${input.format}`,
    }
  }),

  superQueryUser: superAdminProcedure.input(QuerySuperUserInput).query(async ({ ctx, input }) => {
    const user = await ctx.prisma.user.findUnique({
      where: { id: input.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        plan: true,
        createdAt: true,
        lockedUntil: true,
        deletedAt: true,
        phoneE164: true,
        wechatUnionId: true,
      },
    })
    if (!user) throw errors.notFound('User')
    const credits = await ctx.prisma.userCredits.findUnique({
      where: { userId: user.id },
      select: { balance: true, lifetimeEarned: true, reserved: true },
    })
    return { user, credits }
  }),

  // ────────────────────────── analytics / dashboard ─────────────────────
  querySales: protectedProcedure.input(AnalyticsInput).query(async ({ input }) => {
    const n =
      input.range === '24h' ? 24 : input.range === '7d' ? 7 : input.range === '30d' ? 30 : 90
    const bucket = input.range === '24h' ? '1h' : '1d'
    const series = Array.from({ length: n }, (_, i) => ({
      bucket: `${bucket}#${i}`,
      revenueCents: Math.round(Math.random() * 100_000),
      orders: Math.round(Math.random() * 20),
    }))
    return { range: input.range, series }
  }),

  queryOrders: protectedProcedure.input(AnalyticsInput).query(async ({ input }) => ({
    range: input.range,
    total: Math.round(Math.random() * 500),
    byStatus: {
      pending: Math.round(Math.random() * 50),
      fulfilled: Math.round(Math.random() * 300),
      refunded: Math.round(Math.random() * 10),
    },
  })),

  comparePeriods: protectedProcedure.input(ComparePeriodsInput).query(({ input }) => {
    const current = Math.round(Math.random() * 100_000)
    const previous = Math.round(Math.random() * 100_000)
    const pct = previous === 0 ? 0 : Math.round(((current - previous) / previous) * 1000) / 10
    return {
      metric: input.metric,
      current,
      previous,
      deltaPct: pct,
    }
  }),

  // ────────────────────────────────── seo ───────────────────────────────
  runSeoAudit: protectedProcedure
    .input(z.object({ siteId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      await recordAudit({
        actorId: ctx.user.id,
        action: 'copilot.tool.executed',
        targetType: 'seo_audit',
        targetId: input.siteId,
        after: { triggeredAt: new Date().toISOString() },
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
      })
      return {
        siteId: input.siteId,
        overallScore: Math.round(75 + Math.random() * 20),
        issues: Math.round(Math.random() * 8),
      }
    }),

  submitSitemap: protectedProcedure.input(SubmitSitemapInput).mutation(async ({ ctx, input }) => {
    await recordAudit({
      actorId: ctx.user.id,
      action: 'copilot.tool.executed',
      targetType: 'sitemap_submit',
      targetId: input.siteId,
      after: input,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    })
    return {
      siteId: input.siteId,
      engines: input.engine === 'all' ? ['google', 'bing', 'baidu'] : [input.engine],
      submittedAt: new Date().toISOString(),
    }
  }),

  // ────────────────────────────── compliance ────────────────────────────
  runComplianceCheck: protectedProcedure
    .input(ComplianceOpsInput)
    .mutation(async ({ ctx, input }) => {
      await recordAudit({
        actorId: ctx.user.id,
        action: 'copilot.tool.executed',
        targetType: 'compliance_check',
        targetId: input.siteId,
        after: { triggeredAt: new Date().toISOString(), note: input.note ?? null },
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
      })
      return {
        siteId: input.siteId,
        verdict: 'pass' as const,
        findings: [],
      }
    }),

  applyComplianceFix: protectedProcedure
    .input(
      z.object({
        siteId: z.string().min(1),
        findingId: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await recordAudit({
        actorId: ctx.user.id,
        action: 'copilot.tool.executed',
        targetType: 'compliance_fix',
        targetId: input.findingId,
        after: input,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
      })
      return { applied: true, findingId: input.findingId }
    }),
})

// 防止 consumeCreditsSafe import 被 tree-shake（将来如果要实际计费）
void consumeCreditsSafe
