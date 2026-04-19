/**
 * Centralised auth configuration.
 *
 * Read once from env at module init; tests can call `setAuthConfig(partial)`
 * to override individual fields without touching `process.env`.
 *
 * @owner W3 (T06)
 */

import type { UserRole } from '../db.js';

export interface AuthConfig {
  /** HMAC secret for JWTs (HS256). Min 32 chars in prod. */
  jwtSecret: string;
  jwtIssuer: string;
  jwtAudience: string;
  /** Access-token lifetime, in seconds. */
  jwtAccessTtlSeconds: number;
  /** Server-side session lifetime, in days. Used for the DB Session row. */
  sessionTtlDays: number;
  /** Failed-login attempts before soft-locking the account. */
  maxFailedLogins: number;
  /** How long the account stays locked after maxFailedLogins, in seconds. */
  lockoutSeconds: number;
  /** Roles that bypass plan-quota / "must finish onboarding" gates. */
  internalRoles: ReadonlyArray<UserRole>;
}

const DEFAULT_CONFIG: AuthConfig = {
  jwtSecret:
    process.env.AUTH_SECRET ??
    'dev_only_insecure_secret_change_me_change_me_change_me',
  jwtIssuer: process.env.AUTH_JWT_ISSUER ?? 'forgely.app',
  jwtAudience: process.env.AUTH_JWT_AUDIENCE ?? 'forgely-app',
  jwtAccessTtlSeconds: 60 * 60, // 1 hour
  sessionTtlDays: Number(process.env.AUTH_SESSION_TTL_DAYS ?? 30),
  maxFailedLogins: 8,
  lockoutSeconds: 15 * 60, // 15 min
  internalRoles: ['super_admin', 'admin', 'support'],
};

let activeConfig: AuthConfig = { ...DEFAULT_CONFIG };

/** Read the in-effect auth config (a frozen copy). */
export const getAuthConfig = (): Readonly<AuthConfig> =>
  Object.freeze({ ...activeConfig });

/** Override config (test-only seam). Always merges into the current state. */
export const setAuthConfig = (patch: Partial<AuthConfig>): void => {
  activeConfig = { ...activeConfig, ...patch };
};

/** Reset to env-derived defaults. */
export const resetAuthConfig = (): void => {
  activeConfig = { ...DEFAULT_CONFIG };
};

/** Detect obviously-insecure config (used by `assertProductionReady`). */
export const isInsecureSecret = (secret: string): boolean =>
  secret.length < 32 || secret.startsWith('dev_only_');

export const assertProductionReady = (): void => {
  const cfg = getAuthConfig();
  if (process.env.NODE_ENV !== 'production') return;
  if (isInsecureSecret(cfg.jwtSecret)) {
    throw new Error(
      'AUTH_SECRET is missing or too short for production (need 32+ random chars).',
    );
  }
};
