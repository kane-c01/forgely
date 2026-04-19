import { describe, expect, it } from 'vitest'

import { InMemoryRuleStore, type ScraperRule } from './rule-store.js'

function makeRule(rate = 0.8): ScraperRule {
  return {
    hostname: 'example.com',
    selectors: { productCard: '.card' },
    successRate: rate,
    lastUsedAt: new Date(),
    createdAt: new Date(),
  }
}

describe('InMemoryRuleStore', () => {
  it('save → findByHostname round-trips', async () => {
    const store = new InMemoryRuleStore()
    await store.save(makeRule())
    const found = await store.findByHostname('example.com')
    expect(found?.successRate).toBeCloseTo(0.8)
  })

  it('returns null on miss', async () => {
    const store = new InMemoryRuleStore()
    expect(await store.findByHostname('missing')).toBeNull()
  })

  it('markSuccess bumps within [0,1]', async () => {
    const store = new InMemoryRuleStore()
    await store.save(makeRule(0.99))
    await store.markSuccess('example.com')
    const after = await store.findByHostname('example.com')
    expect(after?.successRate).toBeCloseTo(1)
  })

  it('markFailure penalises within [0,1]', async () => {
    const store = new InMemoryRuleStore()
    await store.save(makeRule(0.04))
    await store.markFailure('example.com')
    const after = await store.findByHostname('example.com')
    expect(after?.successRate).toBe(0)
  })

  it('mark{Success,Failure} are no-ops on missing rule', async () => {
    const store = new InMemoryRuleStore()
    await store.markSuccess('missing')
    await store.markFailure('missing')
    expect(store.size()).toBe(0)
  })
})
