/**
 * Public surface of `@forgely/api/auth`.
 *
 * apps/app NextAuth integration (T06 W6 follow-up) imports from here:
 *   - `signupWithPassword` / `signinWithPassword` for credential login
 *   - `validateSession` for cookie-based session reads
 *   - `requireUser` / `requireSuperAdmin` for route guards
 *   - `prisma` (re-export) so the Auth.js Prisma adapter can be wired up
 *
 * @owner W3 (T06)
 */

export { getAuthConfig, setAuthConfig, resetAuthConfig, assertProductionReady } from './config.js'
export type { AuthConfig } from './config.js'

export {
  hashPassword,
  verifyPassword,
  assertPasswordStrength,
  MIN_PASSWORD_LENGTH,
  MAX_PASSWORD_LENGTH,
} from './password.js'

export { signJwt, verifyJwt } from './jwt.js'
export type { ForgelyJwtPayload } from './jwt.js'

export { generateToken, hashToken, safeEqual, TOKEN_BYTES } from './tokens.js'

export {
  createSession,
  validateSession,
  revokeSession,
  revokeAllSessionsForUser,
  purgeExpiredSessions,
} from './sessions.js'
export type { CreatedSession, SessionDevice } from './sessions.js'

export { assertNotLocked, recordFailedLogin, recordSuccessfulLogin } from './lockout.js'

export { recordLoginEvent, recordAuthAudit } from './audit.js'
export type { LoginEventInput, AuthAuditInput } from './audit.js'

export {
  signupWithPassword,
  signinWithPassword,
  signout,
  signoutAll,
  assertEmailVerified,
  SignupInput,
  SigninInput,
} from './login.js'
export type { AuthResult } from './login.js'

export {
  isAuthenticated,
  isSuperAdmin,
  requireUser,
  requireRole,
  requireSuperAdmin,
} from './policies.js'
export type { AuthLikeContext } from './policies.js'

export { ownedScopeWhere, isOwnedBy, assertOwnership, assertFoundAndOwned } from './tenant.js'
export type { TenantContext } from './tenant.js'
