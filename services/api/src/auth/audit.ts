/**
 * Audit-log helpers, scoped to auth events for now. T26 (super-admin)
 * will broaden these into a generic `audit.record(…)`.
 *
 * @owner W3 (T06)
 */

import { Prisma, prisma } from '../db.js'
import type { LoginOutcome } from '../db.js'

export interface LoginEventInput {
  userId?: string | null
  email: string
  outcome: LoginOutcome
  ipAddress?: string | null
  userAgent?: string | null
}

export const recordLoginEvent = async (input: LoginEventInput): Promise<void> => {
  await prisma.loginEvent
    .create({
      data: {
        userId: input.userId ?? null,
        email: input.email.toLowerCase(),
        outcome: input.outcome,
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null,
      },
    })
    .catch(() => undefined)
}

export const AUDIT_ACTIONS = [
  'auth.signup',
  'auth.signin',
  /** 泛登录事件（W6 CN pivot）—— after.provider = 'wechat' | 'phone' | 'email'。 */
  'auth.login',
  'auth.signout',
  'auth.signout_all',
  'auth.password_reset_request',
  'auth.password_reset_complete',
  'auth.email_verified',
  'auth.totp_enrolled',
  'auth.totp_disabled',
  /** 首次登录后完成 onboarding 表单。 */
  'auth.onboarded',
  'sites.create',
  'sites.update',
  'sites.archive',
  'sites.publish',
  'sites.custom_domain_attached',
  'generation.start',
  'generation.cancel',
  'generation.fail',
  'billing.subscription_created',
  'billing.subscription_updated',
  'billing.subscription_canceled',
  'billing.invoice_paid',
  'billing.invoice_payment_failed',
  'billing.refund',
  'credits.purchase',
  'credits.adjustment',
  'credits.reservation_expired',
  'super.user_login_as',
  'super.user_suspended',
  'super.user_restored',
  'super.tenant_data_read',
] as const

export type AuditAction = (typeof AUDIT_ACTIONS)[number]

export interface AuditInput {
  actorId: string
  actorType?: 'user' | 'super_admin' | 'admin' | 'support' | 'system'
  action: AuditAction
  targetType?: string
  targetId?: string
  before?: unknown
  after?: unknown
  reason?: string
  ipAddress?: string | null
  userAgent?: string | null
}

/** @deprecated kept for back-compat — use AuditInput. */
export type AuthAuditInput = AuditInput

const toJsonInput = (value: unknown): Prisma.NullableJsonNullValueInput | Prisma.InputJsonValue =>
  value === undefined || value === null ? Prisma.JsonNull : (value as Prisma.InputJsonValue)

/**
 * Generic audit-log writer. All callers (auth / sites / billing / super
 * admin / system jobs) funnel through here so AuditLog rows have a single,
 * predictable shape. Failures are swallowed: losing an audit row must
 * never break the user action it describes.
 */
export const recordAudit = async (input: AuditInput): Promise<void> => {
  await prisma.auditLog
    .create({
      data: {
        actorType: input.actorType ?? 'user',
        actorId: input.actorId,
        action: input.action,
        targetType: input.targetType ?? 'user',
        targetId: input.targetId ?? input.actorId,
        before: toJsonInput(input.before),
        after: toJsonInput(input.after),
        reason: input.reason ?? null,
        ipAddress: input.ipAddress ?? '',
        userAgent: input.userAgent ?? '',
      },
    })
    .catch((err) => {
      console.warn('[audit] write failed', { action: input.action, err })
    })
}

/** @deprecated alias preserved so T06 import sites keep compiling. */
export const recordAuthAudit = recordAudit
