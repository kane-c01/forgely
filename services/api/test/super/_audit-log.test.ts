import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  recordAudit,
  SUPER_ACTIONS,
  type AuditableContext,
  type AuditLogInsert,
} from '../../src/routers/super/_audit-log.js'

interface RecorderState {
  inserts: AuditLogInsert[]
  shouldThrow: boolean
}

function makeContext(state: RecorderState): AuditableContext {
  return {
    prisma: {
      auditLog: {
        create: vi.fn(async ({ data }: { data: AuditLogInsert }) => {
          if (state.shouldThrow) {
            throw new Error('db down')
          }
          state.inserts.push(data)
          return data
        }),
      },
    },
    session: { userId: 'sa_alex', role: 'super_admin' },
    request: {
      ipAddress: '198.51.100.4',
      userAgent: 'Forgely/Test',
    },
  }
}

describe('super/_audit-log · recordAudit', () => {
  let state: RecorderState

  beforeEach(() => {
    state = { inserts: [], shouldThrow: false }
  })

  it('persists actor + target + payload', async () => {
    const ctx = makeContext(state)
    await recordAudit(ctx, {
      action: SUPER_ACTIONS.USER_SUSPEND,
      targetType: 'user',
      targetId: 'usr_abc',
      before: { status: 'active' },
      after: { status: 'suspended' },
      reason: 'Spam reports',
    })

    expect(state.inserts).toHaveLength(1)
    const row = state.inserts[0]!
    expect(row).toMatchObject({
      actorType: 'super_admin',
      actorId: 'sa_alex',
      action: 'users.suspend',
      targetType: 'user',
      targetId: 'usr_abc',
      reason: 'Spam reports',
      ipAddress: '198.51.100.4',
      userAgent: 'Forgely/Test',
    })
    expect(row.before).toEqual({ status: 'active' })
    expect(row.after).toEqual({ status: 'suspended' })
  })

  it('coerces missing optional fields to null (not undefined) so the column writer is happy', async () => {
    const ctx = makeContext(state)
    await recordAudit(ctx, {
      action: SUPER_ACTIONS.LOGIN_AS_REQUEST,
      targetType: 'user',
      targetId: 'usr_def',
    })

    const row = state.inserts[0]!
    expect(row.before).toBeNull()
    expect(row.after).toBeNull()
    expect(row.reason).toBeNull()
  })

  it('never throws — DB failure is logged and swallowed', async () => {
    state.shouldThrow = true
    const ctx = makeContext(state)
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    await expect(
      recordAudit(ctx, {
        action: SUPER_ACTIONS.SITE_TAKEDOWN,
        targetType: 'site',
        targetId: 'site_zzz',
      }),
    ).resolves.toBeUndefined()

    expect(errorSpy).toHaveBeenCalledWith(
      '[super/audit] failed to record',
      'site.takedown',
      expect.any(Error),
    )
    errorSpy.mockRestore()
  })
})

describe('super/_audit-log · SUPER_ACTIONS', () => {
  const KNOWN_PREFIXES = [
    'users.',
    'credits.',
    'subscription.',
    'support.',
    'team.',
    'platform.',
    'site.',
  ]

  it('every action id matches a documented namespace', () => {
    for (const value of Object.values(SUPER_ACTIONS)) {
      const matched = KNOWN_PREFIXES.some((p) => value.startsWith(p))
      expect(matched, `${value} should start with one of ${KNOWN_PREFIXES.join(', ')}`).toBe(true)
    }
  })

  it('values are unique', () => {
    const values = Object.values(SUPER_ACTIONS)
    expect(new Set(values).size).toBe(values.length)
  })

  it('exposes all four Login-as-User lifecycle states', () => {
    expect(SUPER_ACTIONS.LOGIN_AS_REQUEST).toBe('support.login_as_user.requested')
    expect(SUPER_ACTIONS.LOGIN_AS_GRANT).toBe('support.login_as_user.granted')
    expect(SUPER_ACTIONS.LOGIN_AS_DENY).toBe('support.login_as_user.denied')
    expect(SUPER_ACTIONS.LOGIN_AS_EXPIRE).toBe('support.login_as_user.expired')
  })
})
