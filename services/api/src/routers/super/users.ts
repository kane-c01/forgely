/**
 * /super > Users tRPC sub-router.
 *
 * Combines four concerns:
 *
 *   1. List + detail of platform users
 *   2. Suspend / unsuspend (soft-delete via `deletedAt`)
 *   3. Grant credits (writes both `UserCredits` and a `CreditTransaction`)
 *   4. Login-as-User flow (request → user-decide → super-admin-consume,
 *      30-minute JWT lifecycle, see `./_login-as.ts`)
 *
 * Every mutation records to `AuditLog` through `recordAudit()`.
 */

import { TRPCError } from '@trpc/server'

import { protectedProcedure, router, superAdminProcedure } from '../../router/trpc.js'
import { assertCan } from './_acl.js'
import { recordAudit, SUPER_ACTIONS } from './_audit-log.js'
import {
  consumeLoginAsTicket,
  createLoginAsTicket,
  resolveLoginAsTicket,
  type LoginAsPrismaShim,
} from './_login-as.js'
import {
  consumeLoginAsTicketInput,
  grantCreditsInput,
  listMyLoginAsTicketsInput,
  listUsersInput,
  requestLoginAsInput,
  respondLoginAsInput,
  suspendUserInput,
  userIdInput,
} from './_schemas.js'

