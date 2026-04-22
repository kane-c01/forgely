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

import type { Prisma } from '@prisma/client'
import { z } from 'zod'

import { recordAudit } from '../auth/audit.js'
import { assertFoundAndOwned, ownedScopeWhere } from '../auth/index.js'
import { releaseReservation, reserveCredits } from '../credits/index.js'
import { errors } from '../errors.js'

import { protectedProcedure, router } from '../router/trpc.js'

import { IdSchema, PaginationInput, paginate } from './_shared.js'

const StartInput = z.object({
  siteId: IdSchema,
  /** video | 3d — see docs/MASTER.md §13. Cost defaults to 900 (video) or 1200 (3d). */
  format: z.enum(['video', '3d']).default('video'),
  /** Optional cost override (e.g. mini-regenerate of one Moment). */
  creditsCost: z.number().int().min(20).max(2000).optional(),
  inputData: z.record(z.unknown()).optional(),
})

const VIDEO_DEFAULT_COST = 900
const THREE_D_DEFAULT_COST = 1_200

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
   * Full snapshot (generation + all GenerationStep rows) for the
   * generating page polling fallback. Also returns the generationId
   * matched by `siteId` for the UI to wire SSE after `conversation.commit`.
   */
  status: protectedProcedure.input(z.object({ id: IdSchema })).query(async ({ ctx, input }) => {
    const row = await ctx.prisma.generation.findUnique({
      where: { id: input.id },
      include: { stepRows: { orderBy: { ordinal: 'asc' } } },
    })
    const gen = assertFoundAndOwned(ctx, row, 'Generation')
    return {
      id: gen.id,
      siteId: gen.siteId,
      status: gen.status,
      startedAt: gen.startedAt,
      completedAt: gen.completedAt,
      errorMessage: gen.errorMessage,
      steps: gen.stepRows.map((s) => ({
        stepName: s.stepName,
        status: s.status,
        ordinal: s.ordinal,
        startedAt: s.startedAt,
        completedAt: s.completedAt,
        durationMs: s.durationMs,
        errorMessage: s.errorMessage,
        payload: s.payload,
      })),
    }
  }),

  /**
   * Find the most recent generation for a site so the UI can fetch the
   * real `generationId` after `conversation.commit` redirects to
   * `/sites/[siteId]/generating`.
   */
  latestForSite: protectedProcedure
    .input(z.object({ siteId: IdSchema }))
    .query(async ({ ctx, input }) => {
      const row = await ctx.prisma.generation.findFirst({
        where: { siteId: input.siteId, ...ownedScopeWhere(ctx) },
        orderBy: { createdAt: 'desc' },
        select: { id: true, status: true, siteId: true, createdAt: true },
      })
      return row
    }),

  /**
   * Re-enqueue a failed generation — preserves the `Generation` row and
   * resets all `GenerationStep` rows to `queued` so the UI restarts from
   * the top. The caller is responsible for deducting fresh credits if
   * business rules demand it (handled via `credits.reserve` from the UI).
   */
  retry: protectedProcedure.input(z.object({ id: IdSchema })).mutation(async ({ ctx, input }) => {
    const row = await ctx.prisma.generation.findUnique({
      where: { id: input.id },
      include: { site: { select: { id: true, subdomain: true } } },
    })
    const gen = assertFoundAndOwned(ctx, row, 'Generation')
    if (gen.status === 'running') {
      throw errors.validation('Generation is already running.')
    }
    await ctx.prisma.$transaction([
      ctx.prisma.generation.update({
        where: { id: gen.id },
        data: {
          status: 'pending',
          errorMessage: null,
          retryCount: { increment: 1 },
          completedAt: null,
        },
      }),
      ctx.prisma.generationStep.updateMany({
        where: { generationId: gen.id },
        data: {
          status: 'queued',
          errorMessage: null,
          startedAt: null,
          completedAt: null,
          durationMs: null,
        },
      }),
    ])
    await recordAudit({
      actorId: ctx.user.id,
      action: 'generation.retry',
      targetType: 'generation',
      targetId: gen.id,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    })
    // The worker layer (services/worker) listens for re-queue via
    // `dispatchGeneration`; we return to let the caller invoke
    // `conversation.commit`-style dispatch again from the UI if desired.
    return { id: gen.id, status: 'pending' as const }
  }),

  /**
   * Kick off a new generation.
   *
   * 1. Reserves the credit cost (idempotent rejection if balance / cap hit).
   * 2. Creates a `Generation` row in `pending` status pointing at the reservation.
   * 3. (Worker — T17) picks the row up via BullMQ poll. This endpoint
   *    deliberately does not enqueue here so we can swap the queue impl
   *    without touching the API surface.
   */
  start: protectedProcedure.input(StartInput).mutation(async ({ ctx, input }) => {
    const site = await ctx.prisma.site.findUnique({
      where: { id: input.siteId },
      select: { id: true, userId: true, status: true },
    })
    assertFoundAndOwned(ctx, site, 'Site')
    if (site!.status === 'generating') {
      throw errors.validation('A generation is already in progress for this site.')
    }

    const cost =
      input.creditsCost ?? (input.format === '3d' ? THREE_D_DEFAULT_COST : VIDEO_DEFAULT_COST)

    const reservation = await reserveCredits({
      userId: ctx.user.id,
      amount: cost,
      description: `Generation start (${input.format}) for site ${site!.id}`,
      metadata: { siteId: site!.id, format: input.format },
    })

    const generation = await ctx.prisma.generation.create({
      data: {
        siteId: site!.id,
        userId: ctx.user.id,
        status: 'pending',
        steps: [] as Prisma.InputJsonValue,
        inputData: (input.inputData ?? {}) as Prisma.InputJsonValue,
        creditsCost: cost,
        reservationId: reservation.reservationId,
      },
    })

    await ctx.prisma.site.update({
      where: { id: site!.id },
      data: { status: 'generating' },
    })

    await recordAudit({
      actorId: ctx.user.id,
      action: 'generation.start',
      targetType: 'site',
      targetId: site!.id,
      after: { generationId: generation.id, format: input.format, creditsCost: cost },
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    })

    return {
      generationId: generation.id,
      reservationId: reservation.reservationId,
      reservationExpiresAt: reservation.expiresAt,
      creditsCost: cost,
    }
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

      await ctx.prisma.site.update({
        where: { id: generation.siteId },
        data: { status: 'draft' },
      })

      await recordAudit({
        actorId: ctx.user.id,
        action: 'generation.cancel',
        targetType: 'generation',
        targetId: generation.id,
        reason: input.reason,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
      })

      return { id: generation.id, cancelledAt: new Date() }
    }),
})
