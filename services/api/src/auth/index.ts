/**
 * Public surface of `@forgely/api/auth`.
 *
 * Subpath consumers:
 *   - apps/app's NextAuth route → `buildNextAuthConfig`, `prismaAdapter`
 *   - apps/app's pages/forms    → signup/signin, password reset, email verify, TOTP
 *   - tRPC middleware           → `validateSession`, `requireUser`,
 *                                 `requireSuperAdmin`, `assertFoundAndOwned`
 *   - super-admin tooling       → `recordAudit`, `AUDIT_ACTIONS`
 *
 * @owner W3
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

export { recordLoginEvent, recordAudit, recordAuthAudit, AUDIT_ACTIONS } from './audit.js'
export type { LoginEventInput, AuditInput, AuthAuditInput, AuditAction } from './audit.js'

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

export { buildNextAuthConfig, prismaAdapter } from './next-auth.js'
export type { BuildNextAuthConfigOptions } from './next-auth.js'

export {
  requestPasswordReset,
  consumePasswordReset,
  purgeExpiredPasswordResets,
} from './password-reset.js'
export type {
  RequestPasswordResetInput,
  RequestPasswordResetResult,
  ConsumePasswordResetInput,
  ConsumePasswordResetResult,
} from './password-reset.js'

export {
  sendEmailVerification,
  verifyEmail,
  purgeExpiredVerificationTokens,
} from './email-verify.js'
export type {
  SendEmailVerificationResult,
  VerifyEmailInput,
  VerifyEmailResult,
} from './email-verify.js'

export {
  beginTotpEnrollment,
  confirmTotpEnrollment,
  verifyTotp,
  verifyTotpCode,
  disableTotp,
} from './totp.js'
export type { BeginTotpEnrollmentResult } from './totp.js'
