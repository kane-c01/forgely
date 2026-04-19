/**
 * /super > Audit Log tRPC sub-router. ADMIN+.
 */

// `../../trpc` is provided by W3 / T06.
import { router, superAdminProcedure } from '../../trpc'
import { assertCan } from './_acl'
import { auditQueryInput } from './_schemas'

export const superAuditRouter = router({
  list: superAdminProcedure.input(auditQueryInput).query(async ({ ctx, input }) => {
    assertCan(ctx.session.role, 'audit.read')

    const where: Record<string, unknown> = {}
    if (input.actorId) where.actorId = input.actorId
    if (input.actorType) where.actorType = input.actorType
    if (input.action) where.action = input.action
    if (input.targetType) where.targetType = input.targetType
    if (input.targetId) where.targetId = input.targetId
    if (input.fromDate || input.toDate) {
      where.createdAt = {
        ...(input.fromDate ? { gte: new Date(input.fromDate) } : {}),
        ...(input.toDate ? { lt: new Date(new Date(input.toDate).getTime() + 86_400_000) } : {}),
      }
    }
    if (input.search) {
      where.OR = [
        { action: { contains: input.search, mode: 'insensitive' } },
        { reason: { contains: input.search, mode: 'insensitive' } },
        { targetId: { contains: input.search, mode: 'insensitive' } },
      ]
    }

    const [rows, total] = await Promise.all([
      ctx.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (input.page - 1) * input.pageSize,
        take: input.pageSize,
      }),
      ctx.prisma.auditLog.count({ where }),
    ])
    return { rows, total, page: input.page, pageSize: input.pageSize }
  }),

  exportCsv: superAdminProcedure.input(auditQueryInput).mutation(async ({ ctx, input }) => {
    assertCan(ctx.session.role, 'audit.read')
    // We hand off to the worker so the request returns immediately and the
    // CSV is delivered via signed R2 URL once the cursor finishes.
    const job = await ctx.queue.enqueue('audit.exportCsv', {
      filter: input,
      requestedBy: ctx.session.userId,
    })
    return { jobId: job.id, status: 'queued' as const }
  }),
})

export type SuperAuditRouter = typeof superAuditRouter
