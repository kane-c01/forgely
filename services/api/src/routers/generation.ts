/**
 * `generation.*` router — read + cancel for the AI generation pipeline.
 *
 * `start` is intentionally NOT here: kicking off a generation requires
 * the AI orchestrator (W1 / packages/ai-agents) which runs in the worker
 * process, not in the request thread. apps/app fires `sites.generate(...)`
 * (W1's surface) and then subscribes here for status.
 *
 * @owner W3 (backend API for T18, W6)
 */

import { z } from 'zod'

import { assertFoundAndOwned, ownedScopeWhere } from '../auth/index.js'
import { releaseReservation } from '../credits/index.js'
import { errors } from '../errors.js'

import { protectedProcedure, router } from '../router/trpc.js'

import { IdSchema, PaginationInput, paginate } from './_shared.js'

const ListInput = PaginationInput.extend({
  siteId: IdSchema.optional(),
  status: z.enum(['pending', 'running', 'completed', 'failed', 'cancelled']).optional(),
})

export const generationRouter = router({
  list: protectedProcedure.input(ListInput.optional()).query(async ({ ctx, input }) => {
    const limit = input?.limit ?? 25
    const rows = await ctx.prisma.generation.findMany({
      where: {
        ...ownedScopeWhere(ctx),
        ...(input?.siteId ? { siteId: input.siteId } : {}),
        ...(input?.status ? { status: input.status } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(input?.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
    })
    return paginate(rows, limit)
  }),

  get: protectedProcedure.input(z.object({ id: IdSchema })).query(async ({ ctx, input }) => {
    const row = await ctx.prisma.generation.findUnique({ where: { id: input.id } })
    return assertFoundAndOwned(ctx, row, 'Generation')
  }),

  /**
   * Cancel a pending/running generation. Releases any held credit
   * reservation. The actual worker stop signal is delivered via Redis
   * pub/sub by the worker layer (T17) — this endpoint just records intent.
   */
  cancel: protectedProcedure
    .input(z.object({ id: IdSchema, reason: z.string().max(280).optional() }))
    .mutation(async ({ ctx, input }) => {
      const row = await ctx.prisma.generation.findUnique({ where: { id: input.id } })
      const generation = assertFoundAndOwned(ctx, row, 'Generation')
      if (generation.status !== 'pending' && generation.status !== 'running') {
        throw errors.validation(`Cannot cancel a generation in status "${generation.status}".`)
      }

      await ctx.prisma.generation.update({
        where: { id: generation.id },
        data: {
          status: 'cancelled',
          completedAt: new Date(),
          errorMessage: input.reason ?? 'Cancelled by user',
        },
      })

      if (generation.reservationId) {
        await releaseReservation(generation.reservationId, 'Generation cancelled by user').catch(
          () => undefined,
        )
      }

      return { id: generation.id, cancelledAt: new Date() }
    }),
})
