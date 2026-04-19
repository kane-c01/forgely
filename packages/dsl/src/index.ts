/**
 * @forgely/dsl — Site DSL schema + helpers.
 *
 * The Site DSL is the canonical, JSON-serialisable description of a generated
 * Forgely site. The Planner Agent emits it; the Compiler Agent consumes it
 * to generate a Next.js project. Everything in between (Theme Editor,
 * preview, version history) reads + writes the same schema.
 *
 * Source: docs/MASTER.md §13, §21, §23.
 */
import { z } from 'zod'

// ──────────────────────────────────────────────────────────────────────────
//  Section configs — one schema per first-class block.
// ──────────────────────────────────────────────────────────────────────────

export const HeroSectionSchema = z.object({
  type: z.literal('Hero'),
  config: z.object({
    layout: z.enum(['video', '3d', 'image']).default('video'),
    momentId: z.string(),
    videoUrl: z.string().url().optional(),
    posterUrl: z.string().url().optional(),
    model3dUrl: z.string().url().optional(),
    title: z.string().min(2).max(160),
    subtitle: z.string().max(280).optional(),
    cta: z.object({
      label: z.string().min(1).max(40),
      href: z.string(),
    }),
    heroProductId: z.string().optional(),
  }),
})

export const ValuePropsSectionSchema = z.object({
  type: z.literal('ValueProps'),
  config: z.object({
    headline: z.string().min(2).max(160).optional(),
    items: z
      .array(
        z.object({
          title: z.string().min(2).max(60),
          body: z.string().min(2).max(280),
          videoUrl: z.string().url().optional(),
          iconUrl: z.string().url().optional(),
        }),
      )
      .min(1)
      .max(6),
  }),
})

export const ProductShowcaseSectionSchema = z.object({
  type: z.literal('ProductShowcase'),
  config: z.object({
    headline: z.string().max(160).optional(),
    layout: z.enum(['grid', 'carousel', 'editorial']).default('grid'),
    productIds: z.array(z.string()).min(1).max(24),
  }),
})

export const BrandStorySectionSchema = z.object({
  type: z.literal('BrandStory'),
  config: z.object({
    headline: z.string().max(160).optional(),
    body: z.string().min(2).max(2000),
    videoUrl: z.string().url().optional(),
    posterUrl: z.string().url().optional(),
  }),
})

export const SocialProofSectionSchema = z.object({
  type: z.literal('SocialProof'),
  config: z.object({
    quotes: z
      .array(
        z.object({
          author: z.string().min(1).max(80),
          role: z.string().max(120).optional(),
          body: z.string().min(2).max(400),
          avatarUrl: z.string().url().optional(),
        }),
      )
      .min(1)
      .max(8),
    pressLogos: z.array(z.string().url()).max(12).optional(),
  }),
})

export const CTAFinaleSectionSchema = z.object({
  type: z.literal('CTAFinale'),
  config: z.object({
    headline: z.string().min(2).max(200),
    body: z.string().max(400).optional(),
    cta: z.object({
      label: z.string().min(1).max(40),
      href: z.string(),
    }),
    backgroundVideoUrl: z.string().url().optional(),
  }),
})

export const FaqSectionSchema = z.object({
  type: z.literal('Faq'),
  config: z.object({
    headline: z.string().max(160).optional(),
    items: z
      .array(
        z.object({
          q: z.string().min(2).max(240),
          a: z.string().min(2).max(1200),
        }),
      )
      .min(1)
      .max(20),
  }),
})

export const SectionSchema = z.discriminatedUnion('type', [
  HeroSectionSchema,
  ValuePropsSectionSchema,
  ProductShowcaseSectionSchema,
  BrandStorySectionSchema,
  SocialProofSectionSchema,
  CTAFinaleSectionSchema,
  FaqSectionSchema,
])
export type Section = z.infer<typeof SectionSchema>

// ──────────────────────────────────────────────────────────────────────────
//  Site-level config
// ──────────────────────────────────────────────────────────────────────────

export const SiteSeoSchema = z.object({
  title: z.string().min(2).max(80),
  description: z.string().min(10).max(180),
  ogImageUrl: z.string().url().optional(),
  twitterHandle: z.string().optional(),
  /** Used to assemble Schema.org Organization JSON-LD. */
  organization: z
    .object({
      legalName: z.string().optional(),
      logoUrl: z.string().url().optional(),
      sameAs: z.array(z.string().url()).max(8).optional(),
    })
    .optional(),
})

export const SiteDslSchema = z.object({
  /** Schema version for forward-compatibility (bump on breaking changes). */
  version: z.literal(1).default(1),
  /** ULID-ish opaque id of the source site row. */
  siteId: z.string().min(1),
  /** Fully-resolved Visual DNA id (`packages/visual-dna`). */
  dnaId: z.string().min(2),
  /** Hero Product Moment id (`packages/product-moments`). */
  heroMomentId: z.string().min(1),
  /** Region — `cn` (default for CN pivot) or `global`. */
  region: z.enum(['cn', 'global']).default('cn'),
  locale: z.enum(['zh-CN', 'zh-HK', 'zh-TW', 'en']).default('zh-CN'),
  /** Available secondary locales (for the Theme Editor's i18n switcher). */
  secondaryLocales: z.array(z.enum(['zh-CN', 'zh-HK', 'zh-TW', 'en'])).default([]),
  brand: z.object({
    name: z.string().min(1).max(80),
    tagline: z.string().max(180).optional(),
    voice: z.array(z.string()).max(6).default([]),
    primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  }),
  sections: z.array(SectionSchema).min(2).max(12),
  seo: SiteSeoSchema,
  /** Free-form planner notes — useful for diffs in version history. */
  notes: z.string().max(2000).optional(),
})
export type SiteDsl = z.infer<typeof SiteDslSchema>

export type SectionType = Section['type']
export type SectionOf<T extends SectionType> = Extract<Section, { type: T }>

// ──────────────────────────────────────────────────────────────────────────
//  Helpers
// ──────────────────────────────────────────────────────────────────────────

/** Extract a section by type — returns `undefined` if missing. */
export function findSection<T extends SectionType>(
  dsl: SiteDsl,
  type: T,
): SectionOf<T> | undefined {
  return dsl.sections.find((s): s is SectionOf<T> => s.type === type)
}

/** Validate + parse a possibly-stringified DSL with helpful errors. */
export function parseSiteDsl(input: unknown): SiteDsl {
  return SiteDslSchema.parse(typeof input === 'string' ? JSON.parse(input) : input)
}

/** Lightweight JSON Schema generation hint for the Planner LLM prompt. */
export function dslPromptSkeleton(): string {
  return `{
  "version": 1,
  "siteId": "<echo>",
  "dnaId": "<one of the 10 DNA ids>",
  "heroMomentId": "M01..M10",
  "region": "cn",
  "locale": "zh-CN",
  "brand": { "name": "...", "tagline": "...", "voice": [...] },
  "sections": [
    { "type": "Hero", "config": { ... } },
    { "type": "ValueProps", "config": { "items": [...] } },
    { "type": "ProductShowcase", "config": { "productIds": [...], "layout": "grid" } },
    { "type": "BrandStory", "config": { "body": "..." } },
    { "type": "SocialProof", "config": { "quotes": [...] } },
    { "type": "Faq", "config": { "items": [...] } },
    { "type": "CTAFinale", "config": { "headline": "...", "cta": { "label": "...", "href": "..." } } }
  ],
  "seo": { "title": "...", "description": "..." }
}`
}
