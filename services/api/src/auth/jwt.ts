/**
 * JWT (HS256) helpers built on `jose`.
 *
 * Tokens carry the minimum needed for the API to skip a DB lookup:
 *   - sub: userId
 *   - role: UserRole
 *   - sid: opaque session id (for revocation)
 *
 * For long-running power features (super-admin, billing portal redirects)
 * we still validate the matching `Session` row in DB, so a stolen JWT
 * can be revoked instantly.
 *
 * @owner W3 (T06)
 */

import { SignJWT, jwtVerify, errors as joseErrors } from 'jose';

import { ForgelyError } from '../errors.js';
import type { UserRole } from '../db.js';

import { getAuthConfig } from './config.js';

export interface ForgelyJwtPayload {
  sub: string;
  role: UserRole;
  sid: string;
  /** Custom claim — short list of plan-tier flags for client gating. */
  plan?: string;
}

const encoder = new TextEncoder();

const secretKey = (): Uint8Array => encoder.encode(getAuthConfig().jwtSecret);

/** Sign a JWT with the configured TTL. */
export const signJwt = async (
  payload: ForgelyJwtPayload,
  options: { expiresInSeconds?: number } = {},
): Promise<string> => {
  const cfg = getAuthConfig();
  const ttl = options.expiresInSeconds ?? cfg.jwtAccessTtlSeconds;
  return new SignJWT({ role: payload.role, sid: payload.sid, plan: payload.plan })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setIssuer(cfg.jwtIssuer)
    .setAudience(cfg.jwtAudience)
    .setIssuedAt()
    .setExpirationTime(`${ttl}s`)
    .sign(secretKey());
};

/**
 * Verify a JWT. Throws ForgelyError(TOKEN_EXPIRED|TOKEN_INVALID) on failure
 * so callers can do a single `try/catch` regardless of jose's internal types.
 */
export const verifyJwt = async (
  token: string,
): Promise<ForgelyJwtPayload> => {
  const cfg = getAuthConfig();
  try {
    const { payload } = await jwtVerify(token, secretKey(), {
      issuer: cfg.jwtIssuer,
      audience: cfg.jwtAudience,
      algorithms: ['HS256'],
    });

    const sub = typeof payload.sub === 'string' ? payload.sub : '';
    const role = typeof payload.role === 'string' ? (payload.role as UserRole) : 'user';
    const sid = typeof payload.sid === 'string' ? payload.sid : '';
    const plan = typeof payload.plan === 'string' ? payload.plan : undefined;

    if (!sub || !sid) {
      throw new ForgelyError('TOKEN_INVALID', 'Token missing subject/session.', 401);
    }
    return { sub, role, sid, plan };
  } catch (err) {
    if (err instanceof ForgelyError) throw err;
    if (err instanceof joseErrors.JWTExpired) {
      throw new ForgelyError('TOKEN_EXPIRED', 'Session expired. Please sign in again.', 401);
    }
    throw new ForgelyError('TOKEN_INVALID', 'Invalid authentication token.', 401);
  }
};
