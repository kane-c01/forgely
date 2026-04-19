/**
 * /super > Users tRPC sub-router.
 *
 * Depends on (provided by W3):
 *   - `superAdminProcedure` from `../../trpc`
 *     (a procedure that already enforces `session.role === 'super_admin'`
 *      and exposes `ctx.prisma`, `ctx.session`, `ctx.request`)
 *   - `router` factory from `../../trpc`
 *
 * Until those land, the imports below are flagged as "unresolved" by the
 * IDE but will compile cleanly the moment T06 wires them up.
 */

import { router, superAdminProcedure } from '../../trpc'
import { TRPCError } from '@trpc/server'
import { assertCan } from './_acl'
import { recordAudit, SUPER_ACTIONS } from './_audit-log'
import {
  grantCreditsInput,
  listUsersInput,
  requestLoginAsInput,
  respondLoginAsInput,
  suspendUserInput,
  userIdInput,
} from './_schemas'

export const superUsersRouter = router({
  list: superAdminProcedure.input(listUsersInput).query(async ({ ctx, input }) => {
    assertCan(ctx.user?.role, 'users.read')
    const where = {
      AND: [
        input.status ? { status: input.status } : {},
        input.plan ? { plan: input.plan } : {},
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
        // `lastSeenAt` will be added by W3 in a follow-up; sort by
        // `createdAt` desc as a sensible fallback.
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
    // NOTE: `creditTransactions` relation will be added by W3 in a follow-up
    // schema migration. Until then we cast to satisfy the typecheck and skip
    // the relation include — the route still returns the core User row.
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
    // `User.status` doesn't exist on the current Prisma schema yet — W3
    // owns adding it. We approximate via `deletedAt` (soft-delete) so the
    // suspend / unsuspend round-trip still works at runtime.
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
        type: 'grant',
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

  requestLoginAs: superAdminProcedure
    .input(requestLoginAsInput)
    .mutation(async ({ ctx, input }) => {
      assertCan(ctx.user?.role, 'users.login_as.request')
      // Real impl: insert into LoginAsTicket table + push websocket message
      // to the target user. For MVP the client polls and the user clicks
      // Allow / Deny in apps/app.
      await recordAudit(ctx, {
        action: SUPER_ACTIONS.LOGIN_AS_REQUEST,
        targetType: 'user',
        targetId: input.userId,
        reason: input.reason,
        after: { ticketId: input.ticketId, ttlMinutes: 30 },
      })
      return {
        ticketId: input.ticketId,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        status: 'awaiting_user' as const,
      }
    }),

  respondLoginAs: superAdminProcedure
    .input(respondLoginAsInput)
    .mutation(async ({ ctx, input }) => {
      // Called by the *target user* — the procedure check therefore needs
      // to be relaxed in W3's wiring; for now we leave it on
      // superAdminProcedure as a placeholder and the real `userProcedure`
      // will replace it.
      await recordAudit(ctx, {
        action:
          input.decision === 'allow' ? SUPER_ACTIONS.LOGIN_AS_GRANT : SUPER_ACTIONS.LOGIN_AS_DENY,
        targetType: 'login_as_ticket',
        targetId: input.ticketId,
        after: { decision: input.decision },
      })
      return { ok: true as const }
    }),
})

export type SuperUsersRouter = typeof superUsersRouter
