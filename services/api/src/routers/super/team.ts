/**
 * /super > Team tRPC sub-router. OWNER only.
 *
 * Currently a stub — the underlying TeamMember Prisma model and the
 * email integration land alongside the dedicated organization-roles
 * Task. Each procedure responds with `NOT_IMPLEMENTED` so the router
 * tree compiles and the UI can show "coming soon".
 */
import { TRPCError } from '@trpc/server'

import { router, superAdminProcedure } from '../../router/trpc.js'
import { inviteTeamMemberInput, updateTeamRoleInput, userIdInput } from './_schemas'

const NOT_IMPLEMENTED = (): never => {
  throw new TRPCError({
    code: 'METHOD_NOT_SUPPORTED',
    message: '内部团队管理还在搭建中 — 请稍后再试。',
  })
}

export const superTeamRouter = router({
  list: superAdminProcedure.query(async () => {
    return [] as Array<{
      id: string
      email: string
      role: 'OWNER' | 'ADMIN' | 'SUPPORT'
      invitedAt: Date
    }>
  }),

  invite: superAdminProcedure
    .input(inviteTeamMemberInput)
    .mutation(async () => NOT_IMPLEMENTED()),

  updateRole: superAdminProcedure
    .input(updateTeamRoleInput)
    .mutation(async () => NOT_IMPLEMENTED()),

  remove: superAdminProcedure
    .input(userIdInput)
    .mutation(async () => NOT_IMPLEMENTED()),
})

export type SuperTeamRouter = typeof superTeamRouter
