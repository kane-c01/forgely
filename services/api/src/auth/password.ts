/**
 * Password hashing & strength policy.
 *
 * - Argon2id with OWASP-recommended cost (m=19MiB, t=2, p=1).
 * - Strength policy is intentionally light (≥10 chars, ≥1 letter, ≥1 number)
 *   to keep onboarding friction low; we lean on lockout + 2FA for high-value
 *   accounts (super_admin) instead of password-complexity theatre.
 *
 * @owner W3 (T06)
 */

import * as argon2 from 'argon2';

import { ForgelyError } from '../errors.js';

const ARGON2_OPTIONS: argon2.Options = {
  type: argon2.argon2id,
  memoryCost: 19 * 1024,
  timeCost: 2,
  parallelism: 1,
};

/** Minimum acceptable password length for human users. */
export const MIN_PASSWORD_LENGTH = 10;
export const MAX_PASSWORD_LENGTH = 128;

const HAS_LETTER = /[A-Za-z]/;
const HAS_NUMBER = /[0-9]/;

/**
 * Validates a candidate plaintext password. Throws `ForgelyError`
 * (code WEAK_PASSWORD) on the first violation.
 */
export const assertPasswordStrength = (plaintext: string): void => {
  if (typeof plaintext !== 'string') {
    throw new ForgelyError('WEAK_PASSWORD', 'Password must be a string.', 400);
  }
  if (plaintext.length < MIN_PASSWORD_LENGTH) {
    throw new ForgelyError(
      'WEAK_PASSWORD',
      `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
      400,
    );
  }
  if (plaintext.length > MAX_PASSWORD_LENGTH) {
    throw new ForgelyError(
      'WEAK_PASSWORD',
      `Password must be at most ${MAX_PASSWORD_LENGTH} characters.`,
      400,
    );
  }
  if (!HAS_LETTER.test(plaintext) || !HAS_NUMBER.test(plaintext)) {
    throw new ForgelyError(
      'WEAK_PASSWORD',
      'Password must contain at least one letter and one number.',
      400,
    );
  }
};

/** Hashes a password with argon2id. */
export const hashPassword = async (plaintext: string): Promise<string> => {
  assertPasswordStrength(plaintext);
  return argon2.hash(plaintext, ARGON2_OPTIONS);
};

/**
 * Constant-time password verification. Returns false if the stored hash is
 * empty/null (so OAuth-only users can't be brute-forced via password login).
 */
export const verifyPassword = async (
  plaintext: string,
  storedHash: string | null | undefined,
): Promise<boolean> => {
  if (!storedHash) return false;
  try {
    return await argon2.verify(storedHash, plaintext);
  } catch {
    return false;
  }
};
