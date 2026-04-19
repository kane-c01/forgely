/**
 * /super super-admin tRPC router (T25 + T26).
 *
 * Wire this into the root router (`services/api/src/routers/index.ts`):
 *
 * ```ts
 * import { superRouter } from './super'
 * export const appRouter = router({
 *   // …other routers
 *   super: superRouter,
 * })
 * ```
 *
 * Procedures rely on:
 *   - `superAdminProcedure` — re-checks `session.role === 'super_admin'`
 *     and exposes `ctx.prisma`, `ctx.stripe`, `ctx.queue`, `ctx.email`,
 *     `ctx.billing`, `ctx.session`, `ctx.request`.
 *   - `recordAudit` (`./_audit-log`) — append-only AuditLog write helper.
 *   - `assertCan` (`./_acl`) — fine-grained RBAC inside the role tier.
 */

// `../../trpc` is provided by W3 / T06 — until that lands, this import is
// flagged as unresolved by editors but the file compiles cleanly inside the
// integrated build.
import { router } from '../../trpc'
import { superAuditRouter } from './audit'
import { superFinanceRouter } from './finance'
import { superTeamRouter } from './team'
import { superUsersRouter } from './users'

export const superRouter = router({
  users: superUsersRouter,
  finance: superFinanceRouter,
  audit: superAuditRouter,
  team: superTeamRouter,
})

export type SuperRouter = typeof superRouter

export { canPerform, assertCan, SUPER_ROLES } from './_acl'
export type { SuperRole, SuperAction } from './_acl'
export { recordAudit, SUPER_ACTIONS } from './_audit-log'
export * from './_schemas'
