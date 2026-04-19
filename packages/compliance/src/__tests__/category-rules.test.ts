import { describe, expect, it } from 'vitest'
import { runRules, type ComplianceContent } from '../index.js'

const base: Omit<ComplianceContent, 'items' | 'category'> = {
  siteId: 'site_test',
  regions: ['US-FTC', 'US-FDA', 'GLOBAL', 'US-CPSIA', 'EU-CE'],
  locale: 'en',
}

describe('children category rules', () => {
  it('flags magnetic toy without ingestion warning', () => {
    const r = runRules({
      ...base,
      category: 'children',
      items: [
        {
          path: 'product.toy.description',
          type: 'product-description',
          text: 'A fun magnetic block set for ages 6+. Great for STEM learning.',
        },
      ],
    })
    expect(r.findings.some((f) => f.rule === 'category.children.magnet-hazard')).toBe(true)
  })

  it('does not flag when ingestion warning present', () => {
    const r = runRules({
      ...base,
      category: 'children',
      items: [
        {
          path: 'product.toy.description',
          type: 'product-description',
          text:
            'A magnetic block set for ages 6+. WARNING: Contains small magnets. Swallowed magnets can cause serious injury — seek medical attention if magnets are swallowed.',
        },
      ],
    })
    expect(r.findings.some((f) => f.rule === 'category.children.magnet-hazard')).toBe(false)
  })
})

describe('medical-device category rules', () => {
  it('warns when classification missing', () => {
    const r = runRules({
      ...base,
      category: 'medical-device',
      items: [
        {
          path: 'product.tens.description',
          type: 'product-description',
          text: 'A handheld TENS unit for muscle relaxation.',
        },
      ],
    })
    expect(r.findings.some((f) => f.rule === 'category.medical-device.classification-missing')).toBe(true)
  })

  it('flags overreaching diagnostic claim', () => {
    const r = runRules({
      ...base,
      category: 'medical-device',
      items: [
        {
          path: 'product.x.claim',
          type: 'product-claim',
          text: 'Our pulse oximeter detects cancer in just minutes — replaces your doctor.',
        },
      ],
    })
    const ids = r.findings.map((f) => f.rule)
    expect(ids).toContain('category.medical-device.diagnostic-claim-overreach')
  })
})

describe('electronics category rules', () => {
  it('flags wireless device without FCC disclosure', () => {
    const r = runRules({
      ...base,
      category: 'electronics',
      items: [
        {
          path: 'product.speaker.description',
          type: 'product-description',
          text: 'A bluetooth speaker with a 5,000mAh rechargeable battery.',
        },
      ],
    })
    const ids = r.findings.map((f) => f.rule)
    expect(ids).toContain('category.electronics.fcc-disclosure-missing')
    expect(ids).toContain('category.electronics.lithium-battery-warning')
  })

  it('does not flag FCC when ID present', () => {
    const r = runRules({
      ...base,
      category: 'electronics',
      items: [
        {
          path: 'product.speaker.description',
          type: 'product-description',
          text:
            'A bluetooth speaker. FCC ID: ABC123 · This device complies with Part 15 of the FCC Rules. Do not puncture the lithium battery.',
        },
      ],
    })
    expect(r.findings.some((f) => f.rule === 'category.electronics.fcc-disclosure-missing')).toBe(false)
  })
})
