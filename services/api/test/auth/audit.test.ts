import { describe, expect, it } from 'vitest'

import { AUDIT_ACTIONS } from '../../src/auth/audit.js'

describe('auth/audit AUDIT_ACTIONS', () => {
  it('contains the canonical auth + sites + billing actions', () => {
    const required = [
      'auth.signup',
      'auth.signin',
      'auth.signout',
      'sites.archive',
      'sites.publish',
      'generation.start',
      'generation.cancel',
      'billing.invoice_paid',
      'billing.refund',
      'credits.purchase',
      'credits.adjustment',
      'super.user_login_as',
      'super.tenant_data_read',
    ]
    for (const action of required) {
      expect((AUDIT_ACTIONS as readonly string[]).includes(action)).toBe(true)
    }
  })

  it('has no duplicates', () => {
    const set = new Set(AUDIT_ACTIONS)
    expect(set.size).toBe(AUDIT_ACTIONS.length)
  })
})
