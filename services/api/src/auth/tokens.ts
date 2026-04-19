/**
 * Opaque token utilities — used by Session.sessionToken, password-reset
 * tokens, and email-verification tokens.
 *
 * Tokens are 256 random bits, base64url-encoded (43 chars). DB stores the
 * SHA-256 of the token, so a stolen DB dump can't be replayed.
 *
 * @owner W3 (T06)
 */

import { createHash, randomBytes } from 'node:crypto';

export const TOKEN_BYTES = 32;

/** Generate a fresh opaque token (URL-safe). */
export const generateToken = (bytes: number = TOKEN_BYTES): string =>
  randomBytes(bytes).toString('base64url');

/** SHA-256 hash a token, hex-encoded — for storage / lookup. */
export const hashToken = (token: string): string =>
  createHash('sha256').update(token).digest('hex');

/**
 * Constant-time string equality. Safe for comparing token hashes before we
 * trust the DB lookup (e.g. when both come from user input).
 */
export const safeEqual = (a: string, b: string): boolean => {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i += 1) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
};
