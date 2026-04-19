/**
 * /super > Plugins tRPC sub-router. ADMIN+.
 *
 * V2 sub-module: surfaces every `InstalledPlugin` row across the platform
 * for moderation. The plugin marketplace itself (developer uploads + auto
 * scan) is on the V2 roadmap (docs/MASTER.md §20.4).
 *
 * Each plugin id is aggregated so reviewers see one row per (pluginId,
 * version) instead of one row per site install.
 */
import { TRPCError } from '@trpc/server'

import { router, superAdminProcedure } from '../../router/trpc.js'
import { assertCan } from './_acl.js'
import { recordAudit } from './_audit-log.js'
import { z } from 'zod'

import { paginationSchema, reviewPluginInput } from './_schemas.js'

const pluginInstallsInput = paginationSchema.extend({
  pluginId: z.string().min(1),
})

interface PluginAggregateRow {
  pluginId: string
  version: string
  installs: number
  enabled: number
  /** Earliest install across the network. */
  firstInstalledAt: Date
  /** Most recent update across the network. */
  lastUpdatedAt: Date
}

/**
 * Stand-in moderation status. We don't yet have a `PluginReview` table —
 * for now decisions live in AuditLog. A future migration will promote
 * the latest decision per pluginId into a dedicated table.
 */
async function lastReviewDecision(
  prisma: { auditLog: { findFirst: (args: unknown) => Promise<{ after: unknown } | null> } },
  pluginId: string,
): Promise<'approve' | 'reject' | 'pending'> {
  const row = await prisma.auditLog.findFirst({
    where: { action: { startsWith: 'plugin.review.' }, targetId: pluginId },
    orderBy: { createdAt: 'desc' },
  } as unknown)
  if (!row) return 'pending'
  const after = (row.after ?? {}) as { decision?: string }
  if (after.decision === 'approve' || after.decision === 'reject') return after.decision
  return 'pending'
}

export const superPluginsRouter = router({
  list: superAdminProcedure.input(paginationSchema).query(async ({ ctx, input }) => {
    assertCan(ctx.user?.role, 'plugins.read')
    const installs = await ctx.prisma.installedPlugin.findMany({
      orderBy: { installedAt: 'asc' },
    })

    const grouped = new Map<string, PluginAggregateRow>()
    for (const inst of installs) {
      const key = `${inst.pluginId}@${inst.version}`
      const row = grouped.get(key)
      if (row) {
        row.installs += 1
        if (inst.enabled) row.enabled += 1
        if (inst.installedAt < row.firstInstalledAt) row.firstInstalledAt = inst.installedAt
        if (inst.updatedAt > row.lastUpdatedAt) row.lastUpdatedAt = inst.updatedAt
      } else {
        grouped.set(key, {
          pluginId: inst.pluginId,
          version: inst.version,
          installs: 1,
          enabled: inst.enabled ? 1 : 0,
          firstInstalledAt: inst.installedAt,
          lastUpdatedAt: inst.updatedAt,
        })
      }
    }

    const all = [...grouped.values()].sort((a, b) => b.installs - a.installs)
    const total = all.length
    const start = (input.page - 1) * input.pageSize
    const items = await Promise.all(
      all.slice(start, start + input.pageSize).map(async (row) => ({
        ...row,
        decision: await lastReviewDecision(
          ctx.prisma as unknown as Parameters<typeof lastReviewDecision>[0],
          row.pluginId,
        ),
      })),
    )

    return { items, total, page: input.page, pageSize: input.pageSize }
  }),

  installs: superAdminProcedure.input(pluginInstallsInput).query(async ({ ctx, input }) => {
    assertCan(ctx.user?.role, 'plugins.read')
    const where = { pluginId: input.pluginId }
    const [items, total] = await Promise.all([
      ctx.prisma.installedPlugin.findMany({
        where,
        orderBy: { installedAt: 'desc' },
        skip: (input.page - 1) * input.pageSize,
        take: input.pageSize,
        include: { site: { select: { id: true, name: true, slug: true } } },
      }),
      ctx.prisma.installedPlugin.count({ where }),
    ])
    return { items, total, page: input.page, pageSize: input.pageSize }
  }),

  review: superAdminProcedure.input(reviewPluginInput).mutation(async ({ ctx, input }) => {
    assertCan(ctx.user?.role, 'plugins.review')
    const action = `plugin.review.${input.decision}`
    await recordAudit(ctx, {
      action,
      targetType: 'plugin',
      targetId: input.pluginId,
      after: { decision: input.decision, notes: input.notes ?? null },
    })

    if (input.decision === 'reject') {
      // Disable every install of the rejected plugin across the network.
      const updated = await ctx.prisma.installedPlugin.updateMany({
        where: { pluginId: input.pluginId },
        data: { enabled: false },
      })
      return { ok: true as const, decision: input.decision, disabledInstalls: updated.count }
    }
    return { ok: true as const, decision: input.decision, disabledInstalls: 0 }
  }),

  /**
   * Marketplace developer uploads — V2 stub. Returns NOT_IMPLEMENTED so
   * the route exists in the type tree.
   */
  marketplaceListings: superAdminProcedure.query(() => {
    throw new TRPCError({
      code: 'NOT_IMPLEMENTED',
      message: 'Marketplace developer uploads land in V2 (docs/MASTER.md §20.4).',
    })
  }),
})

export type SuperPluginsRouter = typeof superPluginsRouter
