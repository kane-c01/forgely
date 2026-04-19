/**
 * AuditLog write helper.
 *
 * Source-of-truth schema:
 *   docs/MASTER.md §30.1 (`model AuditLog`)
 *   docs/MASTER.md §20.6 (decision Q4:A — soft / append-only)
 *
 * Wire it up like this in `services/api/src/trpc.ts` once it lands:
 *
 *   ```ts
 *   import { recordAudit } from './routers/super/_audit-log'
 *   export const auditedProcedure = superAdminProcedure.use(async ({ ctx, type, path, next, input }) => {
 *     const result = await next()
 *     if (type !== 'query') {
 *       await recordAudit(ctx, { action: path, before: undefined, after: input })
 *     }
 *     return result
 *   })
 *   ```
 */

/**
 * Audit context — accepts both shapes that exist in `services/api`:
 *
 * 1. W7's original shape: `{ session: { userId, role }, request: { ipAddress, userAgent } }`
 * 2. W3's `AuthContext`:  `{ session: { id, userId } | null, user: { role, ... }, ipAddress, userAgent }`
 *
 * The fields are unioned so each caller may use whichever it owns. The
 * `recordAudit` helper picks the correct path at runtime.
 */
/**
 * Audit log table writer — we only need `create`, and we accept whatever
 * shape Prisma generates for it. The structural minimum:
 *   `{ auditLog: { create: (args: { data: any }) => unknown } }`
 *
 * Using `unknown` for `data` keeps callers free to pass either our
 * legacy `AuditLogInsert` shape or the full Prisma input.
 */
export interface AuditLogWriter {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Prisma's create input is enormous and varies per-schema; we only need structural access here.
  auditLog: { create: (args: { data: any }) => unknown }
}

export interface AuditableContext {
  prisma: AuditLogWriter
  session: ({ userId: string; role?: 'super_admin' | 'user' | 'system' } | null) | undefined
  user?: { id: string; role?: string } | null
  request?: { ipAddress: string | null; userAgent: string | null }
  ipAddress?: string | null
  userAgent?: string | null
}

export interface AuditLogInsert {
  actorType: 'super_admin' | 'user' | 'system'
  actorId: string
  action: string
  targetType: string
  targetId: string
  before?: Record<string, unknown> | null
  after?: Record<string, unknown> | null
  reason?: string | null
  ipAddress: string
  userAgent: string
}

export interface RecordAuditInput {
  action: string
  targetType: string
  targetId: string
  before?: Record<string, unknown> | null
  after?: Record<string, unknown> | null
  reason?: string | null
}

function normaliseActorRole(role: string | undefined): 'super_admin' | 'user' | 'system' {
  if (role === 'super_admin' || role === 'system') return role
  return 'user'
}

/**
 * Append a single audit-log entry. Best-effort: failures here must never
 * block the underlying mutation, but we surface them via Sentry.
 */
export async function recordAudit(ctx: AuditableContext, input: RecordAuditInput): Promise<void> {
  const role = ctx.session?.role ?? ctx.user?.role
  const actorId = ctx.session?.userId ?? ctx.user?.id ?? 'unknown'
  const ipAddress = ctx.request?.ipAddress ?? ctx.ipAddress ?? ''
  const userAgent = ctx.request?.userAgent ?? ctx.userAgent ?? ''

  const insert: AuditLogInsert = {
    actorType: normaliseActorRole(role),
    actorId,
    action: input.action,
    targetType: input.targetType,
    targetId: input.targetId,
    before: input.before ?? null,
    after: input.after ?? null,
    reason: input.reason ?? null,
    ipAddress,
    userAgent,
  }
  try {
    await ctx.prisma.auditLog.create({ data: insert })
  } catch (err) {
    // eslint-disable-next-line no-console -- Sentry will be wired by W3 (T06).
    console.error('[super/audit] failed to record', insert.action, err)
  }
}

/** Common action ids — keep this list aligned with the Audit Log filter UI. */
export const SUPER_ACTIONS = {
  USER_SUSPEND: 'users.suspend',
  USER_UNSUSPEND: 'users.unsuspend',
  USER_DELETE: 'users.delete',
  USER_ROLE_CHANGE: 'users.role.change',
  CREDITS_GRANT: 'credits.grant',
  CREDITS_REVOKE: 'credits.revoke',
  SUBSCRIPTION_REFUND: 'subscription.refund',
  LOGIN_AS_REQUEST: 'support.login_as_user.requested',
  LOGIN_AS_GRANT: 'support.login_as_user.granted',
  LOGIN_AS_DENY: 'support.login_as_user.denied',
  LOGIN_AS_EXPIRE: 'support.login_as_user.expired',
  TEAM_INVITE: 'team.invite',
  TEAM_REMOVE: 'team.remove',
  TEAM_ROLE_CHANGE: 'team.role.change',
  PLATFORM_SETTING_CHANGE: 'platform.setting.change',
  SITE_TAKEDOWN: 'site.takedown',
  SITE_UNFLAG: 'site.unflag',
} as const
