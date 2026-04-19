/**
 * Password reset flow.
 *
 *   requestPasswordReset(email)   → creates an opaque token (only the
 *                                    SHA-256 hash is stored), returns it
 *                                    to the caller (which forwards via
 *                                    the email transport).
 *   consumePasswordReset(token, …) → verifies the hash, expires the row,
 *                                    sets the new password, revokes every
 *                                    session for the user (force re-login
 *                                    everywhere).
 *
 * Constant-time comparison is intrinsic to the hash lookup. The endpoint
 * never reveals whether the email exists — both code paths return the
 * same shape and timing characteristics.
 *
 * @owner W3
 */

import { prisma } from '../db.js'
import { ForgelyError } from '../errors.js'

import { recordAudit, recordLoginEvent } from './audit.js'
import { hashPassword } from './password.js'
import { revokeAllSessionsForUser } from './sessions.js'
import { generateToken, hashToken } from './tokens.js'

const RESET_TTL_MS = 30 * 60 * 1000

export interface RequestPasswordResetInput {
  email: string
  ipAddress?: string | null
  userAgent?: string | null
}

export interface RequestPasswordResetResult {
  /** True iff the email maps to an active user. */
  enqueued: boolean
  /**
   * The plain token to embed in the reset link. ONLY populated when a real
   * user exists; null otherwise. The transport (email service) is responsible
   * for the user-facing copy.
   */
  token: string | null
  expiresAt: Date | null
}

export const requestPasswordReset = async (
  input: RequestPasswordResetInput,
): Promise<RequestPasswordResetResult> => {
  const email = input.email.trim().toLowerCase()
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user || user.deletedAt) {
    return { enqueued: false, token: null, expiresAt: null }
  }

  const token = generateToken()
  const tokenHash = hashToken(token)
  const expiresAt = new Date(Date.now() + RESET_TTL_MS)

  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expires: expiresAt,
      ipAddress: input.ipAddress ?? null,
    },
  })

  await recordAudit({
    actorId: user.id,
    action: 'auth.password_reset_request',
    ipAddress: input.ipAddress,
    userAgent: input.userAgent,
  })

  return { enqueued: true, token, expiresAt }
}

export interface ConsumePasswordResetInput {
  token: string
  newPassword: string
  ipAddress?: string | null
  userAgent?: string | null
}

export interface ConsumePasswordResetResult {
  userId: string
  /** Number of other sessions revoked as part of the reset. */
  revokedSessions: number
}

export const consumePasswordReset = async (
  input: ConsumePasswordResetInput,
): Promise<ConsumePasswordResetResult> => {
  const tokenHash = hashToken(input.token)
  const row = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
  })

  if (!row || row.consumedAt) {
    throw new ForgelyError('TOKEN_INVALID', 'Reset link is invalid or already used.', 400)
  }
  if (row.expires.getTime() <= Date.now()) {
    throw new ForgelyError('TOKEN_EXPIRED', 'Reset link has expired.', 400)
  }

  const passwordHash = await hashPassword(input.newPassword)

  await prisma.$transaction([
    prisma.user.update({
      where: { id: row.userId },
      data: {
        passwordHash,
        failedLoginCount: 0,
        lockedUntil: null,
      },
    }),
    prisma.passwordResetToken.update({
      where: { id: row.id },
      data: { consumedAt: new Date() },
    }),
  ])

  const revokedSessions = await revokeAllSessionsForUser(row.userId)

  await recordAudit({
    actorId: row.userId,
    action: 'auth.password_reset_complete',
    after: { revokedSessions },
    ipAddress: input.ipAddress,
    userAgent: input.userAgent,
  })

  await recordLoginEvent({
    userId: row.userId,
    email: '',
    outcome: 'success',
    ipAddress: input.ipAddress,
    userAgent: input.userAgent,
  })

  return { userId: row.userId, revokedSessions }
}

/** Cron-friendly cleanup. */
export const purgeExpiredPasswordResets = async (): Promise<number> => {
  const { count } = await prisma.passwordResetToken.deleteMany({
    where: { expires: { lte: new Date() } },
  })
  return count
}
