/**
 * /super > Team tRPC sub-router. OWNER only.
 *
 * Manages the super-admin team (OWNER / ADMIN / SUPPORT roles). Sits on
 * top of the existing `TeamMember` Prisma model and reserves
 * `ownerUserId = 'forgely_super'` as the synthetic tenant id for the
 * platform-wide super team. (Per-user team rosters use the user's own
 * id as `ownerUserId`.)
 *
 * Outbound emails are dispatched through `ctx.email` if it exists on the
 * context, otherwise queued for later delivery via the BullMQ worker.
 */

import { TRPCError } from '@trpc/server'

import { router, superAdminProcedure } from '../../router/trpc.js'
import { assertCan } from './_acl.js'
import { recordAudit, SUPER_ACTIONS } from './_audit-log.js'
import { inviteTeamMemberInput, updateTeamRoleInput, userIdInput } from './_schemas.js'

/** Synthetic tenant id for the platform-wide super team. */
export const SUPER_TENANT_ID = 'forgely_super'

export interface SuperTeamRow {
  id: string
  email: string
  role: 'OWNER' | 'ADMIN' | 'SUPPORT'
  status: 'pending' | 'active' | 'revoked'
  invitedAt: Date
  acceptedAt: Date | null
  revokedAt: Date | null
  /** Resolved User row id, when the invite has been accepted. */
  userId: string | null
}

function rowFromDb(m: {
  id: string
  email: string
  role: string
  invitedAt: Date
  acceptedAt: Date | null
  revokedAt: Date | null
  userId: string | null
}): SuperTeamRow {
  const role: SuperTeamRow['role'] =
    m.role === 'OWNER' || m.role === 'ADMIN' || m.role === 'SUPPORT'
      ? (m.role as SuperTeamRow['role'])
      : 'SUPPORT'
  const status: SuperTeamRow['status'] = m.revokedAt
    ? 'revoked'
    : m.acceptedAt
      ? 'active'
      : 'pending'
  return {
    id: m.id,
    email: m.email,
    role,
    status,
    invitedAt: m.invitedAt,
    acceptedAt: m.acceptedAt,
    revokedAt: m.revokedAt,
    userId: m.userId,
  }
}

export const superTeamRouter = router({
  list: superAdminProcedure.query(async ({ ctx }): Promise<SuperTeamRow[]> => {
    assertCan(ctx.user?.role, 'team.read')
    const rows = await ctx.prisma.teamMember.findMany({
      where: { ownerUserId: SUPER_TENANT_ID },
      orderBy: [{ role: 'asc' }, { invitedAt: 'desc' }],
    })
    return rows.map(rowFromDb)
  }),

  invite: superAdminProcedure.input(inviteTeamMemberInput).mutation(async ({ ctx, input }) => {
    assertCan(ctx.user?.role, 'team.invite')

    // Duplicate guard
    const existing = await ctx.prisma.teamMember.findUnique({
      where: { ownerUserId_email: { ownerUserId: SUPER_TENANT_ID, email: input.email } },
    })
    if (existing && !existing.revokedAt) {
      throw new TRPCError({
        code: 'CONFLICT',
        message: '该邮箱已经被邀请，请先撤销旧邀请。',
      })
    }

    // Re-invite revoked member by clearing revokedAt + bumping invitedAt.
    const member = existing
      ? await ctx.prisma.teamMember.update({
          where: { id: existing.id },
          data: {
            role: input.role,
            invitedAt: new Date(),
            acceptedAt: null,
            revokedAt: null,
            invitedBy: ctx.user?.id ?? null,
          },
        })
      : await ctx.prisma.teamMember.create({
          data: {
            ownerUserId: SUPER_TENANT_ID,
            email: input.email,
            role: input.role,
            invitedBy: ctx.user?.id ?? null,
          },
        })

    // Best-effort email — failures don't block the invite (we'll see them
    // in the AuditLog and can resend).
    const email = (ctx as { email?: { sendTeamInvite: (m: typeof member) => Promise<unknown> } })
      .email
    if (email && typeof email.sendTeamInvite === 'function') {
      try {
        await email.sendTeamInvite(member)
      } catch (err) {
        // eslint-disable-next-line no-console -- Sentry wired by W3.
        console.error('[super/team] sendTeamInvite failed', member.email, err)
      }
    }

    await recordAudit(ctx, {
      action: SUPER_ACTIONS.TEAM_INVITE,
      targetType: 'team_member',
      targetId: member.id,
      after: { email: member.email, role: member.role },
    })

    return rowFromDb(member)
  }),

  updateRole: superAdminProcedure.input(updateTeamRoleInput).mutation(async ({ ctx, input }) => {
    assertCan(ctx.user?.role, 'team.role.change')
    const before = await ctx.prisma.teamMember.findUnique({
      where: { id: input.memberId },
    })
    if (!before || before.ownerUserId !== SUPER_TENANT_ID) {
      throw new TRPCError({ code: 'NOT_FOUND' })
    }
    if (before.role === 'OWNER') {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'OWNER role cannot be changed — transfer ownership first.',
      })
    }
    const after = await ctx.prisma.teamMember.update({
      where: { id: input.memberId },
      data: { role: input.role },
    })
    await recordAudit(ctx, {
      action: SUPER_ACTIONS.TEAM_ROLE_CHANGE,
      targetType: 'team_member',
      targetId: input.memberId,
      before: { role: before.role },
      after: { role: after.role },
    })
    return rowFromDb(after)
  }),

  remove: superAdminProcedure.input(userIdInput).mutation(async ({ ctx, input }) => {
    assertCan(ctx.user?.role, 'team.remove')
    const before = await ctx.prisma.teamMember.findUnique({ where: { id: input.userId } })
    if (!before || before.ownerUserId !== SUPER_TENANT_ID) {
      throw new TRPCError({ code: 'NOT_FOUND' })
    }
    if (before.role === 'OWNER') {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'OWNER cannot be removed — transfer ownership first.',
      })
    }
    // Soft-revoke instead of hard-delete so the AuditLog stays meaningful.
    await ctx.prisma.teamMember.update({
      where: { id: input.userId },
      data: { revokedAt: new Date() },
    })
    await recordAudit(ctx, {
      action: SUPER_ACTIONS.TEAM_REMOVE,
      targetType: 'team_member',
      targetId: input.userId,
      before: { email: before.email, role: before.role },
      after: { revokedAt: new Date().toISOString() },
    })
    return { ok: true as const }
  }),
})

export type SuperTeamRouter = typeof superTeamRouter
