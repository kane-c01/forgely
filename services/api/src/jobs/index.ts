/**
 * services/api jobs — cron tasks + queue dispatchers.
 *
 * These are imported by the conversation router (`commit` mutation)
 * and by the long-lived cron host (`services/worker` schedules them).
 *
 * Source: docs/MASTER.md §13 (12-step pipeline) + §25 (credits monthly reset).
 *
 * @owner W1 — Sprint 3
 */
import { enqueueGeneration } from '@forgely/worker/queue'

import { prisma } from '../db.js'
import { ForgelyError } from '../errors.js'

export interface DispatchGenerationOptions {
  generationId: string
  siteId: string
  subdomain: string
  brandName: string
  pipelineInput: Parameters<typeof enqueueGeneration>[0]
}

/** Push the pipeline job to BullMQ + flip Site to `generating`. */
export async function dispatchGeneration(opts: DispatchGenerationOptions): Promise<{ jobId: string }> {
  await prisma.site.update({
    where: { id: opts.siteId },
    data: { status: 'generating' },
  })
  await prisma.generation.update({
    where: { id: opts.generationId },
    data: { status: 'running' },
  })
  try {
    const jobId = await enqueueGeneration(opts.pipelineInput, { generationId: opts.generationId })
    return { jobId }
  } catch (err) {
    await prisma.generation.update({
      where: { id: opts.generationId },
      data: { status: 'failed', errorMessage: (err as Error).message },
    })
    throw new ForgelyError(
      'INTERNAL_ERROR',
      `生成排队失败：${(err as Error).message}`,
      500,
    )
  }
}

/** Cron — runs once per month at 00:01 UTC on the 1st. */
export async function monthlyCreditReset(now: Date = new Date()): Promise<{ updated: number }> {
  // Subscriptions whose plan grants monthly credits.
  const subs = await prisma.subscription.findMany({
    where: { status: 'active' },
    select: { userId: true, plan: true },
  })
  const ALLOTMENT: Record<string, number> = {
    starter: 1_500,
    pro: 6_000,
    agency: 25_000,
    enterprise: 100_000,
  }
  let updated = 0
  for (const sub of subs) {
    const credits = ALLOTMENT[sub.plan]
    if (!credits) continue
    await prisma.userCredits.update({
      where: { userId: sub.userId },
      data: {
        balance: { increment: credits },
        lifetimeEarned: { increment: credits },
        updatedAt: now,
      },
    })
    await prisma.creditTransaction.create({
      data: {
        userId: sub.userId,
        type: 'subscription',
        amount: credits,
        balance: credits, // approximation — UI re-reads from UserCredits.balance
        description: `Monthly ${sub.plan} subscription credit`,
        metadata: { plan: sub.plan, cycle: now.toISOString().slice(0, 7) },
      },
    })
    updated += 1
  }
  return { updated }
}

/** Cron — clean up expired phone OTPs (older than 24h). */
export async function purgeExpiredOtps(now: Date = new Date()): Promise<{ deleted: number }> {
  const cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const result = await prisma.phoneOtp.deleteMany({
    where: { OR: [{ consumedAt: { not: null } }, { expiresAt: { lt: cutoff } }] },
  })
  return { deleted: result.count }
}

/** Cron — release credit reservations that exceeded their TTL (30 min). */
export async function releaseStaleReservations(now: Date = new Date()): Promise<{ released: number }> {
  const cutoff = new Date(now.getTime() - 30 * 60 * 1000)
  const stale = await prisma.creditReservation.findMany({
    where: { state: 'reserved', createdAt: { lt: cutoff } },
    select: { id: true, userId: true, amount: true },
  })
  let released = 0
  for (const r of stale) {
    await prisma.$transaction([
      prisma.userCredits.update({
        where: { userId: r.userId },
        data: { balance: { increment: r.amount }, reserved: { decrement: r.amount } },
      }),
      prisma.creditReservation.update({
        where: { id: r.id },
        data: { state: 'expired' },
      }),
    ])
    released += 1
  }
  return { released }
}
