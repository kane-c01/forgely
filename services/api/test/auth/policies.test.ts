import { describe, expect, it } from 'vitest';

import {
  isAuthenticated,
  isSuperAdmin,
  requireRole,
  requireSuperAdmin,
  requireUser,
} from '../../src/auth/policies.js';
import { ForgelyError } from '../../src/errors.js';

const baseUser = {
  id: 'u1',
  email: 'a@b.com',
  emailVerifiedAt: null,
  name: null,
  avatarUrl: null,
  passwordHash: null,
  role: 'user',
  plan: 'free',
  stripeCustomerId: null,
  failedLoginCount: 0,
  lockedUntil: null,
  totpSecret: null,
  totpEnabledAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

describe('auth/policies', () => {
  it('isAuthenticated reflects ctx state', () => {
    expect(isAuthenticated({ user: null, session: null })).toBe(false);
    expect(
      isAuthenticated({
        user: baseUser as never,
        session: { id: 's', userId: 'u1' },
      }),
    ).toBe(true);
  });

  it('requireUser throws unauthorized when ctx is anonymous', () => {
    try {
      requireUser({ user: null, session: null });
      throw new Error('should not reach');
    } catch (err) {
      expect(err).toBeInstanceOf(ForgelyError);
      expect((err as ForgelyError).code).toBe('UNAUTHORIZED');
    }
  });

  it('requireRole rejects users outside the allowed set', () => {
    try {
      requireRole(
        { user: baseUser as never, session: { id: 's', userId: 'u1' } },
        'super_admin',
      );
      throw new Error('should not reach');
    } catch (err) {
      expect((err as ForgelyError).code).toBe('FORBIDDEN');
    }
  });

  it('requireSuperAdmin admits super_admin', () => {
    const admin = { ...baseUser, role: 'super_admin' };
    const u = requireSuperAdmin({
      user: admin as never,
      session: { id: 's', userId: 'u1' },
    });
    expect(u.id).toBe('u1');
  });

  it('isSuperAdmin convenience predicate', () => {
    expect(isSuperAdmin(null)).toBe(false);
    expect(isSuperAdmin({ role: 'user' })).toBe(false);
    expect(isSuperAdmin({ role: 'super_admin' })).toBe(true);
  });
});
