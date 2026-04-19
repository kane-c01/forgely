import { describe, expect, it } from 'vitest'
import { runRules, type ComplianceContent } from '../index.js'

const base: Omit<ComplianceContent, 'items'> = {
  siteId: 'site_test',
  regions: ['US-FTC', 'US-FDA', 'US-CA-PROP65', 'EU-GDPR', 'GLOBAL'],
  category: 'supplements',
  locale: 'en',
}

describe('rule engine — overall verdict', () => {
  it('passes when no findings', () => {
    const r = runRules({
      ...base,
      items: [
        {
          path: 'product.001.title',
          type: 'product-title',
          text: 'Calming Botanical Tea',
        },
      ],
    })
    expect(r.overall).toBe('pass')
    expect(r.mustFix).toBe(0)
    expect(r.shouldFix).toBe(0)
  })

  it('fails when a critical FDA disease claim is present', () => {
    const r = runRules({
      ...base,
      items: [
        {
          path: 'product.999.description',
          type: 'product-description',
          text: 'Our daily capsule will cure cancer in just two weeks.',
        },
      ],
    })
    expect(r.overall).toBe('fail')
    expect(r.mustFix).toBeGreaterThanOrEqual(1)
    expect(r.findings.some((f) => f.rule.startsWith('us-fda.health-claim'))).toBe(true)
  })

  it('warns when supplement description lacks FDA disclaimer', () => {
    const r = runRules({
      ...base,
      items: [
        {
          path: 'product.123.description',
          type: 'product-description',
          text: 'This blend supports a healthy stress response.',
        },
      ],
    })
    const ids = r.findings.map((f) => f.rule)
    expect(ids).toContain('us-fda.disclaimer.missing')
    expect(['warning', 'fail']).toContain(r.overall)
  })
})

describe('rule engine — generic rules', () => {
  it('flags absolute superlatives like "100% safe"', () => {
    const r = runRules({
      ...base,
      category: 'general',
      items: [
        {
          path: 'page.home.hero.headline',
          type: 'hero-headline',
          text: 'Our serum is 100% safe with zero side effects.',
        },
      ],
    })
    const found = r.findings.find((f) => f.rule === 'general.exaggeration.absolute')
    expect(found).toBeDefined()
    expect(found?.severity).toBe('warning')
  })

  it('flags greenwashing without proof in UK-ASA region', () => {
    const r = runRules({
      ...base,
      category: 'general',
      regions: ['UK-ASA'],
      items: [
        {
          path: 'page.home.hero.headline',
          type: 'hero-headline',
          text: 'Eco-friendly, planet-friendly, sustainable goodness.',
        },
      ],
    })
    expect(r.findings.some((f) => f.rule === 'uk-asa.green-claim.unspecified')).toBe(true)
  })
})

describe('rule engine — Prop 65', () => {
  it('flags lead without warning', () => {
    const r = runRules({
      ...base,
      category: 'cosmetics',
      regions: ['US-CA-PROP65'],
      items: [
        {
          path: 'product.lipstick.description',
          type: 'product-description',
          text: 'Our long-wear lipstick contains trace amounts of lead pigment.',
        },
      ],
    })
    expect(r.findings.some((f) => f.rule === 'us-ca-prop65.warning.missing')).toBe(true)
  })

  it('does not flag when warning present', () => {
    const r = runRules({
      ...base,
      category: 'cosmetics',
      regions: ['US-CA-PROP65'],
      items: [
        {
          path: 'product.lipstick.description',
          type: 'product-description',
          text:
            'Trace amounts of lead. WARNING: This product can expose you to chemicals known to the State of California to cause cancer.',
        },
      ],
    })
    expect(r.findings.some((f) => f.rule === 'us-ca-prop65.warning.missing')).toBe(false)
  })
})

describe('rule engine — children CPSIA', () => {
  it('warns when children product has no age range', () => {
    const r = runRules({
      ...base,
      category: 'children',
      regions: ['US-CPSIA'],
      items: [
        {
          path: 'product.toy.description',
          type: 'product-description',
          text: 'A wooden block set perfect for creative play.',
        },
      ],
    })
    expect(r.findings.some((f) => f.rule === 'us-cpsia.children.missing-age-label')).toBe(true)
  })
})

describe('rule engine — alcohol', () => {
  it('requires age warning', () => {
    const r = runRules({
      ...base,
      category: 'alcohol',
      regions: ['GLOBAL'],
      items: [
        {
          path: 'product.wine.description',
          type: 'product-description',
          text: 'A bold red wine from Napa Valley with rich tannins.',
        },
      ],
    })
    expect(r.findings.some((f) => f.rule === 'category.alcohol.age-warning-missing')).toBe(true)
  })

  it('flags health claim on alcohol', () => {
    const r = runRules({
      ...base,
      category: 'alcohol',
      regions: ['US-FTC', 'GLOBAL'],
      items: [
        {
          path: 'product.wine.description',
          type: 'product-description',
          text: 'Heart healthy red wine. 21+ — drink responsibly.',
        },
      ],
    })
    expect(r.findings.some((f) => f.rule === 'category.alcohol.health-claim')).toBe(true)
  })
})

describe('runRules options', () => {
  it('respects `only` option', () => {
    const r = runRules(
      {
        ...base,
        items: [
          {
            path: 'p.1.desc',
            type: 'product-description',
            text: '100% safe & cures diabetes.',
          },
        ],
      },
      { only: ['general.exaggeration.absolute'] },
    )
    const ids = r.findings.map((f) => f.rule)
    expect(ids).toContain('general.exaggeration.absolute')
    expect(ids).not.toContain('us-fda.health-claim.treat-cure-prevent')
  })

  it('respects `exclude` option', () => {
    const r = runRules(
      {
        ...base,
        items: [
          { path: 'p.1.desc', type: 'product-description', text: 'Cures cancer.' },
        ],
      },
      { exclude: ['us-fda.health-claim.treat-cure-prevent'] },
    )
    expect(r.findings.some((f) => f.rule === 'us-fda.health-claim.treat-cure-prevent')).toBe(false)
  })
})
