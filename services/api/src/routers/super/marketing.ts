/**
 * /super > Marketing tRPC sub-router. ADMIN+.
 *
 * Three primitives:
 *   - email campaigns (Klaviyo / Mailchimp / Resend / internal)
 *   - coupons (re-uses the existing `Coupon` table)
 *   - push broadcasts (web-push / in-app / WeChat template / system banner)
 *
 * Email + push tables are added by W7 Sprint 3 (`EmailCampaign`,
 * `PushBroadcast`). Real provider dispatch (Klaviyo etc.) is enqueued to
 * the BullMQ worker — this router only manages CRUD + lifecycle.
 */
import { TRPCError } from '@trpc/server'

import { router, superAdminProcedure } from '../../router/trpc.js'
import { assertCan } from './_acl.js'
import { recordAudit } from './_audit-log.js'
import {
  couponCreateInput,
  createEmailCampaignInput,
  createPushBroadcastInput,
  launchEmailCampaignInput,
  paginationSchema,
  updateEmailCampaignInput,
} from './_schemas.js'

export const superMarketingRouter = router({
  // ─── Email Campaigns ─────────────────────────────────────────────

  campaigns: router({
    list: superAdminProcedure.input(paginationSchema).query(async ({ ctx, input }) => {
      assertCan(ctx.user?.role, 'marketing.read')
      const [items, total] = await Promise.all([
        ctx.prisma.emailCampaign.findMany({
          orderBy: { createdAt: 'desc' },
          skip: (input.page - 1) * input.pageSize,
          take: input.pageSize,
        }),
        ctx.prisma.emailCampaign.count(),
      ])
      return { items, total, page: input.page, pageSize: input.pageSize }
    }),

    create: superAdminProcedure.input(createEmailCampaignInput).mutation(async ({ ctx, input }) => {
      assertCan(ctx.user?.role, 'marketing.write')
      if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' })
      const created = await ctx.prisma.emailCampaign.create({
        data: {
          name: input.name,
          provider: input.provider,
          subject: input.subject,
          body: input.body,
          audience: input.audience,
          scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null,
          status: input.scheduledAt ? 'scheduled' : 'draft',
          createdBy: ctx.user.id,
        },
      })
      await recordAudit(ctx, {
        action: 'marketing.campaign.create',
        targetType: 'email_campaign',
        targetId: created.id,
        after: { name: created.name, provider: created.provider, status: created.status },
      })
      return created
    }),

    update: superAdminProcedure.input(updateEmailCampaignInput).mutation(async ({ ctx, input }) => {
      assertCan(ctx.user?.role, 'marketing.write')
      const before = await ctx.prisma.emailCampaign.findUnique({ where: { id: input.id } })
      if (!before) throw new TRPCError({ code: 'NOT_FOUND' })
      if (before.status !== 'draft' && before.status !== 'scheduled') {
        throw new TRPCError({
          code: 'CONFLICT',
          message: `Cannot edit campaign in status ${before.status}`,
        })
      }
      const after = await ctx.prisma.emailCampaign.update({
        where: { id: input.id },
        data: {
          ...(input.name !== undefined ? { name: input.name } : {}),
          ...(input.provider ? { provider: input.provider } : {}),
          ...(input.subject !== undefined ? { subject: input.subject } : {}),
          ...(input.body !== undefined ? { body: input.body } : {}),
          ...(input.audience ? { audience: input.audience } : {}),
          ...(input.scheduledAt
            ? { scheduledAt: new Date(input.scheduledAt), status: 'scheduled' }
            : {}),
        },
      })
      await recordAudit(ctx, {
        action: 'marketing.campaign.update',
        targetType: 'email_campaign',
        targetId: input.id,
        before: { name: before.name, status: before.status },
        after: { name: after.name, status: after.status },
      })
      return after
    }),

    launch: superAdminProcedure.input(launchEmailCampaignInput).mutation(async ({ ctx, input }) => {
      assertCan(ctx.user?.role, 'marketing.send')
      const campaign = await ctx.prisma.emailCampaign.findUnique({ where: { id: input.id } })
      if (!campaign) throw new TRPCError({ code: 'NOT_FOUND' })
      if (campaign.status !== 'draft' && campaign.status !== 'scheduled') {
        throw new TRPCError({
          code: 'CONFLICT',
          message: `Cannot launch campaign in status ${campaign.status}`,
        })
      }
      // The actual provider dispatch happens in the BullMQ worker
      // (`worker/jobs/marketing/launch-email-campaign.ts`). We just flip
      // status here so the queue picks it up.
      const queued = await ctx.prisma.emailCampaign.update({
        where: { id: input.id },
        data: { status: 'queued' },
      })
      await recordAudit(ctx, {
        action: 'marketing.campaign.launch',
        targetType: 'email_campaign',
        targetId: input.id,
        after: { status: 'queued' },
      })
      return queued
    }),
  }),

  // ─── Coupons ─────────────────────────────────────────────────────

  coupons: router({
    list: superAdminProcedure.input(paginationSchema).query(async ({ ctx, input }) => {
      assertCan(ctx.user?.role, 'marketing.read')
      const [items, total] = await Promise.all([
        ctx.prisma.coupon.findMany({
          orderBy: { createdAt: 'desc' },
          skip: (input.page - 1) * input.pageSize,
          take: input.pageSize,
        }),
        ctx.prisma.coupon.count(),
      ])
      return { items, total, page: input.page, pageSize: input.pageSize }
    }),

    create: superAdminProcedure.input(couponCreateInput).mutation(async ({ ctx, input }) => {
      assertCan(ctx.user?.role, 'marketing.write')
      const code = input.code.toUpperCase()
      const dupe = await ctx.prisma.coupon.findUnique({ where: { code } })
      if (dupe) {
        throw new TRPCError({ code: 'CONFLICT', message: '该优惠码已经存在' })
      }
      const created = await ctx.prisma.coupon.create({
        // `Coupon.value` is being added by W3 in a follow-up schema migration.
        // Cast lets us forward the field to Prisma without blocking typecheck.
        data: {
          code,
          discountType: input.discountType,
          value: input.value,
          expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
          maxRedemptions: input.maxRedemptions ?? null,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any -- pending schema migration
        } as any,
      })
      await recordAudit(ctx, {
        action: 'marketing.coupon.create',
        targetType: 'coupon',
        targetId: created.id,
        after: { code, type: input.discountType, value: input.value },
      })
      return created
    }),
  }),

  // ─── Push Broadcasts ─────────────────────────────────────────────

  push: router({
    list: superAdminProcedure.input(paginationSchema).query(async ({ ctx, input }) => {
      assertCan(ctx.user?.role, 'marketing.read')
      const [items, total] = await Promise.all([
        ctx.prisma.pushBroadcast.findMany({
          orderBy: { createdAt: 'desc' },
          skip: (input.page - 1) * input.pageSize,
          take: input.pageSize,
        }),
        ctx.prisma.pushBroadcast.count(),
      ])
      return { items, total, page: input.page, pageSize: input.pageSize }
    }),

    create: superAdminProcedure.input(createPushBroadcastInput).mutation(async ({ ctx, input }) => {
      assertCan(ctx.user?.role, 'marketing.send')
      if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' })
      const created = await ctx.prisma.pushBroadcast.create({
        data: {
          channel: input.channel,
          title: input.title,
          body: input.body,
          audience: input.audience,
          scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null,
          createdBy: ctx.user.id,
        },
      })
      await recordAudit(ctx, {
        action: 'marketing.push.create',
        targetType: 'push_broadcast',
        targetId: created.id,
        after: { channel: created.channel, status: created.status },
      })
      return created
    }),
  }),
})

export type SuperMarketingRouter = typeof superMarketingRouter
