/**
 * `compliance.*` tRPC router.
 *
 * Wraps the @forgely/compliance engine + Agent so the dashboard
 * (apps/app) and the deployer (services/deploy) can request reviews
 * over the network.
 *
 * The actual rule engine is pure-functional and runs in-process — we
 * do NOT round-trip to a separate worker for it. Vision / LLM
 * enhancement is opt-in and gated by env vars (anthropicClient is
 * provided through ctx in production).
 *
 * @owner W8 (T29)
 */

import { z } from 'zod'

import { ComplianceAgent, applyAutoFix, runRules } from '@forgely/compliance'
import type { ComplianceContent, ContentItem } from '@forgely/compliance'

import { protectedProcedure, router } from './trpc.js'

/* ---------------- input schemas ---------------- *
 * Runtime shape validated by zod; package types applied at the call
 * site (zod's optional fields don't satisfy the strictly required
 * package interface fields, but zod min(1) + .optional() already
 * enforces the same contract at runtime).
 */

const RegionEnum = z.enum([
  'US-FTC',
  'US-FDA',
  'US-COPPA',
  'US-CPSIA',
  'US-CA-PROP65',
  'EU-GDPR',
  'EU-DSA',
  'EU-CE',
  'UK-ASA',
  'CA-CASL',
  'GLOBAL',
])

const CategoryEnum = z.enum([
  'supplements',
  'cosmetics',
  'children',
  'food',
  'alcohol',
  'cbd',
  'medical-device',
  'apparel',
  'electronics',
  'general',
])

const ContentTypeEnum = z.enum([
  'product-title',
  'product-description',
  'product-claim',
  'page-copy',
  'hero-headline',
  'cta',
  'faq',
  'blog',
  'image-alt',
  'image-vision',
  'meta-title',
  'meta-description',
  'schema-markup',
  'logo',
])

const ContentItemSchema = z.object({
  path: z.string().min(1),
  type: ContentTypeEnum,
  text: z.string(),
  ref: z
    .object({
      productId: z.string().optional(),
      pageId: z.string().optional(),
      sectionId: z.string().optional(),
      mediaId: z.string().optional(),
    })
    .optional(),
})

const ComplianceContentSchema = z.object({
  siteId: z.string().min(1),
  regions: z.array(RegionEnum).min(1),
  category: CategoryEnum,
  subCategory: z.string().optional(),
  items: z.array(ContentItemSchema).min(1).max(2000),
  locale: z.string().optional(),
})

const RunOptionsSchema = z.object({
  only: z.array(z.string()).optional(),
  exclude: z.array(z.string()).optional(),
  enhanceSuggestions: z.boolean().optional(),
})

/* ---------------- router ---------------- */

export const complianceRouter = router({
  /**
   * Run a full compliance review over a site's content. Returns the
   * structured ComplianceReport (verdict + findings + counts).
   *
   * No external API calls unless `enhanceSuggestions: true` is passed
   * AND an LLM is wired into ctx.complianceAgent (production-only).
   */
  check: protectedProcedure
    .input(z.object({ content: ComplianceContentSchema, options: RunOptionsSchema.optional() }))
    .mutation(async ({ input }) => {
      const agent = ComplianceAgent.create()
      const report = await agent.review(input.content as ComplianceContent, input.options ?? {})
      return report
    }),

  /**
   * Pure-function variant — same as `check` but skips the agent layer
   * entirely. Cheaper + deterministic; useful for CI and previews.
   */
  scan: protectedProcedure
    .input(z.object({ content: ComplianceContentSchema, options: RunOptionsSchema.optional() }))
    .query(({ input }) => {
      return runRules(input.content as ComplianceContent, input.options ?? {})
    }),

  /**
   * Apply the autoFixable findings to the provided items and return
   * the patched content + remaining findings.
   *
   * Stateless — the caller is responsible for persisting the patches
   * (typically via the editor mutation that owns the content).
   */
  applyFix: protectedProcedure
    .input(
      z.object({
        items: z.array(ContentItemSchema).min(1),
        report: z
          .object({
            findings: z.array(z.unknown()),
          })
          .passthrough(),
      }),
    )
    .mutation(({ input }) => {
      const result = applyAutoFix(input.items as ContentItem[], input.report as never)
      return result
    }),

  /**
   * Deployment gate. Wraps `check()` and returns `{ allow, reason }`.
   *
   * The deployer (services/deploy) calls this before every promote;
   * if `allow === false` the deploy is paused with the reason shown
   * to the user.
   */
  gate: protectedProcedure
    .input(z.object({ content: ComplianceContentSchema, options: RunOptionsSchema.optional() }))
    .mutation(async ({ input }) => {
      const agent = ComplianceAgent.create()
      const report = await agent.review(input.content as ComplianceContent, input.options ?? {})
      return ComplianceAgent.gate(report)
    }),
})

export type ComplianceRouter = typeof complianceRouter
