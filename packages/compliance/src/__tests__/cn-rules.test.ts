import { describe, expect, it } from 'vitest'
import { runRules, type ComplianceContent } from '../index.js'

const baseAd: ComplianceContent = {
  siteId: 's',
  regions: ['CN-ADVERTISING'],
  category: 'general',
  locale: 'zh-CN',
  items: [],
}

describe('CN advertising law', () => {
  it('flags absolute terms ("国家级", "最佳", "全网最低")', () => {
    const r = runRules({
      ...baseAd,
      items: [
        {
          path: 'page.home.hero',
          type: 'hero-headline',
          text: 'Forgely — 国家级 AI 建站平台，全网最低价，行业第一。',
        },
      ],
    })
    expect(r.findings.some((f) => f.rule === 'cn-advertising.absolute-terms')).toBe(true)
    expect(r.mustFix).toBeGreaterThanOrEqual(1)
  })

  it('flags medical claims on non-medical products', () => {
    const r = runRules({
      ...baseAd,
      items: [
        {
          path: 'product.tea.description',
          type: 'product-description',
          text: '本款花茶可以治愈失眠，根治高血压，长期服用药效显著。',
        },
      ],
    })
    expect(r.findings.some((f) => f.rule === 'cn-advertising.food-medical-claim')).toBe(true)
  })

  it('warns when stat data lacks source', () => {
    const r = runRules({
      ...baseAd,
      items: [
        {
          path: 'page.home.section.proof',
          type: 'page-copy',
          text: '90% 用户推荐我们的产品，权威实验证实有效。',
        },
      ],
    })
    expect(r.findings.some((f) => f.rule === 'cn-advertising.fake-data')).toBe(true)
  })
})

describe('CN PIPL', () => {
  it('flags signup CTA without consent', () => {
    const r = runRules({
      siteId: 's',
      regions: ['CN-PIPL'],
      category: 'general',
      locale: 'zh-CN',
      items: [
        {
          path: 'page.signup.cta',
          type: 'cta',
          text: '输入手机号 立即注册 → 开始使用 Forgely',
        },
      ],
    })
    expect(r.findings.some((f) => f.rule === 'cn-pipl.consent-missing')).toBe(true)
  })

  it('flags cross-border transfer without consent', () => {
    const r = runRules({
      siteId: 's',
      regions: ['CN-PIPL'],
      category: 'general',
      locale: 'zh-CN',
      items: [
        {
          path: 'page.faq.howAi',
          type: 'faq',
          text: '我们的 AI 由 OpenAI 提供，数据存储在 AWS 海外服务器。',
        },
      ],
    })
    expect(r.findings.some((f) => f.rule === 'cn-pipl.cross-border-consent-missing')).toBe(true)
  })
})

describe('CN ecommerce law', () => {
  it('flags about-us page missing license info', () => {
    const r = runRules({
      siteId: 's',
      regions: ['CN-ECOMMERCE'],
      category: 'general',
      locale: 'zh-CN',
      items: [
        {
          path: 'page.about',
          type: 'page-copy',
          text: '关于我们 — Forgely 是一家 AI 驱动的品牌独立站平台。',
        },
      ],
    })
    expect(r.findings.some((f) => f.rule === 'cn-ecommerce.business-license-missing')).toBe(true)
  })
})

describe('CN consumer protection', () => {
  it('flags forced default subscription', () => {
    const r = runRules({
      siteId: 's',
      regions: ['CN-CONSUMER'],
      category: 'general',
      locale: 'zh-CN',
      items: [
        {
          path: 'page.checkout.upsell',
          type: 'cta',
          text: '默认勾选：自动续费 99 元 / 月',
        },
      ],
    })
    expect(r.findings.some((f) => f.rule === 'cn-consumer.forced-bundling')).toBe(true)
  })
})
