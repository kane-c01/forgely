import type { SuperRole, SuperSession } from './types'

/**
 * Stub session resolver for the /super console.
 *
 * Real implementation lives in window W3 (T06 Auth):
 *   1. Read NextAuth session cookie via `auth()` helper.
 *   2. If `session.user.role !== 'super_admin'` → throw / redirect.
 *   3. Re-validate 2FA freshness for ADMIN / OWNER (max 24h).
 *
 * Until then we return a deterministic dev session so the layout, RBAC
 * gates and audit-log writers can all be exercised end-to-end.
 */
const DEV_SESSION: SuperSession = {
  userId: 'sa_alex',
  email: 'alex@forgely.com',
  name: 'Alex Chen',
  role: 'OWNER',
  lastActiveAt: Date.UTC(2026, 3, 19, 10, 23, 42),
}

export async function getSuperSession(): Promise<SuperSession> {
  return DEV_SESSION
}

/**
 * Pure RBAC predicate. Mirrors `services/api/src/routers/super.ts`:
 *   - OWNER:   *
 *   - ADMIN:   everything except `finance.*`, `team.*`
 *   - SUPPORT: read-only on `users.*`, `sites.*`, `support.*`
 */
export function canPerform(role: SuperRole, action: string): boolean {
  if (role === 'OWNER') return true
  if (role === 'ADMIN') {
    if (action.startsWith('finance.')) return false
    if (action.startsWith('team.')) return false
    return true
  }
  // SUPPORT
  if (action.startsWith('users.read')) return true
  if (action.startsWith('sites.read')) return true
  if (action.startsWith('support.')) return true
  if (action === 'users.login_as.request') return true
  return false
}
