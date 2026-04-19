/**
 * Planner Agent — T14.
 *
 * Inputs: BrandProfile + selected DNA + selected Moment + ranked Products.
 * Output: a fully-validated `SiteDsl` (`@forgely/dsl`).
 *
 * The Planner is the "art director + product manager" — it decides which
 * sections appear, in what order, with which products in each, and the
 * exact SEO meta. The Copywriter then fills the prose, the Director writes
 * the shot scripts, and the Artist forges the assets.
 *
 * Cost (real provider, Claude Sonnet 4 / Qwen-Plus):
 *   ≈ 2k input + 1.5k output ≈ $0.030 → 50 credits per call.
 */
import { type SiteDsl, SiteDslSchema, dslPromptSkeleton } from '@forgely/dsl'

import type { LlmModel, LlmProvider } from '../providers/types'
import type { BrandProfile } from '../types/brand-profile'
import type { VisualDnaId } from '../types/dna'

export const PLANNER_CREDIT_COST = 50

export interface PlannerProductInput {
  id: string
  title: string
  category?: string
  priceCents: number
  description: string
}

export interface PlannerOptions {
  provider: LlmProvider
  brand: BrandProfile
  dna: VisualDnaId
  heroMomentId: string
  /** Ranked products — index 0 is the hero. */
  products: PlannerProductInput[]
  siteId: string
  brandName: string
  region?: 'cn' | 'global'
  locale?: 'zh-CN' | 'zh-HK' | 'zh-TW' | 'en'
  model?: LlmModel
  mock?: boolean
  onTelemetry?: (info: { durationMs: number; costUsd: number; outputTokens: number }) => void
}

export interface PlanResult {
  dsl: SiteDsl
  creditsUsed: number
}

const SYSTEM = `You are Forgely's Planner Agent.

Your job: turn a brand snapshot + ranked products into a complete SiteDSL —
the JSON description of a 6-section homepage that the Compiler can build.

Rules:
  - Produce sections in this order: Hero → SocialProof → ValueProps →
    ProductShowcase → BrandStory → Faq → CTAFinale.
  - Hero MUST set heroProductId to the FIRST product in the list.
  - ValueProps MUST contain 3 items, each <= 80 chars body.
  - ProductShowcase.productIds MUST contain 6-12 ids (or all if fewer products).
  - BrandStory.body 60-120 words.
  - SocialProof: 3 quotes (you may invent persona quotes — keep them realistic).
  - Faq: 5 items addressing common DTC objections.
  - CTAFinale: bold one-line headline + clear primary CTA.

Locale-aware: when locale starts with "zh-", write all strings in Chinese.
Otherwise English.

Use this skeleton:
${dslPromptSkeleton()}

Return ONLY valid JSON.`

export async function planSite(options: PlannerOptions): Promise<PlanResult> {
  if (options.mock) {
    return { dsl: mockDsl(options), creditsUsed: PLANNER_CREDIT_COST }
  }
  const startedAt = Date.now()
  const res = await options.provider.text<unknown>({
    model: options.model ?? 'claude-sonnet-4',
    system: SYSTEM,
    user: buildUserPayload(options),
    jsonSchema: 'object',
    maxTokens: 4000,
    temperature: 0.6,
  })
  const dsl = SiteDslSchema.parse({
    ...(res.data as object),
    siteId: options.siteId,
    dnaId: options.dna,
    heroMomentId: options.heroMomentId,
    region: options.region ?? 'cn',
    locale: options.locale ?? 'zh-CN',
  })
  options.onTelemetry?.({
    durationMs: Date.now() - startedAt,
    costUsd: res.costUsd,
    outputTokens: res.outputTokens,
  })
  return { dsl, creditsUsed: PLANNER_CREDIT_COST }
}

