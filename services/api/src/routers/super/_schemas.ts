/**
 * Shared Zod schemas for the /super tRPC router.
 * Keeping them in one place lets the client (apps/app) import via the tRPC
 * type-inference and stay in lock-step.
 */

import { z } from 'zod'

export const cuid = z.string().min(1)

export const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'expected YYYY-MM-DD')

export const userStatusSchema = z.enum(['active', 'suspended', 'pending', 'banned'])
export const subscriptionPlanSchema = z.enum(['free', 'starter', 'pro', 'business'])
export const superRoleSchema = z.enum(['OWNER', 'ADMIN', 'SUPPORT'])
export const auditActorTypeSchema = z.enum(['super_admin', 'user', 'system'])
export const refundStatusSchema = z.enum(['queued', 'approved', 'rejected', 'completed'])

export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().min(1).max(500).default(50),
})

export const listUsersInput = paginationSchema.extend({
  search: z.string().trim().max(120).optional(),
  status: userStatusSchema.optional(),
  plan: subscriptionPlanSchema.optional(),
})

export const userIdInput = z.object({ userId: cuid })

export const suspendUserInput = userIdInput.extend({
  reason: z.string().min(3).max(500),
})

export const grantCreditsInput = userIdInput.extend({
  amount: z.number().int().min(1).max(100_000),
  reason: z.string().min(3).max(500),
})

export const requestLoginAsInput = userIdInput.extend({
  reason: z.string().min(3).max(500),
})

export const respondLoginAsInput = z.object({
  ticketId: z.string().min(1),
  decision: z.enum(['allow', 'deny']),
})

export const consumeLoginAsTicketInput = z.object({
  ticketId: z.string().min(1),
})

export const listMyLoginAsTicketsInput = z.object({
  status: z.enum(['awaiting_user', 'granted', 'denied', 'expired', 'consumed']).optional(),
})

export const auditQueryInput = paginationSchema.extend({
  actorId: cuid.optional(),
  actorType: auditActorTypeSchema.optional(),
  action: z.string().max(100).optional(),
  targetType: z.string().max(50).optional(),
  targetId: cuid.optional(),
  fromDate: dateString.optional(),
  toDate: dateString.optional(),
  search: z.string().trim().max(200).optional(),
})

export const inviteTeamMemberInput = z.object({
  email: z.string().email(),
  role: superRoleSchema,
})

export const updateTeamRoleInput = z.object({
  memberId: cuid,
  role: superRoleSchema,
})

export const refundActionInput = z.object({
  refundId: cuid,
  decision: z.enum(['approve', 'reject']),
  reason: z.string().min(3).max(500),
})

// ─── Marketing ──────────────────────────────────────────────────────────

export const emailCampaignProvider = z.enum(['klaviyo', 'mailchimp', 'resend', 'internal'])
export const emailCampaignStatus = z.enum([
  'draft',
  'queued',
  'sending',
  'sent',
  'failed',
  'scheduled',
])

export const audienceFilter = z.object({
  plan: z.array(subscriptionPlanSchema).optional(),
  country: z.array(z.string().length(2)).optional(),
  signedUpAfter: dateString.optional(),
  signedUpBefore: dateString.optional(),
  segment: z.string().optional(),
})

export const createEmailCampaignInput = z.object({
  name: z.string().min(1).max(120),
  provider: emailCampaignProvider.default('resend'),
  subject: z.string().min(1).max(160),
  body: z.string().min(1),
  audience: audienceFilter,
  scheduledAt: z.string().datetime().optional(),
})

export const updateEmailCampaignInput = createEmailCampaignInput.partial().extend({
  id: cuid,
})

export const launchEmailCampaignInput = z.object({ id: cuid })

export const couponCreateInput = z.object({
  code: z
    .string()
    .min(3)
    .max(40)
    .regex(/^[A-Z0-9_-]+$/i, 'use letters/digits/_/- only'),
  discountType: z.enum(['percent', 'amount']),
  /** percent 1-100, amount in USD cents. */
  value: z.number().int().min(1),
  expiresAt: z.string().datetime().optional(),
  maxRedemptions: z.number().int().positive().optional(),
})

export const pushChannel = z.enum(['webpush', 'inapp', 'wechat_template', 'system_banner'])

export const createPushBroadcastInput = z.object({
  channel: pushChannel,
  title: z.string().min(1).max(120),
  body: z.string().min(1).max(500),
  audience: audienceFilter,
  scheduledAt: z.string().datetime().optional(),
})

// ─── Plugins ───────────────────────────────────────────────────────────

export const pluginReviewDecision = z.enum(['approve', 'reject', 'pending'])

export const reviewPluginInput = z.object({
  pluginId: z.string().min(1),
  decision: pluginReviewDecision,
  notes: z.string().max(2000).optional(),
})

// ─── Health ────────────────────────────────────────────────────────────

export const healthSourceInput = z.object({
  source: z.enum(['sentry', 'posthog', 'cloudflare', 'postgres', 'ai_spend']),
  windowHours: z.number().int().min(1).max(720).default(24),
})

export type ListUsersInput = z.infer<typeof listUsersInput>
export type SuspendUserInput = z.infer<typeof suspendUserInput>
export type GrantCreditsInput = z.infer<typeof grantCreditsInput>
export type AuditQueryInput = z.infer<typeof auditQueryInput>
export type RequestLoginAsInput = z.infer<typeof requestLoginAsInput>
export type RespondLoginAsInput = z.infer<typeof respondLoginAsInput>
export type ConsumeLoginAsTicketInput = z.infer<typeof consumeLoginAsTicketInput>
export type ListMyLoginAsTicketsInput = z.infer<typeof listMyLoginAsTicketsInput>
export type RefundActionInput = z.infer<typeof refundActionInput>
export type CreateEmailCampaignInput = z.infer<typeof createEmailCampaignInput>
export type UpdateEmailCampaignInput = z.infer<typeof updateEmailCampaignInput>
export type LaunchEmailCampaignInput = z.infer<typeof launchEmailCampaignInput>
export type CouponCreateInput = z.infer<typeof couponCreateInput>
export type CreatePushBroadcastInput = z.infer<typeof createPushBroadcastInput>
export type ReviewPluginInput = z.infer<typeof reviewPluginInput>
export type HealthSourceInput = z.infer<typeof healthSourceInput>
