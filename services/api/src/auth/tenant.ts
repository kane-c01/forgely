/**
 * Tenant-scoped data helpers — protect every read/write against IDOR.
 *
 * Every "tenant resource" in Forgely (Site / BrandKit / MediaAsset / etc.)
 * carries a `userId`. These helpers force callers to prove that the
 * resource being touched belongs to the active session's user (or that the
 * caller is a super_admin acting in support mode).
 *
 * Usage:
 *
 *   const site = await loadOwnedSite(ctx, siteId)         // throws NOT_FOUND or FORBIDDEN
 *   const list = await ownedScopeWhere(ctx)               // returns { userId } where-clause
 *
 * @owner W3
 */

import type { User } from '@prisma/client'

import { errors } from '../errors.js'

import { isSuperAdmin } from './policies.js'

export interface TenantContext {
  user: User
}

/**
 * Returns a Prisma `where` fragment scoping to the active user's tenant.
 * Super admins get an empty object (no scoping) so support tooling can read
 * across tenants — paired with AuditLog writes at the call site.
 */
export const ownedScopeWhere = (ctx: TenantContext): { userId?: string } => {
  if (isSuperAdmin(ctx.user)) return {}
  return { userId: ctx.user.id }
}

/** Boolean form, useful in `Prisma.AND` arrays. */
export const isOwnedBy = (ctx: TenantContext, ownerId: string): boolean =>
  isSuperAdmin(ctx.user) || ctx.user.id === ownerId

/**
 * Throws FORBIDDEN if the resource isn't owned by the caller and the caller
 * isn't a super admin. Use right after a "find by id" lookup.
 */
export const assertOwnership = (ctx: TenantContext, ownerId: string): void => {
  if (!isOwnedBy(ctx, ownerId)) throw errors.forbidden()
}

/**
 * Convenience: throws NOT_FOUND when the row is null, then asserts ownership
 * — matches the "404 over 403" leak-resistant pattern.
 */
export const assertFoundAndOwned = <T extends { userId: string }>(
  ctx: TenantContext,
  row: T | null,
  resource: string,
): T => {
  if (!row) throw errors.notFound(resource)
  assertOwnership(ctx, row.userId)
  return row
}
