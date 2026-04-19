import { describe, expect, it } from 'vitest'

import {
  assertFoundAndOwned,
  assertOwnership,
  isOwnedBy,
  ownedScopeWhere,
} from '../../src/auth/tenant.js'
import type { ForgelyError } from '../../src/errors.js'

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
}

describe('auth/tenant', () => {
  it('ownedScopeWhere scopes to userId for normal users', () => {
    expect(ownedScopeWhere({ user: baseUser as never })).toEqual({ userId: 'u1' })
  })

  it('ownedScopeWhere returns empty for super_admin (cross-tenant read)', () => {
    expect(ownedScopeWhere({ user: { ...baseUser, role: 'super_admin' } as never })).toEqual({})
  })

  it('isOwnedBy: owner sees own resource', () => {
    expect(isOwnedBy({ user: baseUser as never }, 'u1')).toBe(true)
  })

  it('isOwnedBy: another user does not', () => {
    expect(isOwnedBy({ user: baseUser as never }, 'u2')).toBe(false)
  })

  it('isOwnedBy: super_admin sees all', () => {
    expect(isOwnedBy({ user: { ...baseUser, role: 'super_admin' } as never }, 'someone-else')).toBe(
      true,
    )
  })

  it('assertOwnership throws FORBIDDEN for cross-tenant access', () => {
    try {
      assertOwnership({ user: baseUser as never }, 'u-other')
      throw new Error('should not reach')
    } catch (err) {
      expect((err as ForgelyError).code).toBe('FORBIDDEN')
    }
  })

  it('assertFoundAndOwned throws NOT_FOUND when row is null', () => {
    try {
      assertFoundAndOwned({ user: baseUser as never }, null, 'Site')
      throw new Error('should not reach')
    } catch (err) {
      expect((err as ForgelyError).code).toBe('NOT_FOUND')
    }
  })

  it('assertFoundAndOwned returns the row when caller owns it', () => {
    const row = { id: 'r1', userId: 'u1', name: 'mine' }
    expect(assertFoundAndOwned({ user: baseUser as never }, row, 'Site')).toBe(row)
  })
})
