import { describe, expect, it } from 'vitest';

import {
  MAX_PASSWORD_LENGTH,
  MIN_PASSWORD_LENGTH,
  assertPasswordStrength,
  hashPassword,
  verifyPassword,
} from '../../src/auth/password.js';

describe('auth/password', () => {
  describe('assertPasswordStrength', () => {
    it('rejects passwords shorter than the minimum', () => {
      expect(() => assertPasswordStrength('Aa1')).toThrowError(/at least/);
    });

    it('rejects passwords longer than the maximum', () => {
      const huge = 'A1' + 'a'.repeat(MAX_PASSWORD_LENGTH);
      expect(() => assertPasswordStrength(huge)).toThrowError(/at most/);
    });

    it('rejects passwords without a digit', () => {
      expect(() => assertPasswordStrength('PasswordOnly')).toThrowError(/letter and one number/);
    });

    it('rejects passwords without a letter', () => {
      expect(() => assertPasswordStrength('1234567890')).toThrowError(/letter and one number/);
    });

    it('accepts a strong password at the boundary', () => {
      expect(() => assertPasswordStrength('a'.repeat(MIN_PASSWORD_LENGTH - 1) + '1')).not.toThrow();
    });
  });

  describe('hash + verify', () => {
    it('hashPassword returns an argon2 string starting with $argon2id$', async () => {
      const hash = await hashPassword('Forgely!2026');
      expect(hash.startsWith('$argon2id$')).toBe(true);
    });

    it('verifyPassword accepts the original plaintext', async () => {
      const hash = await hashPassword('Forgely!2026');
      await expect(verifyPassword('Forgely!2026', hash)).resolves.toBe(true);
    });

    it('verifyPassword rejects a wrong password', async () => {
      const hash = await hashPassword('Forgely!2026');
      await expect(verifyPassword('Wrong!12345', hash)).resolves.toBe(false);
    });

    it('verifyPassword returns false when hash is null/empty (OAuth-only users)', async () => {
      await expect(verifyPassword('anything', null)).resolves.toBe(false);
      await expect(verifyPassword('anything', '')).resolves.toBe(false);
    });

    it('two independent hashes of the same password differ (random salt)', async () => {
      const a = await hashPassword('Forgely!2026');
      const b = await hashPassword('Forgely!2026');
      expect(a).not.toEqual(b);
    });
  });
});
