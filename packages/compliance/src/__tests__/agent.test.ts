import { describe, expect, it, vi } from 'vitest'
import { ComplianceAgent, type LlmClient, type VisionClient } from '../index.js'

describe('ComplianceAgent', () => {
  it('returns a base report when no LLM is provided', async () => {
    const agent = ComplianceAgent.create()
    const report = await agent.review({
      siteId: 'site_1',
      regions: ['US-FDA', 'GLOBAL'],
      category: 'supplements',
      items: [
        {
          path: 'p.1.desc',
          type: 'product-description',
          text: 'Treats arthritis in 7 days.',
        },
      ],
    })
    expect(report.overall).toBe('fail')
    expect(report.findings.length).toBeGreaterThan(0)
  })

  it('uses LLM to enhance suggestions when enabled', async () => {
    const llm: LlmClient = {
      complete: vi.fn().mockResolvedValue({ text: 'Supports a healthy stress response.' }),
    }
    const agent = ComplianceAgent.create({ llm })
    const report = await agent.review(
      {
        siteId: 's',
        regions: ['US-FDA', 'GLOBAL'],
        category: 'supplements',
        items: [{ path: 'p.1.desc', type: 'product-description', text: 'Cures cancer.' }],
      },
      { enhanceSuggestions: true },
    )
    expect(llm.complete).toHaveBeenCalled()
    expect(report.findings[0]?.suggestion).toContain('Supports a healthy stress response')
    expect(report.findings[0]?.autoFixable).toBe(true)
  })

  it('integrates Vision results into rules pipeline', async () => {
    const vision: VisionClient = {
      describe: vi
        .fn()
        .mockResolvedValue({ description: 'Bottle label boldly states cures diabetes.', flags: ['medical-claim'] }),
    }
    const agent = ComplianceAgent.create({ vision })
    const report = await agent.review({
      siteId: 's',
      regions: ['US-FDA', 'GLOBAL'],
      category: 'supplements',
      items: [
        {
          path: 'media.bottle.alt',
          type: 'image-vision',
          text: '',
          ref: { mediaId: 'r2://media/bottle.jpg' },
        },
      ],
    })
    expect(vision.describe).toHaveBeenCalled()
    expect(report.findings.some((f) => f.rule === 'us-fda.health-claim.treat-cure-prevent')).toBe(true)
  })

  it('gate() blocks when critical findings exist', async () => {
    const agent = ComplianceAgent.create()
    const report = await agent.review({
      siteId: 's',
      regions: ['US-FDA', 'GLOBAL'],
      category: 'supplements',
      items: [{ path: 'p.1.desc', type: 'product-description', text: 'Cures diabetes.' }],
    })
    const gate = ComplianceAgent.gate(report)
    expect(gate.allow).toBe(false)
    expect(gate.reason).toMatch(/critical/i)
  })

  it('gate() allows when only warnings exist', async () => {
    const agent = ComplianceAgent.create()
    const report = await agent.review({
      siteId: 's',
      regions: ['UK-ASA'],
      category: 'general',
      items: [
        {
          path: 'p.1.desc',
          type: 'hero-headline',
          text: 'Eco-friendly bottle.',
        },
      ],
    })
    const gate = ComplianceAgent.gate(report)
    expect(gate.allow).toBe(true)
  })
})
