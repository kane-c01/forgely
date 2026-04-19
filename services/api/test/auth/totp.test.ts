import { createHmac } from 'node:crypto'
import { describe, expect, it } from 'vitest'

import { verifyTotpCode } from '../../src/auth/totp.js'

const SECRET = 'JBSWY3DPEHPK3PXP' // canonical RFC-6238 example secret.
const STEP = 30

const BASE32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

const fromBase32 = (s: string): Buffer => {
  const cleaned = s.replace(/=+$/, '').toUpperCase()
  let bits = ''
  for (const ch of cleaned) bits += BASE32.indexOf(ch).toString(2).padStart(5, '0')
  const out: number[] = []
  for (let i = 0; i + 8 <= bits.length; i += 8) out.push(parseInt(bits.slice(i, i + 8), 2))
  return Buffer.from(out)
}

const generateAt = (epochMs: number): string => {
  const counter = Math.floor(epochMs / 1000 / STEP)
  const buf = Buffer.alloc(8)
  let v = counter
  for (let i = 7; i >= 0; i -= 1) {
    buf[i] = v & 0xff
    v = Math.floor(v / 256)
  }
  const hmac = createHmac('sha1', fromBase32(SECRET)).update(buf).digest()
  const offset = hmac[hmac.length - 1]! & 0x0f
  const bin =
    ((hmac[offset]! & 0x7f) << 24) |
    (hmac[offset + 1]! << 16) |
    (hmac[offset + 2]! << 8) |
    hmac[offset + 3]!
  return (bin % 1_000_000).toString().padStart(6, '0')
}

const NOW = 1_700_000_000_000
const PREV = NOW - STEP * 1000
const NEXT = NOW + STEP * 1000
const FAR_FUTURE = NOW + 5 * STEP * 1000

describe('auth/totp.verifyTotpCode', () => {
  it('accepts the current-period code', () => {
    expect(verifyTotpCode(SECRET, generateAt(NOW), NOW)).toBe(true)
  })

  it('accepts the previous period (skew -1)', () => {
    expect(verifyTotpCode(SECRET, generateAt(PREV), NOW)).toBe(true)
  })

  it('accepts the next period (skew +1)', () => {
    expect(verifyTotpCode(SECRET, generateAt(NEXT), NOW)).toBe(true)
  })

  it('rejects a code from far in the future (>1 step skew)', () => {
    expect(verifyTotpCode(SECRET, generateAt(FAR_FUTURE), NOW)).toBe(false)
  })

  it('rejects an obviously wrong code', () => {
    expect(verifyTotpCode(SECRET, '000000', NOW)).toBe(false)
  })

  it('rejects non-6-digit input', () => {
    expect(verifyTotpCode(SECRET, '12345', NOW)).toBe(false)
    expect(verifyTotpCode(SECRET, '1234567', NOW)).toBe(false)
    expect(verifyTotpCode(SECRET, 'ABCDEF', NOW)).toBe(false)
  })
})
