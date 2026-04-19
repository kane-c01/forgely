import { describe, expect, it } from 'vitest'

import { PrismaRuleStore, type PrismaScraperRuleRow } from './prisma-rule-store.js'
import type { ScraperRule } from './rule-store.js'

function makeFakePrisma(initial?: PrismaScraperRuleRow) {
  let row: PrismaScraperRuleRow | null = initial ?? null
  return {
    client: {
      scraperRule: {
        async findUnique() {
          return row
        },
        async upsert(args: {
          where: { hostname: string }
          create: PrismaScraperRuleRow
          update: Partial<PrismaScraperRuleRow>
        }) {
          if (row && row.hostname === args.where.hostname) {
            row = { ...row, ...args.update }
          } else {
            row = { ...args.create }
          }
          return row
        },
        async update(args: { where: { hostname: string }; data: Partial<PrismaScraperRuleRow> }) {
          if (!row || row.hostname !== args.where.hostname) {
            throw new Error('record not found')
          }
          row = { ...row, ...args.data }
          return row
        },
      },
    },
    current: () => row,
  }
}

const sampleRule: ScraperRule = {
  hostname: 'example.com',
  selectors: { productCard: '.card' },
  successRate: 0.85,
  lastUsedAt: new Date('2026-04-19T18:00:00Z'),
  createdAt: new Date('2026-04-19T18:00:00Z'),
}

describe('PrismaRuleStore', () => {
  it('returns null on miss', async () => {
    const fake = makeFakePrisma()
    const store = new PrismaRuleStore({ client: fake.client })
    expect(await store.findByHostname('missing')).toBeNull()
  })

  it('upserts and reads back a rule', async () => {
    const fake = makeFakePrisma()
    const store = new PrismaRuleStore({ client: fake.client })
    await store.save(sampleRule)
    const found = await store.findByHostname('example.com')
    expect(found?.selectors).toEqual({ productCard: '.card' })
    expect(found?.successRate).toBeCloseTo(0.85)
  })

  it('clamps successRate to 0..1 on save', async () => {
    const fake = makeFakePrisma()
    const store = new PrismaRuleStore({ client: fake.client })
    await store.save({ ...sampleRule, successRate: 1.5 })
    const after = await store.findByHostname('example.com')
    expect(after?.successRate).toBe(1)
  })

  it('markSuccess bumps the rate', async () => {
    const initial: PrismaScraperRuleRow = {
      hostname: 'example.com',
      selectors: { productCard: '.card' },
      successRate: 0.8,
      lastUsedAt: new Date(),
      createdAt: new Date(),
    }
    const fake = makeFakePrisma(initial)
    const store = new PrismaRuleStore({ client: fake.client })
    await store.markSuccess('example.com')
    expect(fake.current()?.successRate).toBeCloseTo(0.82)
  })

  it('markFailure penalises the rate', async () => {
    const initial: PrismaScraperRuleRow = {
      hostname: 'example.com',
      selectors: { productCard: '.card' },
      successRate: 0.8,
      lastUsedAt: new Date(),
      createdAt: new Date(),
    }
    const fake = makeFakePrisma(initial)
    const store = new PrismaRuleStore({ client: fake.client })
    await store.markFailure('example.com')
    expect(fake.current()?.successRate).toBeCloseTo(0.75)
  })

  it('mark{Success,Failure} are no-ops when no row exists', async () => {
    const fake = makeFakePrisma()
    const store = new PrismaRuleStore({ client: fake.client })
    await store.markSuccess('missing')
    await store.markFailure('missing')
    expect(fake.current()).toBeNull()
  })

  it('respects custom deltas', async () => {
    const initial: PrismaScraperRuleRow = {
      hostname: 'example.com',
      selectors: { productCard: '.card' },
      successRate: 0.5,
      lastUsedAt: new Date(),
      createdAt: new Date(),
    }
    const fake = makeFakePrisma(initial)
    const store = new PrismaRuleStore({
      client: fake.client,
      successDelta: 0.1,
      failureDelta: 0.2,
    })
    await store.markSuccess('example.com')
    expect(fake.current()?.successRate).toBeCloseTo(0.6)
    await store.markFailure('example.com')
    expect(fake.current()?.successRate).toBeCloseTo(0.4)
  })
})
