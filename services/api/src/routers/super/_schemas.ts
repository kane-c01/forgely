/**
 * Shared Zod schemas for the /super tRPC router.
 * Keeping them in one place lets the client (apps/app) import via the tRPC
 * type-inference and stay in lock-step.
 */

import { z } from 'zod'

export const cuid = z.string().min(1)

export const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'expected YYYY-MM-DD')

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
  ticketId: z.string().min(1),
  reason: z.string().min(3).max(500),
})

export const respondLoginAsInput = z.object({
  ticketId: z.string().min(1),
  decision: z.enum(['allow', 'deny']),
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

export type ListUsersInput = z.infer<typeof listUsersInput>
export type SuspendUserInput = z.infer<typeof suspendUserInput>
export type GrantCreditsInput = z.infer<typeof grantCreditsInput>
export type AuditQueryInput = z.infer<typeof auditQueryInput>
export type RequestLoginAsInput = z.infer<typeof requestLoginAsInput>
export type RespondLoginAsInput = z.infer<typeof respondLoginAsInput>
export type RefundActionInput = z.infer<typeof refundActionInput>
