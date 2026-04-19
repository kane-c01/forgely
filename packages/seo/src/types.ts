/**
 * @forgely/seo — Core types
 *
 * 完全覆盖 docs/MASTER.md 第 16 章 "SEO + GEO 内化"。
 *
 * 关键概念:
 * - SiteMeta: 全站元数据（域名 / brand / locale / siteType）
 * - PageMeta: 单页元数据（path / title / description / ogImage / 结构化数据）
 * - Sitemap / Robots / RFC: 技术 SEO 资产
 * - Schema.org: Organization / Product / FAQ / Breadcrumb / Review
 * - GEO: llms.txt / llms-full.txt
 * - SeoScore: 单页评分 + 改进建议
 */

export type Locale = string

/** 站点类型，用来选择默认 schema 模板 */
export type SiteType = 'storefront' | 'brand' | 'blog' | 'corporate'

export type ChangeFreq = 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'

export interface SiteMeta {
  siteId: string
  /** 完整域名，无尾斜杠 (https://acme.com) */
  baseUrl: string
  brandName: string
  brandLegalName?: string
  brandLogo?: string
  brandDescription?: string
  /** 默认语言（ISO 639-1） */
  defaultLocale: Locale
  /** 多语言支持（用于 hreflang） */
  locales?: Locale[]
  siteType: SiteType
  social?: {
    twitter?: string
    instagram?: string
    facebook?: string
    youtube?: string
    linkedin?: string
  }
  organization?: OrganizationProfile
}

export interface OrganizationProfile {
  legalName: string
  url: string
  logo?: string
  email?: string
  telephone?: string
  address?: PostalAddress
  sameAs?: string[]
  founders?: string[]
  foundingDate?: string
}

export interface PostalAddress {
  streetAddress: string
  addressLocality: string
  addressRegion?: string
  postalCode: string
  addressCountry: string
}

/** 单页元数据（输入给 Sitemap / Schema / Meta 生成器） */
export interface PageMeta {
  /** 站内绝对路径，以 `/` 开头 */
  path: string
  title: string
  description: string
  /** 当前页 locale，缺省继承 SiteMeta.defaultLocale */
  locale?: Locale
  /** 该页的 OG 图（绝对 URL 或站内 path） */
  ogImage?: string
  /** Twitter Card 类型 */
  twitterCard?: 'summary' | 'summary_large_image' | 'app' | 'player'
  /** 关键词（仅用于 score 评估，不输出 meta keywords） */
  keywords?: string[]
  /** Sitemap 字段 */
  changefreq?: ChangeFreq
  priority?: number
  lastmod?: string
  /** 是否禁止被搜索引擎索引 */
  noindex?: boolean
  /** 该页主要 H1 (用于 score) */
  h1?: string
  /** 该页全文（用于 GEO + score） */
  bodyText?: string
  /** 多语言对应 (用于 hreflang) — locale → path 或绝对 URL */
  alternates?: Record<Locale, string>
  /** 该页关联的结构化数据 */
  schema?: SchemaObject[]
  /** 内部链接数（评分用） */
  internalLinks?: number
  /** 外部链接数（评分用） */
  externalLinks?: number
}

/** 商品页扩展 */
export interface ProductPageMeta extends PageMeta {
  product: ProductInfo
}

export interface ProductInfo {
  productId: string
  sku?: string
  name: string
  brand?: string
  description: string
  price: { amount: number; currency: string }
  availability: 'InStock' | 'OutOfStock' | 'PreOrder'
  /** 图片 URL（首图作为 OG 主图） */
  images: string[]
  /** 评分（用于 schema.org/AggregateRating） */
  rating?: { value: number; count: number }
  /** 评论列表 (schema.org/Review) */
  reviews?: ProductReview[]
  category?: string
  gtin?: string
  mpn?: string
}

export interface ProductReview {
  author: string
  rating: number
  title?: string
  body: string
  publishedAt: string
}

/** FAQ 页扩展 */
export interface FaqPageMeta extends PageMeta {
  faqs: Array<{ question: string; answer: string }>
}

/** Breadcrumb 数据 */
export interface BreadcrumbTrail {
  items: Array<{ name: string; url: string }>
}

/** Generic schema.org JSON-LD 对象（输出给 <script type="application/ld+json">） */
export interface SchemaObject {
  '@context': 'https://schema.org'
  '@type': string
  [key: string]: unknown
}

/** Sitemap 输出 */
export interface SitemapEntry {
  loc: string
  lastmod?: string
  changefreq?: ChangeFreq
  priority?: number
  alternates?: Array<{ hreflang: string; href: string }>
}

export interface MetaTagSet {
  /** <title>...</title> */
  title: string
  /** <meta name="description"> */
  description: string
  /** <link rel="canonical"> */
  canonical: string
  /** OG / Twitter / Robots 等所有 <meta> 标签 */
  meta: Array<{ name?: string; property?: string; content: string }>
  /** <link rel="alternate" hreflang> */
  alternates: Array<{ hreflang: string; href: string }>
  /** 应当输出的所有 schema JSON-LD 对象 */
  jsonLd: SchemaObject[]
}

/** SEO 单页评分 */
export interface SeoScore {
  /** 0-100 */
  score: number
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
  checks: SeoCheck[]
  /** 排序后的改进建议 (warning + critical) */
  recommendations: SeoCheck[]
}

export type CheckLevel = 'pass' | 'info' | 'warning' | 'critical'

export interface SeoCheck {
  id: string
  name: string
  level: CheckLevel
  /** 加分（pass）或扣分（warning/critical）权重 */
  weight: number
  message?: string
  /** 修复建议 */
  hint?: string
}
