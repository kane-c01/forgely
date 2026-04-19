import { describe, expect, it } from 'vitest'

import { InMemoryRuleStore } from '../ai/rule-store.js'
import type { VisionAnalyzeInput, VisionAnalysisResult, VisionClient } from '../ai/vision.js'
import type { BrowserAdapter, RenderHtmlResult, ScreenshotResult } from '../browser/types.js'
import { ScraperError, UnsupportedPlatformError } from '../errors.js'

import { GenericAIAdapter } from './generic-ai.js'

const SAMPLE_HTML = `
<!doctype html><html><body>
<main>
  <ul class="grid">
    <li class="item"><a class="link" href="/p/one"><h2 class="title">Forge Pen</h2><span class="price">$12.00</span><img src="https://x.com/one.jpg" /></a></li>
    <li class="item"><a class="link" href="/p/two"><h2 class="title">Forge Notebook</h2><span class="price">$25.00</span><img src="https://x.com/two.jpg" /></a></li>
    <li class="item"><a class="link" href="/p/three"><h2 class="title">Forge Mug</h2><span class="price">$18.00</span><img src="https://x.com/three.jpg" /></a></li>
  </ul>
</main>
</body></html>
`

const ANALYSIS_OK: VisionAnalysisResult = {
  isEcommerce: true,
  confidence: 0.92,
  selectors: {
    productList: 'ul.grid',
    productCard: 'li.item',
    title: 'h2.title',
    price: 'span.price',
    image: 'img',
    link: 'a.link',
  },
  storeMeta: { name: 'Forgely Pop-Up', currency: 'USD', language: 'en' },
}

class StubBrowser implements BrowserAdapter {
  constructor(private readonly html: string) {}
  async screenshot(): Promise<ScreenshotResult> {
    return { bytes: new Uint8Array([0xff, 0xd8, 0xff]), contentType: 'image/jpeg' as const }
  }
  async renderHtml(): Promise<RenderHtmlResult> {
    return { html: this.html, finalUrl: 'https://shop.example.com/' }
  }
}

class StubVision implements VisionClient {
  public calls = 0
  constructor(private readonly result: VisionAnalysisResult) {}
  async analyzeEcommercePage(_input: VisionAnalyzeInput): Promise<VisionAnalysisResult> {
    this.calls++
    return this.result
  }
}

describe('GenericAIAdapter', () => {
  it('always claims it can handle a URL', async () => {
    const adapter = new GenericAIAdapter({
      browser: new StubBrowser(SAMPLE_HTML),
      vision: new StubVision(ANALYSIS_OK),
    })
    expect(await adapter.canHandle('https://anything.com')).toBe(true)
  })

  it('extracts products with vision-supplied selectors', async () => {
    const vision = new StubVision(ANALYSIS_OK)
    const adapter = new GenericAIAdapter({
      browser: new StubBrowser(SAMPLE_HTML),
      vision,
    })
    const data = await adapter.scrape('https://shop.example.com/', { mirrorImages: false })
    expect(data.source).toBe('generic_ai')
    expect(data.products).toHaveLength(3)
    expect(data.products[0]?.title).toBe('Forge Pen')
    expect(data.products[0]?.priceFrom.amountCents).toBe(1200)
    expect(data.products[0]?.url).toBe('https://shop.example.com/p/one')
    expect(data.store.name).toBe('Forgely Pop-Up')
    expect(vision.calls).toBe(1)
  })

  it('reuses cached selectors and skips vision', async () => {
    const ruleStore = new InMemoryRuleStore()
    await ruleStore.save({
      hostname: 'shop.example.com',
      selectors: ANALYSIS_OK.selectors,
      successRate: 0.95,
      lastUsedAt: new Date(),
      createdAt: new Date(),
    })
    const vision = new StubVision(ANALYSIS_OK)
    const adapter = new GenericAIAdapter({
      browser: new StubBrowser(SAMPLE_HTML),
      vision,
      ruleStore,
    })
    const data = await adapter.scrape('https://shop.example.com/', { mirrorImages: false })
    expect(data.products.length).toBeGreaterThan(0)
    expect(vision.calls).toBe(0)
    expect(data.meta?.['reusedRule']).toBe(true)
  })

  it('persists a learned rule when extraction succeeds', async () => {
    const ruleStore = new InMemoryRuleStore()
    const adapter = new GenericAIAdapter({
      browser: new StubBrowser(SAMPLE_HTML),
      vision: new StubVision(ANALYSIS_OK),
      ruleStore,
    })
    await adapter.scrape('https://shop.example.com/', { mirrorImages: false })
    const stored = await ruleStore.findByHostname('shop.example.com')
    expect(stored?.selectors.productCard).toBe('li.item')
    expect(stored?.successRate).toBeGreaterThan(0.8)
  })

  it('throws UnsupportedPlatformError when vision says not e-commerce', async () => {
    const adapter = new GenericAIAdapter({
      browser: new StubBrowser('<html></html>'),
      vision: new StubVision({
        isEcommerce: false,
        confidence: 0.1,
        selectors: { productCard: 'div' },
      }),
    })
    await expect(adapter.scrape('https://random.com/blog')).rejects.toBeInstanceOf(
      UnsupportedPlatformError,
    )
  })

  it('throws ScraperError when extraction yields no products', async () => {
    const adapter = new GenericAIAdapter({
      browser: new StubBrowser('<html><body></body></html>'),
      vision: new StubVision(ANALYSIS_OK),
    })
    await expect(
      adapter.scrape('https://shop.example.com/', { mirrorImages: false }),
    ).rejects.toBeInstanceOf(ScraperError)
  })
})
