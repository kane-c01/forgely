/**
 * /super > Audit Log tRPC sub-router. ADMIN+.
 */

import type { Prisma } from '@prisma/client'

import { router, superAdminProcedure } from '../../router/trpc.js'
import { assertCan } from './_acl.js'
import { auditQueryInput } from './_schemas.js'

export const superAuditRouter = router({
  list: superAdminProcedure.input(auditQueryInput).query(async ({ ctx, input }) => {
    assertCan(ctx.user?.role ?? 'support', 'audit.read')

    const where: Prisma.AuditLogWhereInput = {}
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

  /**
   * Inline CSV export — fits Cloudflare's 100 MB request budget for
   * any plausible audit window. A queued / signed-URL variant lands
   * with the BullMQ worker.
   */
  exportCsv: superAdminProcedure.input(auditQueryInput).mutation(async ({ ctx, input }) => {
    assertCan(ctx.user?.role ?? 'support', 'audit.read')
    const where: Prisma.AuditLogWhereInput = {}
    if (input.actorId) where.actorId = input.actorId
    if (input.actorType) where.actorType = input.actorType
    if (input.action) where.action = input.action
    const rows = await ctx.prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 5000,
    })
    const header = [
      'id',
      'actorType',
      'actorId',
      'action',
      'targetType',
      'targetId',
      'reason',
      'ipAddress',
      'createdAt',
    ]
    const csv = [
      header.join(','),
      ...rows.map((r) =>
        header
          .map((k) => {
            const v = (r as unknown as Record<string, unknown>)[k]
            return JSON.stringify(v ?? '').replace(/^"|"$/g, '')
          })
          .map((v) => (v.includes(',') || v.includes('\n') ? `"${v.replace(/"/g, '""')}"` : v))
          .join(','),
      ),
    ].join('\n')
    return { filename: `audit-${Date.now()}.csv`, csv }
  }),
})

export type SuperAuditRouter = typeof superAuditRouter
