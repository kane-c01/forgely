/**
 * Storefront default homepage — renders a sample SiteDSL using the
 * @forgely/storefront section components.
 *
 * In production each tenant's deployed site is a clone of this app where
 * the Compiler replaces this file with a hard-coded sample DSL specific
 * to the tenant. During Forgely platform local dev the file just renders
 * a baseline DSL so designers can iterate on section components.
 */
import { SectionRenderer, type RendererContext } from '@/components/SectionRenderer'
import type { SiteDsl } from '@forgely/dsl'

const SAMPLE_DSL: SiteDsl = {
  version: 1,
  siteId: 'sample',
  dnaId: 'nordic_minimal',
  heroMomentId: 'M04',
  region: 'global',
  locale: 'en',
  secondaryLocales: ['zh-CN'],
  brand: {
    name: 'ToyBloom',
    tagline: 'Heirloom wooden toys, designed in Stockholm.',
    voice: ['warm', 'minimal'],
    primaryColor: '#FF6B1A',
  },
  sections: [
    {
      type: 'Hero',
      config: {
        layout: 'video',
        momentId: 'M04',
        videoUrl: 'https://placehold.co/1920x1080.mp4',
        posterUrl: 'https://placehold.co/1920x1080.jpg',
        title: 'Heirloom toys, made to last.',
        subtitle: 'Hand-sanded beech, water-based paint, designed in Stockholm.',
        cta: { label: 'Shop the Rainbow Stacker', href: '/products/rainbow-stacker' },
        heroProductId: 'p1',
      },
    },
    {
      type: 'ValueProps',
      config: {
        headline: 'Why parents choose ToyBloom',
        items: [
          { title: 'Open-ended play', body: 'Toys without a script — your child writes the story.' },
          { title: 'Heirloom build', body: 'Beech, ash and silk, finished by hand. Built to outlast you.' },
          { title: 'Made in small batches', body: 'A studio of seven craftspeople in Gamla Stan.' },
        ],
      },
    },
    {
      type: 'ProductShowcase',
      config: {
        headline: 'Bestsellers',
        layout: 'grid',
        productIds: ['p1', 'p2'],
      },
    },
    {
      type: 'BrandStory',
      config: {
        headline: 'Our story',
        body: 'ToyBloom was founded in 2018 around a single rainbow stacker. Six years later we still make every piece by hand in our Stockholm workshop.',
        posterUrl: 'https://placehold.co/1280x960.jpg',
      },
    },
    {
      type: 'SocialProof',
      config: {
        quotes: [
          { author: 'Anna L.', role: 'Mom of two', body: 'The single most beautiful object in our nursery.' },
          { author: 'Rhianna J.', role: 'Editor, Cup of Jo', body: 'Modern heirlooms, plain and simple.' },
          { author: 'Erik S.', role: 'Repeat customer', body: 'Already on our third stacker.' },
        ],
      },
    },
    {
      type: 'Faq',
      config: {
        items: [
          { q: 'What ages are these toys for?', a: '6 months and up. The stackers are deliberately oversized for safety.' },
          { q: 'Is the paint safe?', a: 'Yes — we use only EN-71/3-certified water-based paints.' },
          { q: 'Where do you ship?', a: 'EU + US + UK + CA. Free over $80.' },
        ],
      },
    },
    {
      type: 'CTAFinale',
      config: {
        headline: 'Ready to slow play down?',
        body: 'Join 12,000 thoughtful parents.',
        cta: { label: 'Shop ToyBloom', href: '/products' },
      },
    },
  ],
  seo: {
    title: 'ToyBloom — Heirloom wooden toys',
    description: 'Hand-finished heirloom wooden toys, designed in Stockholm and shipped worldwide.',
  },
}

const SAMPLE_PRODUCTS: RendererContext['products'] = [
  {
    id: 'p1',
    handle: 'rainbow-stacker',
    title: 'Rainbow Stacker',
    priceCents: 4800,
    currency: 'USD',
    imageUrl: 'https://placehold.co/1024x1024.jpg?text=Rainbow+Stacker',
  },
  {
    id: 'p2',
    handle: 'silk-scarves',
    title: 'Silk Play Scarves',
    priceCents: 2800,
    currency: 'USD',
    imageUrl: 'https://placehold.co/1024x1024.jpg?text=Silk+Scarves',
  },
]

export default function StorefrontPage() {
  const ctx: RendererContext = { products: SAMPLE_PRODUCTS }
  return (
    <main>
      {SAMPLE_DSL.sections.map((section, i) => (
        <SectionRenderer key={i} section={section} ctx={ctx} />
      ))}
    </main>
  )
}