function buildUserPayload(options: PlannerOptions): string {
  const lines: string[] = []
  lines.push(`siteId: ${options.siteId}`)
  lines.push(`brandName: ${options.brandName}`)
  lines.push(`region: ${options.region ?? 'cn'} · locale: ${options.locale ?? 'zh-CN'}`)
  lines.push(`brandArchetype: ${options.brand.brandArchetype}`)
  lines.push(`tone: ${options.brand.toneOfVoice.join(', ')}`)
  lines.push(`priceSegment: ${options.brand.priceSegment}`)
  lines.push(`targetCustomer: ${options.brand.targetCustomer.persona}`)
  lines.push(`recommendedDNA: ${options.dna}`)
  lines.push(`heroMomentId: ${options.heroMomentId}`)
  lines.push(`opportunity: ${options.brand.opportunity}`)
  lines.push('')
  lines.push('Products (rank 0 first):')
  for (const [i, p] of options.products.slice(0, 12).entries()) {
    lines.push(
      `  ${i}: id=${p.id} title="${p.title}" cat=${p.category ?? '-'} price=${(p.priceCents / 100).toFixed(2)}`,
    )
  }
  return lines.join('\n')
}

function mockDsl(options: PlannerOptions): SiteDsl {
  const heroProduct = options.products[0]!
  return SiteDslSchema.parse({
    version: 1,
    siteId: options.siteId,
    dnaId: options.dna,
    heroMomentId: options.heroMomentId,
    region: options.region ?? 'cn',
    locale: options.locale ?? 'zh-CN',
    brand: {
      name: options.brandName,
      tagline: options.brand.opportunity.slice(0, 80),
      voice: options.brand.toneOfVoice,
    },
    sections: [
      {
        type: 'Hero',
        config: {
          layout: 'video',
          momentId: options.heroMomentId,
          title: options.brandName,
          subtitle: options.brand.opportunity,
          cta: { label: '立即购买', href: `/products/${heroProduct.id}` },
          heroProductId: heroProduct.id,
        },
      },
      {
        type: 'ValueProps',
        config: {
          items: [
            { title: '工艺', body: '匠心打造，每一件都经过严格品控。' },
            { title: '设计', body: '极简、克制、电影级美学。' },
            { title: '体验', body: '24h 客服，7 天无理由退货。' },
          ],
        },
      },
      {
        type: 'ProductShowcase',
        config: {
          headline: '精选产品',
          productIds: options.products.slice(0, 6).map((p) => p.id),
          layout: 'grid',
        },
      },
      {
        type: 'BrandStory',
        config: {
          headline: '品牌故事',
          body: `${options.brandName} 致力于为 ${options.brand.targetCustomer.persona} 打造高品质产品。`,
        },
      },
      {
        type: 'SocialProof',
        config: {
          quotes: [
            { author: '匿名用户', role: '老顾客', body: '真心推荐，质量超出预期。' },
            { author: '设计师 Lily', role: '小红书博主', body: '审美在线，质感很高级。' },
            { author: '李先生', role: '回头客', body: '已经买了 3 次。' },
          ],
        },
      },
      {
        type: 'Faq',
        config: {
          items: [
            { q: '支持哪些支付方式？', a: '支持微信支付、支付宝、银联云闪付。' },
            { q: '多久能收到货？', a: '一线城市 24-48 小时，其他地区 3-5 天。' },
            { q: '可以退换货吗？', a: '7 天无理由退货，质量问题免费换。' },
            { q: '有发票吗？', a: '所有订单都可开具电子发票。' },
            { q: '怎么联系客服？', a: '微信添加客服，9:00-21:00 在线。' },
          ],
        },
      },
      {
        type: 'CTAFinale',
        config: {
          headline: `加入 ${options.brandName} 的 1000+ 用户`,
          cta: { label: '现在开始', href: '/products' },
        },
      },
    ],
    seo: {
      title: `${options.brandName} — 官方旗舰店`,
      description: options.brand.opportunity.slice(0, 160),
    },
  })
}
