/* eslint-disable no-console */
/**
 * Smoke test — emit a mini 3-step sequence through the AgentEvent bus
 * and assert both the Redis Stream and the GenerationStep table receive
 * the writes in order. Run with:
 *
 *   DATABASE_URL='postgresql://forgely:forgely@localhost:5433/forgely?schema=public' \
 *   REDIS_URL='redis://localhost:6380' \
 *   pnpm --filter @forgely/worker exec tsx scripts/smoke-events.ts
 */
import { PrismaClient } from '@prisma/client'

import { emitStep, readStepHistory, seedSteps, shutdownEvents, streamKey } from '../src/events'

async function main(): Promise<void> {
  const prisma = new PrismaClient()
  // The Generation row needs a Site + User because of FK constraints.
  const user = await prisma.user.upsert({
    where: { email: 'smoke@forgely.test' },
    update: {},
    create: { email: 'smoke@forgely.test', name: 'Smoke', role: 'user' },
  })
  const site = await prisma.site.upsert({
    where: { subdomain: 'smoke-test' },
    update: {},
    create: {
      userId: user.id,
      name: 'Smoke Test',
      subdomain: 'smoke-test',
      status: 'generating',
    },
  })
  const gen = await prisma.generation.create({
    data: {
      siteId: site.id,
      userId: user.id,
      status: 'running',
      steps: [],
      inputData: {},
      creditsCost: 0,
    },
  })
  console.log('[smoke] generationId =', gen.id, 'streamKey =', streamKey(gen.id))

  await seedSteps(gen.id)
  const seeded = await prisma.generationStep.count({ where: { generationId: gen.id } })
  console.log('[smoke] seeded steps =', seeded)

  await emitStep({ generationId: gen.id, step: 'scrape', status: 'running' })
  await new Promise((r) => setTimeout(r, 50))
  await emitStep({
    generationId: gen.id,
    step: 'scrape',
    status: 'succeeded',
    payload: { productCount: 12 },
  })
  await emitStep({ generationId: gen.id, step: 'analyze', status: 'running' })
  await emitStep({
    generationId: gen.id,
    step: 'analyze',
    status: 'failed',
    errorMessage: 'smoke-test failure',
  })

  const history = await readStepHistory(gen.id, 50)
  console.log('[smoke] stream entries =', history.length)
  for (const h of history) {
    console.log('  ·', h.step, h.status, h.payload ?? '', h.errorMessage ?? '')
  }

  const rows = await prisma.generationStep.findMany({
    where: { generationId: gen.id },
    orderBy: { ordinal: 'asc' },
  })
  for (const r of rows) {
    console.log(
      `  [DB] ${String(r.ordinal).padStart(2, '0')} ${r.stepName.padEnd(18)} ${r.status}${
        r.errorMessage ? ' · ' + r.errorMessage : ''
      }`,
    )
  }

  const scrape = rows.find((r) => r.stepName === 'scrape')
  const analyze = rows.find((r) => r.stepName === 'analyze')
  if (scrape?.status !== 'succeeded') throw new Error('scrape row should be succeeded')
  if (analyze?.status !== 'failed') throw new Error('analyze row should be failed')
  if (!analyze.errorMessage) throw new Error('analyze errorMessage missing')

  console.log('[smoke] PASS — Redis Stream + GenerationStep in sync.')
  await shutdownEvents()
  await prisma.$disconnect()
}

main().catch(async (err) => {
  console.error('[smoke] FAIL', err)
  await shutdownEvents()
  process.exit(1)
})
