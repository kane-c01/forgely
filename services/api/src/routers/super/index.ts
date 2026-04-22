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

import { router } from '../../router/trpc.js'
import { superAuditRouter } from './audit.js'
import { superFinanceRouter } from './finance.js'
import { superHealthRouter } from './health.js'
import { superMarketingRouter } from './marketing.js'
import { superPluginsRouter } from './plugins.js'
import { superSettingsRouter } from './settings.js'
import { superTeamRouter } from './team.js'
import { superUsersRouter } from './users.js'

export const superRouter = router({
  users: superUsersRouter,
  finance: superFinanceRouter,
  audit: superAuditRouter,
  team: superTeamRouter,
  marketing: superMarketingRouter,
  plugins: superPluginsRouter,
  health: superHealthRouter,
  settings: superSettingsRouter,
})

export type SuperRouter = typeof superRouter

export { canPerform, assertCan, SUPER_ROLES } from './_acl.js'
export type { SuperRole, SuperAction } from './_acl.js'
export { recordAudit, SUPER_ACTIONS } from './_audit-log.js'
export * from './_schemas.js'