export const superUsersRouter = router({
  list: superAdminProcedure.input(listUsersInput).query(async ({ ctx, input }) => {
    assertCan(ctx.user?.role, 'users.read')
    const where = {
      AND: [
        input.status === 'suspended' ? { deletedAt: { not: null } } : {},
        input.status === 'active' ? { deletedAt: null } : {},
        input.search
          ? {
              OR: [
                { email: { contains: input.search, mode: 'insensitive' as const } },
                { name: { contains: input.search, mode: 'insensitive' as const } },
                { id: { equals: input.search } },
              ],
            }
          : {},
      ],
    }
    const [rows, total] = await Promise.all([
      ctx.prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (input.page - 1) * input.pageSize,
        take: input.pageSize,
      }),
      ctx.prisma.user.count({ where }),
    ])
    return { rows, total, page: input.page, pageSize: input.pageSize }
  }),

  detail: superAdminProcedure.input(userIdInput).query(async ({ ctx, input }) => {
    assertCan(ctx.user?.role, 'users.detail.read')
    const user = await ctx.prisma.user.findUnique({
      where: { id: input.userId },
      include: {
        sites: { take: 8, orderBy: { updatedAt: 'desc' } },
      } as Parameters<typeof ctx.prisma.user.findUnique>[0]['include'],
    })
    if (!user) throw new TRPCError({ code: 'NOT_FOUND' })
    return user
  }),

  suspend: superAdminProcedure.input(suspendUserInput).mutation(async ({ ctx, input }) => {
    assertCan(ctx.user?.role, 'users.suspend')
    const before = await ctx.prisma.user.findUnique({ where: { id: input.userId } })
    if (!before) throw new TRPCError({ code: 'NOT_FOUND' })
    const after = await ctx.prisma.user.update({
      where: { id: input.userId },
      data: { deletedAt: new Date() },
    })
    await recordAudit(ctx, {
      action: SUPER_ACTIONS.USER_SUSPEND,
      targetType: 'user',
      targetId: input.userId,
      before: { deletedAt: before.deletedAt },
      after: { deletedAt: after.deletedAt },
      reason: input.reason,
    })
    return { ok: true as const }
  }),

  unsuspend: superAdminProcedure.input(userIdInput).mutation(async ({ ctx, input }) => {
    assertCan(ctx.user?.role, 'users.unsuspend')
    const before = await ctx.prisma.user.findUnique({ where: { id: input.userId } })
    if (!before) throw new TRPCError({ code: 'NOT_FOUND' })
    const after = await ctx.prisma.user.update({
      where: { id: input.userId },
      data: { deletedAt: null },
    })
    await recordAudit(ctx, {
      action: SUPER_ACTIONS.USER_UNSUSPEND,
      targetType: 'user',
      targetId: input.userId,
      before: { deletedAt: before.deletedAt },
      after: { deletedAt: after.deletedAt },
    })
    return { ok: true as const }
  }),

  grantCredits: superAdminProcedure.input(grantCreditsInput).mutation(async ({ ctx, input }) => {
    assertCan(ctx.user?.role, 'credits.grant')
    const credits = await ctx.prisma.userCredits.update({
      where: { userId: input.userId },
      data: { balance: { increment: input.amount } },
    })
    await ctx.prisma.creditTransaction.create({
      data: {
        userId: input.userId,
        type: 'gift',
        amount: input.amount,
        balance: credits.balance,
        description: `Manual grant by super-admin (${input.reason})`,
      },
    })
    await recordAudit(ctx, {
      action: SUPER_ACTIONS.CREDITS_GRANT,
      targetType: 'user',
      targetId: input.userId,
      after: { amount: input.amount, balance: credits.balance },
      reason: input.reason,
    })
    return { ok: true as const, balance: credits.balance }
  }),

  // ─── Login as User ───────────────────────────────────────────────

  requestLoginAs: superAdminProcedure
    .input(requestLoginAsInput)
    .mutation(async ({ ctx, input }) => {
      assertCan(ctx.user?.role, 'users.login_as.request')
      if (!ctx.user) {
        throw new TRPCError({ code: 'UNAUTHORIZED' })
      }
      const ticket = await createLoginAsTicket(ctx.prisma as unknown as LoginAsPrismaShim, {
        requestedBy: ctx.user.id,
        targetUserId: input.userId,
        reason: input.reason,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
      })
      await recordAudit(ctx, {
        action: SUPER_ACTIONS.LOGIN_AS_REQUEST,
        targetType: 'user',
        targetId: input.userId,
        reason: input.reason,
        after: { ticketId: ticket.id, expiresAt: ticket.expiresAt.toISOString() },
      })
      return {
        ticketId: ticket.id,
        expiresAt: ticket.expiresAt.toISOString(),
        status: ticket.status as 'awaiting_user',
      }
    }),

  /**
   * Called by the *target user* (not the super-admin), so it sits on
   * `protectedProcedure`. The shim helper checks `actorUserId === targetUserId`.
   */
  respondLoginAs: protectedProcedure.input(respondLoginAsInput).mutation(async ({ ctx, input }) => {
    const ticket = await resolveLoginAsTicket(ctx.prisma as unknown as LoginAsPrismaShim, {
      ticketId: input.ticketId,
      decision: input.decision,
      actorUserId: ctx.user.id,
    })
    await recordAudit(ctx, {
      action:
        input.decision === 'allow' ? SUPER_ACTIONS.LOGIN_AS_GRANT : SUPER_ACTIONS.LOGIN_AS_DENY,
      targetType: 'login_as_ticket',
      targetId: input.ticketId,
      after: { status: ticket.status, decision: input.decision },
    })
    return { ok: true as const, status: ticket.status }
  }),

  consumeLoginAs: superAdminProcedure
    .input(consumeLoginAsTicketInput)
    .mutation(async ({ ctx, input }) => {
      assertCan(ctx.user?.role, 'users.login_as.request')
      if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' })
      const result = await consumeLoginAsTicket(ctx.prisma as unknown as LoginAsPrismaShim, {
        ticketId: input.ticketId,
        actorUserId: ctx.user.id,
      })
      await recordAudit(ctx, {
        action: SUPER_ACTIONS.LOGIN_AS_GRANT,
        targetType: 'login_as_ticket',
        targetId: input.ticketId,
        after: {
          consumedAt: result.ticket.consumedAt?.toISOString() ?? null,
          jwtHash: result.ticket.jwtHash,
          targetUserId: result.ticket.targetUserId,
        },
        reason: 'super_admin_consumed',
      })
      return {
        jwt: result.jwt,
        expiresAt: result.expiresAt.toISOString(),
        targetUserId: result.ticket.targetUserId,
      }
    }),

  /**
   * Lets a target user list their own pending impersonation tickets so the
   * UI can render an inline Allow / Deny banner.
   */
  myPendingLoginAs: protectedProcedure
    .input(listMyLoginAsTicketsInput)
    .query(async ({ ctx, input }) => {
      const tickets = (await (ctx.prisma as unknown as LoginAsPrismaShim).loginAsTicket.findUnique) // typed shim only has findUnique — fall through to raw
        ? []
        : []
      void input // silence unused-var until we wire findMany on the shim
      void tickets
      // For MVP we surface from raw prisma client (the shim covers writes,
      // queries can use the full client). Returns the most recent 5 tickets
      // for this user that are not yet decided.
      const rows = await ctx.prisma.loginAsTicket.findMany({
        where: {
          targetUserId: ctx.user.id,
          status: input.status ?? 'awaiting_user',
          expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      })
      return rows
    }),
})

export type SuperUsersRouter = typeof superUsersRouter
