import { describe, expect, it } from 'vitest'
import { applyAutoFix, runRules } from '../index.js'

describe('autoFix', () => {
  it('appends FDA disclaimer when supplement description is missing one', () => {
    const items = [
      {
        path: 'product.123.description',
        type: 'product-description' as const,
        text: 'This blend supports a healthy stress response.',
      },
    ]
    const report = runRules({
      siteId: 's',
      regions: ['US-FDA', 'GLOBAL'],
      category: 'supplements',
      items,
    })
    const fix = applyAutoFix(items, report)
    const patched = fix.patchedItems[0]
    expect(patched?.text).toMatch(/These statements have not been evaluated/i)
    expect(fix.patches.length).toBe(1)
  })

  it('does not modify items that have no autoFixable findings', () => {
    const items = [
      {
        path: 'product.x.description',
        type: 'product-description' as const,
        text: 'A small piece of art for your wall, with a beautiful matte finish.',
      },
    ]
    const report = runRules({
      siteId: 's',
      regions: ['UK-ASA'],
      category: 'general',
      items,
    })
    const fix = applyAutoFix(items, report)
    expect(fix.patchedItems[0]?.text).toBe(items[0]?.text)
    expect(fix.patches.length).toBe(0)
  })

  it('returns notFixedFindings for everything that needs LLM', () => {
    const items = [
      {
        path: 'p.1.desc',
        type: 'product-description' as const,
        text: 'Cures arthritis. 100% safe.',
      },
    ]
    const report = runRules({
      siteId: 's',
      regions: ['US-FDA', 'GLOBAL'],
      category: 'supplements',
      items,
    })
    const fix = applyAutoFix(items, report)
    expect(fix.notFixedFindings.length).toBeGreaterThan(0)
    expect(
      fix.notFixedFindings.some((f) => f.rule === 'us-fda.health-claim.treat-cure-prevent'),
    ).toBe(true)
  })
})
