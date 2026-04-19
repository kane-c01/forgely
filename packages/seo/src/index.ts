/**
 * @forgely/seo
 *
 * MASTER.md 第 16 章 — SEO + GEO 内化。
 *
 * 公开 API:
 *   - buildSitemap / renderSitemap / renderSitemapIndex
 *   - buildRobots
 *   - buildSchemasFor / organizationSchema / productSchema / faqSchema / breadcrumbSchema
 *   - buildMeta / renderMetaHtml
 *   - buildLlmsTxt / buildLlmsFullTxt
 *   - scorePage
 *   - DataForSeoClient
 */

export type {
  BreadcrumbTrail,
  ChangeFreq,
  CheckLevel,
  FaqPageMeta,
  Locale,
  MetaTagSet,
  OrganizationProfile,
  PageMeta,
  PostalAddress,
  ProductInfo,
  ProductPageMeta,
  ProductReview,
  SchemaObject,
  SeoCheck,
  SeoScore,
  SiteMeta,
  SiteType,
  SitemapEntry,
} from './types.js'

export { buildSitemap, renderSitemap, renderSitemapIndex, toEntries } from './sitemap.js'
export type { BuildSitemapOptions, SitemapFile } from './sitemap.js'

export { buildRobots } from './robots.js'
export type { BuildRobotsOptions, RobotsRule } from './robots.js'

export {
  buildSchemasFor,
  breadcrumbSchema,
  faqSchema,
  organizationProfileFromSite,
  organizationSchema,
  productSchema,
  websiteSchema,
} from './schemaOrg.js'

export { buildMeta, renderMetaHtml } from './meta.js'
export type { BuildMetaOptions } from './meta.js'

export { buildLlmsFullTxt, buildLlmsTxt } from './llms.js'
export type { BuildLlmsOptions } from './llms.js'

export { scorePage } from './score.js'
export type { ScoreOptions } from './score.js'

export { DataForSeoClient, DataForSeoError } from './keywords.js'
export type {
  DataForSeoConfig,
  KeywordIdea,
  KeywordResearchResult,
  SerpCompetitor,
} from './keywords.js'
