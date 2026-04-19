import type { Section } from '@forgely/dsl'

import { BrandStory, CTAFinale, Faq, Hero, ProductShowcase, SocialProof, ValueProps } from './sections'

export interface RendererContext {
  /** Resolved product list — passed by the page server component. */
  products: Array<{
    id: string
    title: string
    priceCents: number
    currency: string
    imageUrl: string
    handle: string
  }>
}

/**
 * Render a single section by its discriminated type.
 *
 * The Compiler-emitted page.tsx walks `dsl.sections.map(SectionRenderer)`.
 */
export function SectionRenderer({ section, ctx }: { section: Section; ctx: RendererContext }) {
  switch (section.type) {
    case 'Hero':
      return <Hero config={section.config} />
    case 'ValueProps':
      return <ValueProps config={section.config} />
    case 'ProductShowcase':
      return <ProductShowcase config={section.config} products={ctx.products} />
    case 'BrandStory':
      return <BrandStory config={section.config} />
    case 'SocialProof':
      return <SocialProof config={section.config} />
    case 'Faq':
      return <Faq config={section.config} />
    case 'CTAFinale':
      return <CTAFinale config={section.config} />
    default:
      return null
  }
}
