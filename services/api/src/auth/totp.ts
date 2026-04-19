/**
 * RFC 6238 / RFC 4226 TOTP for 2FA enrolment + verification.
 *
 * The flow:
 *   beginTotpEnrollment(userId)  → generates a base32 secret + otpauth URL
 *                                   (caller renders the QR code).
 *   confirmTotpEnrollment(...)   → user enters a 6-digit code; on first
 *                                   success we persist the secret and stamp
 *                                   `User.totpEnabledAt`.
 *   verifyTotp(userId, code)     → constant-time check, ±1 step window.
 *   disableTotp(userId)          → wipes the secret.
 *
 * No external dep — RFC 6238 is ~30 LOC of HMAC-SHA1.
 *
 * @owner W3
 */

import { createHmac, randomBytes } from 'node:crypto'

import { prisma } from '../db.js'
import { ForgelyError } from '../errors.js'

import { recordAudit } from './audit.js'

const STEP_SECONDS = 30
const DIGITS = 6
const ALLOWED_SKEW = 1

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

const toBase32 = (buf: Buffer): string => {
  let bits = ''
  for (const byte of buf) bits += byte.toString(2).padStart(8, '0')
  let out = ''
  for (let i = 0; i + 5 <= bits.length; i += 5) {
    out += BASE32_ALPHABET[parseInt(bits.slice(i, i + 5), 2)]
  }
  return out
}

const fromBase32 = (s: string): Buffer => {
  const cleaned = s.replace(/=+$/, '').toUpperCase()
  let bits = ''
  for (const ch of cleaned) {
    const idx = BASE32_ALPHABET.indexOf(ch)
    if (idx < 0) throw new ForgelyError('TOKEN_INVALID', 'Invalid TOTP secret.', 400)
    bits += idx.toString(2).padStart(5, '0')
  }
  const out: number[] = []
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    out.push(parseInt(bits.slice(i, i + 8), 2))
  }
  return Buffer.from(out)
}

const computeHotp = (key: Buffer, counter: number): string => {
  const buf = Buffer.alloc(8)
  let value = counter
  for (let i = 7; i >= 0; i -= 1) {
    buf[i] = value & 0xff
    value = Math.floor(value / 256)
  }
  const hmac = createHmac('sha1', key).update(buf).digest()
  const offset = hmac[hmac.length - 1]! & 0x0f
  const bin =
    ((hmac[offset]! & 0x7f) << 24) |
    (hmac[offset + 1]! << 16) |
    (hmac[offset + 2]! << 8) |
    hmac[offset + 3]!
  return (bin % 10 ** DIGITS).toString().padStart(DIGITS, '0')
}

const constantTimeEqual = (a: string, b: string): boolean => {
  if (a.length !== b.length) return false
  let result = 0
  for (let i = 0; i < a.length; i += 1) result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return result === 0
}

const counterAt = (epochMs: number = Date.now()): number =>
  Math.floor(epochMs / 1000 / STEP_SECONDS)

/** Generate a fresh secret + otpauth URL but do NOT persist yet. */
export interface BeginTotpEnrollmentResult {
  secret: string
  /** otpauth://totp URI suitable for `qrcode` libraries. */
  otpauthUrl: string
}

export const beginTotpEnrollment = async (
  userId: string,
  issuer: string = 'Forgely',
): Promise<BeginTotpEnrollmentResult> => {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw new ForgelyError('NOT_FOUND', 'User not found.', 404)

  const secret = toBase32(randomBytes(20))
  const label = encodeURIComponent(`${issuer}:${user.email}`)
  const otpauthUrl = `otpauth://totp/${label}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=${DIGITS}&period=${STEP_SECONDS}`

  // Stash provisional secret on the user row but DO NOT mark enabled yet.
  await prisma.user.update({
    where: { id: userId },
    data: { totpSecret: secret, totpEnabledAt: null },
  })

  return { secret, otpauthUrl }
}

/** Confirm enrolment by entering the first valid code. */
export const confirmTotpEnrollment = async (
  userId: string,
  code: string,
): Promise<{ enabledAt: Date }> => {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user || !user.totpSecret) {
    throw new ForgelyError('TOKEN_INVALID', 'No TOTP enrollment in progress.', 400)
  }
  if (!verifyTotpCode(user.totpSecret, code)) {
    throw new ForgelyError('MFA_REQUIRED', 'Invalid 2FA code.', 401)
  }
  const enabledAt = new Date()
  await prisma.user.update({
    where: { id: userId },
    data: { totpEnabledAt: enabledAt },
  })
  await recordAudit({
    actorId: userId,
    action: 'auth.totp_enrolled',
    after: { enabledAt: enabledAt.toISOString() },
  })
  return { enabledAt }
}

export const verifyTotp = async (userId: string, code: string): Promise<boolean> => {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user?.totpSecret || !user.totpEnabledAt) return false
  return verifyTotpCode(user.totpSecret, code)
}

export const verifyTotpCode = (
  secretBase32: string,
  code: string,
  now: number = Date.now(),
): boolean => {
  if (!/^\d{6}$/.test(code)) return false
  const key = fromBase32(secretBase32)
  const ctr = counterAt(now)
  for (let skew = -ALLOWED_SKEW; skew <= ALLOWED_SKEW; skew += 1) {
    if (constantTimeEqual(computeHotp(key, ctr + skew), code)) return true
  }
  return false
}

export const disableTotp = async (userId: string): Promise<void> => {
  await prisma.user.update({
    where: { id: userId },
    data: { totpSecret: null, totpEnabledAt: null },
  })
  await recordAudit({ actorId: userId, action: 'auth.totp_disabled' })
}
