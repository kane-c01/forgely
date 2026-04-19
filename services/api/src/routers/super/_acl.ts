/**
 * Role-based access control matrix for the /super tRPC router.
 *
 * Mirrored on the client at `apps/app/lib/super/session.ts` so the UI hides
 * controls the user can't trigger — but the server is the source of truth
 * and re-checks every call.
 */

import { TRPCError } from '@trpc/server'

export type SuperRole = 'OWNER' | 'ADMIN' | 'SUPPORT'

/**
 * Action namespaces are dot-separated, e.g. `users.suspend`,
 * `finance.refund.approve`, `team.invite`. The matcher uses prefix logic.
 */
export type SuperAction = string

export const SUPER_ROLES = ['OWNER', 'ADMIN', 'SUPPORT'] as const

/**
 * `OWNER` is the only one allowed for these prefixes.
 * (docs/MASTER.md §20.2)
 */
const OWNER_ONLY_PREFIXES = ['finance.', 'team.', 'platform.']

/**
 * `SUPPORT` is read-only on these prefixes; mutations require ADMIN+.
 */
const SUPPORT_READ_PREFIXES = ['users.', 'sites.', 'support.', 'audit.']

/** A handful of explicit actions SUPPORT must be able to perform. */
const SUPPORT_ALLOW_EXACT = new Set([
  'users.read',
  'users.detail.read',
  'users.login_as.request',
  'sites.read',
  'support.ticket.read',
  'support.ticket.reply',
  'audit.read',
])

export function canPerform(role: SuperRole, action: SuperAction): boolean {
  if (role === 'OWNER') return true
  if (role === 'ADMIN') {
    return !OWNER_ONLY_PREFIXES.some((p) => action.startsWith(p))
  }
  // SUPPORT
  if (SUPPORT_ALLOW_EXACT.has(action)) return true
  return SUPPORT_READ_PREFIXES.some((p) => action.startsWith(p) && action.endsWith('.read'))
}

export function assertCan(role: SuperRole, action: SuperAction): void {
  if (!canPerform(role, action)) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: `Role ${role} is not allowed to perform "${action}"`,
    })
  }
}
