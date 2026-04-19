import { describe, expect, it } from 'vitest'

import { TRPCError } from '@trpc/server'
import { assertCan, canPerform, SUPER_ROLES, type SuperRole } from '../../src/routers/super/_acl.js'

describe('super/_acl · canPerform', () => {
  describe('OWNER', () => {
    const role: SuperRole = 'OWNER'

    it.each([
      'users.read',
      'users.suspend',
      'users.delete',
      'finance.read',
      'finance.refund.decide',
      'team.invite',
      'team.role.change',
      'team.remove',
      'platform.setting.change',
      'audit.read',
      'support.ticket.reply',
      'site.takedown',
    ])('allows %s', (action) => {
      expect(canPerform(role, action)).toBe(true)
    })

    it('allows arbitrary unknown actions', () => {
      expect(canPerform(role, 'foo.bar.baz')).toBe(true)
    })
  })

  describe('ADMIN', () => {
    const role: SuperRole = 'ADMIN'

    it.each([
      'users.read',
      'users.suspend',
      'users.delete',
      'audit.read',
      'support.ticket.reply',
      'site.takedown',
    ])('allows %s', (action) => {
      expect(canPerform(role, action)).toBe(true)
    })

    it.each([
      'finance.read',
      'finance.refund.decide',
      'team.invite',
      'team.role.change',
      'team.remove',
      'platform.setting.change',
    ])('denies %s', (action) => {
      expect(canPerform(role, action)).toBe(false)
    })
  })

  describe('SUPPORT', () => {
    const role: SuperRole = 'SUPPORT'

    it.each([
      'users.read',
      'users.detail.read',
      'users.login_as.request',
      'sites.read',
      'support.ticket.read',
      'support.ticket.reply',
      'audit.read',
    ])('allows %s', (action) => {
      expect(canPerform(role, action)).toBe(true)
    })

    it.each([
      'users.suspend',
      'users.delete',
      'users.role.change',
      'finance.read',
      'team.invite',
      'platform.setting.change',
      'site.takedown',
    ])('denies %s', (action) => {
      expect(canPerform(role, action)).toBe(false)
    })

    it('allows generic *.read patterns inside whitelisted prefixes', () => {
      expect(canPerform(role, 'sites.detail.read')).toBe(true)
      expect(canPerform(role, 'users.list.read')).toBe(true)
    })

    it('denies *.read for prefixes not in the whitelist', () => {
      expect(canPerform(role, 'finance.detail.read')).toBe(false)
      expect(canPerform(role, 'team.list.read')).toBe(false)
    })
  })

  it('exports the canonical role tuple', () => {
    expect(SUPER_ROLES).toEqual(['OWNER', 'ADMIN', 'SUPPORT'])
  })
})

describe('super/_acl · assertCan', () => {
  it('returns void when permitted', () => {
    expect(() => assertCan('OWNER', 'platform.setting.change')).not.toThrow()
    expect(() => assertCan('SUPPORT', 'users.read')).not.toThrow()
  })

  it('throws TRPCError(FORBIDDEN) when denied', () => {
    expect(() => assertCan('SUPPORT', 'users.suspend')).toThrow(TRPCError)
    try {
      assertCan('SUPPORT', 'users.suspend')
    } catch (err) {
      expect(err).toBeInstanceOf(TRPCError)
      expect((err as TRPCError).code).toBe('FORBIDDEN')
      expect((err as TRPCError).message).toContain('SUPPORT')
      expect((err as TRPCError).message).toContain('users.suspend')
    }
  })
})
