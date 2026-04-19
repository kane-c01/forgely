/**
 * `seo.*` tRPC router.
 *
 * Surface for the SEO control center (apps/app /sites/[siteId]/seo)
 * and the deployer (services/deploy):
 *   - score a single page or batch
 *   - generate sitemap.xml / robots.txt / llms.txt for the deployer
 *   - run keyword research via DataForSEO (when configured)
 *
 * @owner W8 (T30)
 */

import { z } from 'zod'

import {
  buildLlmsFullTxt,
  buildLlmsTxt,
  buildMeta,
  buildRobots,
  buildSitemap,
  scorePage,
  DataForSeoClient,
} from '@forgely/seo'
import type { PageMeta, SiteMeta } from '@forgely/seo'

import { protectedProcedure, router } from './trpc.js'

/* ---------------- input schemas ---------------- *
 * Runtime shape validated by zod; types fan out via inference.
 * We intentionally cast to the package types (PageMeta, SiteMeta) at
 * the call site since zod's optional fields don't satisfy strictly
 * required interface fields — runtime rules already enforce min(1).
 */

const SiteTypeEnum = z.enum(['storefront', 'brand', 'blog', 'corporate'])

const SiteMetaSchema = z.object({
  siteId: z.string().min(1),
  baseUrl: z.string().url(),
  brandName: z.string().min(1),
  brandLegalName: z.string().optional(),
  brandLogo: z.string().optional(),
  brandDescription: z.string().optional(),
  defaultLocale: z.string().min(2),
  locales: z.array(z.string()).optional(),
  siteType: SiteTypeEnum,
  social: z
    .object({
      twitter: z.string().optional(),
      instagram: z.string().optional(),
      facebook: z.string().optional(),
      youtube: z.string().optional(),
      linkedin: z.string().optional(),
    })
    .optional(),
})

const PageMetaSchema = z.object({
  path: z.string().startsWith('/'),
  title: z.string().min(1),
  description: z.string().min(1),
  locale: z.string().optional(),
  ogImage: z.string().optional(),
  twitterCard: z.enum(['summary', 'summary_large_image', 'app', 'player']).optional(),
  keywords: z.array(z.string()).optional(),
  changefreq: z
    .enum(['always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never'])
    .optional(),
  priority: z.number().min(0).max(1).optional(),
  lastmod: z.string().optional(),
  noindex: z.boolean().optional(),
  h1: z.string().optional(),
  bodyText: z.string().optional(),
  alternates: z.record(z.string()).optional(),
  schema: z.array(z.unknown()).optional(),
  internalLinks: z.number().optional(),
  externalLinks: z.number().optional(),
})

/* ---------------- router ---------------- */

export const seoRouter = router({
  /** Score a single page (deterministic, in-process). */
  scorePage: protectedProcedure
    .input(
      z.object({
        site: SiteMetaSchema,
        page: PageMetaSchema,
        multilingual: z.boolean().optional(),
      }),
    )
    .query(({ input }) => {
      return scorePage(input.site as SiteMeta, input.page as PageMeta, {
        multilingual: input.multilingual,
      })
    }),

  /** Batch score (used by the SEO panel table). */
  scorePages: protectedProcedure
    .input(
      z.object({
        site: SiteMetaSchema,
        pages: z.array(PageMetaSchema).min(1).max(2000),
        multilingual: z.boolean().optional(),
      }),
    )
    .query(({ input }) => {
      const site = input.site as SiteMeta
      return input.pages.map((p) => ({
        path: p.path,
        title: p.title,
        score: scorePage(site, p as PageMeta, { multilingual: input.multilingual }),
      }))
    }),

  /** Build all SEO/GEO artefacts for the deployer (sitemap + robots + llms). */
  generateArtefacts: protectedProcedure
    .input(
      z.object({
        site: SiteMetaSchema,
        pages: z.array(PageMetaSchema).min(1),
        aiPolicy: z.enum(['allow-all', 'block-all', 'block-list']).optional(),
        positioning: z.string().optional(),
      }),
    )
    .query(({ input }) => {
      const site = input.site as SiteMeta
      const pages = input.pages as PageMeta[]
      return {
        sitemap: buildSitemap(site, pages),
        robotsTxt: buildRobots(site, { aiPolicy: input.aiPolicy ?? 'allow-all' }),
        llmsTxt: buildLlmsTxt(site, pages, { positioning: input.positioning }),
        llmsFullTxt: buildLlmsFullTxt(site, pages, { positioning: input.positioning }),
      }
    }),

  /** Build per-page meta (for SSR injection). */
  buildMeta: protectedProcedure
    .input(z.object({ site: SiteMetaSchema, page: PageMetaSchema }))
    .query(({ input }) => {
      return buildMeta(input.site as SiteMeta, input.page as PageMeta)
    }),

  /**
   * DataForSEO keyword research.
   *
   * Returns demo data when no DATAFORSEO_LOGIN env var is configured —
   * useful for local dev and previews.
   */
  researchKeyword: protectedProcedure
    .input(
      z.object({
        keyword: z.string().min(2).max(120),
        location: z.string().optional(),
        language: z.string().optional(),
        includeSerp: z.boolean().optional(),
      }),
    )
    .query(async ({ input }) => {
      const login = process.env['DATAFORSEO_LOGIN']
      const password = process.env['DATAFORSEO_PASSWORD']
      if (!login || !password) {
        return demoKeywordResult(
          input.keyword,
          input.location ?? 'United States',
          input.language ?? 'en',
        )
      }
      const client = DataForSeoClient.create({ login, password })
      return client.research(input.keyword, {
        location: input.location,
        language: input.language,
        includeSerp: input.includeSerp,
      })
    }),
})

export type SeoRouter = typeof seoRouter

function demoKeywordResult(keyword: string, location: string, language: string) {
  return {
    keyword,
    location,
    language,
    ideas: [
      { keyword, searchVolume: 12000, cpc: 1.4, competition: 0.5 },
      { keyword: `${keyword} reviews`, searchVolume: 4400, cpc: 0.9, competition: 0.4 },
      { keyword: `best ${keyword}`, searchVolume: 9100, cpc: 1.6, competition: 0.7 },
    ],
  }
}
