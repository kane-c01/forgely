/**
 * Login-as-User ticket lifecycle.
 *
 * Flow (docs/MASTER.md §20.3, decision Q3:C — explicit user consent):
 *
 *   1. Super-admin calls `super.users.requestLoginAs({ userId, reason })`
 *      → `createLoginAsTicket()` writes a `LoginAsTicket` row (status =
 *        `awaiting_user`, expires in 30 min) and returns the ticket id.
 *   2. The target user receives a notification (push / in-app) and calls
 *      `super.users.respondLoginAs({ ticketId, decision })`
 *      → `decideLoginAsTicket()` updates the row to `granted` or `denied`.
 *   3. The super-admin polls and, once `granted`, calls
 *      `super.users.consumeLoginAsTicket({ ticketId })`
 *      → `consumeLoginAsTicket()` verifies status + ttl, signs an
 *        impersonation JWT (`sub = targetUserId`, `sid = lat_<ticketId>`)
 *        and marks the ticket `consumed`. The JWT remains valid until the
 *        ticket's original 30-minute window closes — never longer.
 *
 * Every step writes to AuditLog through the caller — this module is pure
 * data-layer + crypto.
 */

import { TRPCError } from '@trpc/server'
import { createHash } from 'node:crypto'

import { signJwt } from '../../auth/jwt.js'

const TICKET_TTL_MS = 30 * 60 * 1000

export interface LoginAsPrismaShim {
  loginAsTicket: {
    create: (args: { data: Record<string, unknown> }) => Promise<LoginAsTicketRow>
    findUnique: (args: { where: { id: string } }) => Promise<LoginAsTicketRow | null>
    update: (args: {
      where: { id: string }
      data: Record<string, unknown>
    }) => Promise<LoginAsTicketRow>
  }
  user: {
    findUnique: (args: { where: { id: string } }) => Promise<{
      id: string
      role: string
      deletedAt: Date | null
    } | null>
  }
}

export interface LoginAsTicketRow {
  id: string
  requestedBy: string
  targetUserId: string
  status: string
  reason: string
  jwtHash: string | null
  ipAddress: string | null
  userAgent: string | null
  createdAt: Date
  expiresAt: Date
  decidedAt: Date | null
  consumedAt: Date | null
}

export interface CreateLoginAsTicketInput {
  requestedBy: string
  targetUserId: string
  reason: string
  ipAddress?: string | null
  userAgent?: string | null
}

export async function createLoginAsTicket(
  prisma: LoginAsPrismaShim,
  input: CreateLoginAsTicketInput,
): Promise<LoginAsTicketRow> {
  const target = await prisma.user.findUnique({ where: { id: input.targetUserId } })
  if (!target || target.deletedAt) {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'Target user not found.' })
  }
  return prisma.loginAsTicket.create({
    data: {
      requestedBy: input.requestedBy,
      targetUserId: input.targetUserId,
      status: 'awaiting_user',
      reason: input.reason,
      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent ?? null,
      expiresAt: new Date(Date.now() + TICKET_TTL_MS),
    },
  })
}

export interface ResolveLoginAsTicketInput {
  ticketId: string
  decision: 'allow' | 'deny'
  /** id of the user who is making the decision (must equal targetUserId). */
  actorUserId: string
}

export async function resolveLoginAsTicket(
  prisma: LoginAsPrismaShim,
  input: ResolveLoginAsTicketInput,
): Promise<LoginAsTicketRow> {
  const ticket = await prisma.loginAsTicket.findUnique({ where: { id: input.ticketId } })
  if (!ticket) throw new TRPCError({ code: 'NOT_FOUND' })
  if (ticket.targetUserId !== input.actorUserId) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Only the impersonation target can decide this ticket.',
    })
  }
  if (ticket.status !== 'awaiting_user') {
    throw new TRPCError({
      code: 'CONFLICT',
      message: `Ticket already ${ticket.status}.`,
    })
  }
  if (ticket.expiresAt.getTime() < Date.now()) {
    return prisma.loginAsTicket.update({
      where: { id: input.ticketId },
      data: { status: 'expired', decidedAt: new Date() },
    })
  }
  return prisma.loginAsTicket.update({
    where: { id: input.ticketId },
    data: {
      status: input.decision === 'allow' ? 'granted' : 'denied',
      decidedAt: new Date(),
    },
  })
}

export interface ConsumeLoginAsTicketInput {
  ticketId: string
  /** id of the super-admin redeeming the ticket. */
  actorUserId: string
}

export interface ConsumedTicket {
  jwt: string
  ticket: LoginAsTicketRow
  expiresAt: Date
}

export async function consumeLoginAsTicket(
  prisma: LoginAsPrismaShim,
  input: ConsumeLoginAsTicketInput,
): Promise<ConsumedTicket> {
  const ticket = await prisma.loginAsTicket.findUnique({ where: { id: input.ticketId } })
  if (!ticket) throw new TRPCError({ code: 'NOT_FOUND' })
  if (ticket.requestedBy !== input.actorUserId) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Only the requesting super-admin can consume this ticket.',
    })
  }
  if (ticket.status !== 'granted') {
    throw new TRPCError({
      code: 'CONFLICT',
      message: `Ticket is ${ticket.status} — only granted tickets can be consumed.`,
    })
  }
  if (ticket.expiresAt.getTime() < Date.now()) {
    await prisma.loginAsTicket.update({
      where: { id: input.ticketId },
      data: { status: 'expired' },
    })
    // tRPC v10 has no GONE — TIMEOUT is the closest semantic match.
    throw new TRPCError({ code: 'TIMEOUT', message: 'Ticket expired.' })
  }
  const target = await prisma.user.findUnique({ where: { id: ticket.targetUserId } })
  if (!target || target.deletedAt) {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'Target user no longer exists.' })
  }

  const ttlSeconds = Math.max(60, Math.floor((ticket.expiresAt.getTime() - Date.now()) / 1000))
  const sid = `lat_${ticket.id}`
  const jwt = await signJwt(
    {
      sub: target.id,
      // signJwt's role union is { user, super_admin, support, admin } —
      // map our schema 'system' role onto 'admin' for the token, since
      // 'system' is an internal sentinel and should never be impersonated.
      role: (target.role === 'system' ? 'admin' : target.role) as
        | 'user'
        | 'super_admin'
        | 'support'
        | 'admin',
      sid,
    },
    { expiresInSeconds: ttlSeconds },
  )

  const jwtHash = createHash('sha256').update(jwt).digest('hex')
  const consumed = await prisma.loginAsTicket.update({
    where: { id: input.ticketId },
    data: {
      status: 'consumed',
      consumedAt: new Date(),
      jwtHash,
    },
  })

  return { jwt, ticket: consumed, expiresAt: ticket.expiresAt }
}

/**
 * Detect whether a session id originated from a Login-as-User ticket.
 * Used by the AuditLog middleware to tag impersonated actions with
 * `actorType=super_admin` even though `ctx.user` is the impersonated user.
 */
export function isImpersonationSid(sid: string): boolean {
  return sid.startsWith('lat_')
}

export function ticketIdFromSid(sid: string): string | null {
  return sid.startsWith('lat_') ? sid.slice(4) : null
}
