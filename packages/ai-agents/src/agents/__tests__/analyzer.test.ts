import { afterEach, describe, expect, it } from 'vitest'

import { analyze, ANALYZER_CREDIT_COST } from '../analyzer'
import { MockLlmProvider } from '../../providers/mock'
import { TEXT_SYSTEM, VISION_SYSTEM } from '../analyzer-prompts'

import { FIXTURES, FIXTURE_MOCKS } from './fixtures'

function bindMock(): MockLlmProvider {
  const mock = new MockLlmProvider()
  mock.onSystemContains(VISION_SYSTEM.slice(0, 40), (req) => {
    const url = pickImageUrl(req)
    const fixture = FIXTURES.find((f) => f.data.screenshots.homepage === url)
    if (!fixture) throw new Error(`Vision mock has no fixture for url=${url ?? '<none>'}`)
    return FIXTURE_MOCKS[fixture.label]!.vision
  })
  mock.onSystemContains(TEXT_SYSTEM.slice(0, 40), (req) => {
    const userText = typeof req.user === 'string'
      ? req.user
      : req.user
          .filter((b) => b.type === 'text')
          .map((b) => (b.type === 'text' ? b.text : ''))
          .join('\n')
    const fixture = FIXTURES.find((f) => userText.includes(f.data.store.name))
    if (!fixture) throw new Error(`Text mock has no fixture for payload=${userText.slice(0, 80)}…`)
    return FIXTURE_MOCKS[fixture.label]!.text
  })
  return mock
}

function pickImageUrl(req: unknown): string | undefined {
  if (
    req &&
    typeof req === 'object' &&
    'images' in req &&
    Array.isArray((req as { images: unknown }).images)
  ) {
    const first = (req as { images: Array<{ url?: string }> }).images[0]
    if (first && 'url' in first && typeof first.url === 'string') return first.url
  }
  return undefined
}

describe('analyze() — Analyzer Agent', () => {
  let mock: MockLlmProvider

  afterEach(() => {
    mock?.reset()
  })

  it('returns a fully validated BrandProfile for the toybloom fixture', async () => {
    mock = bindMock()
    const fixture = FIXTURES[0]!
    const { profile, stats } = await analyze(fixture.data, { provider: mock })

    expect(profile.recommendedDNA).toBe('nordic_minimal')
    expect(profile.brandArchetype).toBe('Caregiver')
    expect(profile.priceSegment).toBe('premium')
    expect(profile.referenceBrands.length).toBeGreaterThan(0)
    expect(profile.toneOfVoice).toContain('warm')
    expect(profile.targetCustomer.regions).toContain('US')
    expect(profile.creditsUsed).toBe(ANALYZER_CREDIT_COST)
    expect(profile.vision.dominantColors).toContain('#FFFFFF')
    expect(stats.totalMs).toBeGreaterThanOrEqual(0)
  })

  it.each(FIXTURES)('recommends the right DNA for $label', async (fixture) => {
    mock = bindMock()
    const { profile } = await analyze(fixture.data, { provider: mock })
    expect(profile.recommendedDNA).toBe(fixture.expectedDna)
    expect(profile.category.toLowerCase()).toContain(fixture.expectedCategoryRoot)
  })

  it('falls back gracefully when vision pass throws', async () => {
    mock = new MockLlmProvider()
    mock.onSystemContains(VISION_SYSTEM.slice(0, 40), () => {
      throw new Error('upstream vision is down')
    })
    mock.onSystemContains(TEXT_SYSTEM.slice(0, 40), () => FIXTURE_MOCKS['toybloom-nordic']!.text)

    const { profile } = await analyze(FIXTURES[0]!.data, { provider: mock })
    expect(profile.vision.visualQuality).toBe(5) // default fallback score
    expect(profile.recommendedDNA).toBe('nordic_minimal')
  })

  it('skips the vision pass when no screenshot is provided', async () => {
    mock = new MockLlmProvider()
    let visionCalls = 0
    mock.onSystemContains(VISION_SYSTEM.slice(0, 40), () => {
      visionCalls += 1
      return FIXTURE_MOCKS['toybloom-nordic']!.vision
    })
    mock.onSystemContains(TEXT_SYSTEM.slice(0, 40), () => FIXTURE_MOCKS['toybloom-nordic']!.text)

    const data = { ...FIXTURES[0]!.data, screenshots: {} }
    const { profile } = await analyze(data, { provider: mock })
    expect(visionCalls).toBe(0)
    expect(profile.vision.weaknesses[0]).toContain('no screenshot')
  })

  it('emits telemetry per pass when an onTelemetry callback is supplied', async () => {
    mock = bindMock()
    const events: string[] = []
    await analyze(FIXTURES[0]!.data, {
      provider: mock,
      onTelemetry: (evt) => events.push(evt.pass),
    })
    expect(events).toContain('vision')
    expect(events).toContain('text')
  })

  it('honours a custom credit cost', async () => {
    mock = bindMock()
    const { profile } = await analyze(FIXTURES[0]!.data, { provider: mock, creditCost: 50 })
    expect(profile.creditsUsed).toBe(50)
  })

  it('falls back to a heuristic DNA when the LLM returns an unknown id', async () => {
    mock = new MockLlmProvider()
    mock.onSystemContains(VISION_SYSTEM.slice(0, 40), () => FIXTURE_MOCKS['liquidlab-pop']!.vision)
    mock.onSystemContains(TEXT_SYSTEM.slice(0, 40), () => ({
      ...FIXTURE_MOCKS['liquidlab-pop']!.text,
      recommendedDNA: 'completely_made_up',
    }))
    const { profile } = await analyze(FIXTURES[1]!.data, { provider: mock })
    // category is "beverage" → playful_pop heuristic
    expect(profile.recommendedDNA).toBe('playful_pop')
  })
})
