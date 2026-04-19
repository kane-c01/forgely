/**
 * Email verification flow.
 *
 *   sendEmailVerification(userId)  → creates a VerificationToken row
 *                                    (identifier = email, token = opaque
 *                                    24h TTL), returns the plain token to
 *                                    the email transport.
 *   verifyEmail(token)             → consumes the row, sets User.emailVerifiedAt.
 *
 * Re-uses the Auth.js `VerificationToken` model so future email-link OAuth
 * sign-in (magic links) can share the schema.
 *
 * @owner W3
 */

import { prisma } from '../db.js'
import { ForgelyError } from '../errors.js'

import { recordAudit } from './audit.js'
import { generateToken } from './tokens.js'

const VERIFY_TTL_MS = 24 * 60 * 60 * 1000

export interface SendEmailVerificationResult {
  /** Already verified, no email queued. */
  alreadyVerified: boolean
  /** Plain token for the email link; null when alreadyVerified. */
  token: string | null
  expiresAt: Date | null
  email: string
}

export const sendEmailVerification = async (
  userId: string,
): Promise<SendEmailVerificationResult> => {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user || user.deletedAt) {
    throw new ForgelyError('NOT_FOUND', 'User not found.', 404)
  }
  if (user.emailVerifiedAt) {
    return {
      alreadyVerified: true,
      token: null,
      expiresAt: null,
      email: user.email,
    }
  }

  // Replace any pending tokens for this email (typo: deletes prior tokens).
  await prisma.verificationToken.deleteMany({
    where: { identifier: user.email },
  })

  const token = generateToken()
  const expires = new Date(Date.now() + VERIFY_TTL_MS)
  await prisma.verificationToken.create({
    data: { identifier: user.email, token, expires },
  })

  return {
    alreadyVerified: false,
    token,
    expiresAt: expires,
    email: user.email,
  }
}

export interface VerifyEmailInput {
  token: string
  email: string
  ipAddress?: string | null
  userAgent?: string | null
}

export interface VerifyEmailResult {
  userId: string
  verifiedAt: Date
}

export const verifyEmail = async (input: VerifyEmailInput): Promise<VerifyEmailResult> => {
  const identifier = input.email.trim().toLowerCase()

  const row = await prisma.verificationToken.findUnique({
    where: { identifier_token: { identifier, token: input.token } },
  })
  if (!row) {
    throw new ForgelyError('TOKEN_INVALID', 'Verification link is invalid or already used.', 400)
  }
  if (row.expires.getTime() <= Date.now()) {
    await prisma.verificationToken
      .delete({ where: { identifier_token: { identifier, token: input.token } } })
      .catch(() => undefined)
    throw new ForgelyError('TOKEN_EXPIRED', 'Verification link has expired.', 400)
  }

  const user = await prisma.user.findUnique({ where: { email: identifier } })
  if (!user) {
    throw new ForgelyError('NOT_FOUND', 'User not found.', 404)
  }

  const now = new Date()
  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { emailVerifiedAt: now },
    }),
    prisma.verificationToken.delete({
      where: { identifier_token: { identifier, token: input.token } },
    }),
  ])

  await recordAudit({
    actorId: user.id,
    action: 'auth.email_verified',
    after: { verifiedAt: now.toISOString() },
    ipAddress: input.ipAddress,
    userAgent: input.userAgent,
  })

  return { userId: user.id, verifiedAt: now }
}

export const purgeExpiredVerificationTokens = async (): Promise<number> => {
  const { count } = await prisma.verificationToken.deleteMany({
    where: { expires: { lte: new Date() } },
  })
  return count
}
