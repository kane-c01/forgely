/**
 * /super > Team tRPC sub-router. OWNER only.
 */

// `../../trpc` is provided by W3 / T06.
import { router, superAdminProcedure } from '../../trpc'
import { TRPCError } from '@trpc/server'
import { assertCan } from './_acl'
import { recordAudit, SUPER_ACTIONS } from './_audit-log'
import { inviteTeamMemberInput, updateTeamRoleInput, userIdInput } from './_schemas'

export const superTeamRouter = router({
  list: superAdminProcedure.query(async ({ ctx }) => {
    assertCan(ctx.session.role, 'team.read')
    return ctx.prisma.teamMember.findMany({
      orderBy: [{ role: 'asc' }, { invitedAt: 'desc' }],
    })
  }),

  invite: superAdminProcedure.input(inviteTeamMemberInput).mutation(async ({ ctx, input }) => {
    assertCan(ctx.session.role, 'team.invite')
    const existing = await ctx.prisma.teamMember.findUnique({ where: { email: input.email } })
    if (existing) {
      throw new TRPCError({ code: 'CONFLICT', message: 'A member with this email already exists' })
    }
    const member = await ctx.prisma.teamMember.create({
      data: {
        email: input.email,
        role: input.role,
        invitedAt: new Date(),
      },
    })
    await ctx.email.sendTeamInvite(member)
    await recordAudit(ctx, {
      action: SUPER_ACTIONS.TEAM_INVITE,
      targetType: 'team_member',
      targetId: member.id,
      after: { email: member.email, role: member.role },
    })
    return member
  }),

  updateRole: superAdminProcedure.input(updateTeamRoleInput).mutation(async ({ ctx, input }) => {
    assertCan(ctx.session.role, 'team.role.change')
    const before = await ctx.prisma.teamMember.findUnique({ where: { id: input.memberId } })
    if (!before) throw new TRPCError({ code: 'NOT_FOUND' })
    if (before.role === 'OWNER') {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'Cannot demote the OWNER' })
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
    return after
  }),

  remove: superAdminProcedure.input(userIdInput).mutation(async ({ ctx, input }) => {
    assertCan(ctx.session.role, 'team.remove')
    const before = await ctx.prisma.teamMember.findUnique({ where: { id: input.userId } })
    if (!before) throw new TRPCError({ code: 'NOT_FOUND' })
    if (before.role === 'OWNER') {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'OWNER cannot be removed' })
    }
    await ctx.prisma.teamMember.delete({ where: { id: input.userId } })
    await recordAudit(ctx, {
      action: SUPER_ACTIONS.TEAM_REMOVE,
      targetType: 'team_member',
      targetId: input.userId,
      before: { email: before.email, role: before.role },
    })
    return { ok: true as const }
  }),
})

export type SuperTeamRouter = typeof superTeamRouter
