import type { ScrollAct } from '@/components/scroll/scroll-acts'

/**
 * Six-act narrative for `/the-forge` — mirrors docs/MASTER.md §18.4.
 *
 * Each act is a 100vh segment of the scroll reel. Backdrops are simple
 * Tailwind gradient classes today; the T27b PR will swap them out for
 * R3F scenes or Kling-rendered AV1 loops without changing this data file.
 */
export const forgeReelActs: ScrollAct[] = [
  {
    id: 'act-1-arrival',
    index: 1,
    eyebrow: 'Arrival',
    accent: 'Scrape',
    title: 'You arrive with a link.',
    body: 'Forgely opens the workshop. Your store, your products, your competitors — every pixel becomes input for the AI crew.',
    backdropClass:
      'bg-gradient-to-b from-[#08080A] via-[#0E0E11] to-[#1C1C24] [background-blend-mode:multiply]',
  },
  {
    id: 'act-2-split',
    index: 2,
    eyebrow: 'Analysis',
    accent: 'Analyzer',
    title: 'The product is split, then read.',
    body: 'Vision and language models look at the same product simultaneously, mapping it to a Visual DNA that already feels like a brand.',
    backdropClass:
      'bg-gradient-to-br from-[#0E0E11] via-[#1B1B24] to-[#3C2C1F] [background-blend-mode:screen]',
  },
  {
    id: 'act-3-build',
    index: 3,
    eyebrow: 'Construction',
    accent: 'Planner · Director',
    title: 'A wireframe ignites and becomes a city.',
    body: 'Section by section, the homepage assembles itself: hero moment, value props, brand story, product showcase, social proof, CTA.',
    backdropClass:
      'bg-gradient-to-tr from-[#1C1C24] via-[#3F2615] to-[#FF6B1A] [background-blend-mode:overlay]',
  },
  {
    id: 'act-4-reveal',
    index: 4,
    eyebrow: 'Reveal',
    accent: 'Artist',
    title: '“FORGED.” The site materialises.',
    body: 'Cinematic Hero loops, Brand Story video, Product Moments — every asset rendered, color-graded and live-tested before you see it.',
    backdropClass:
      'bg-gradient-to-bl from-[#FF6B1A] via-[#C74A0A] to-[#08080A] [background-blend-mode:multiply]',
  },
  {
    id: 'act-5-proof',
    index: 5,
    eyebrow: 'Proof',
    accent: 'Compliance · SEO',
    title: 'It ships safely, indexed by humans and machines.',
    body: 'Compliance Agent sweeps the copy for FTC / FDA / GDPR, SEO ships sitemap + Schema.org, GEO ships llms.txt — all before launch.',
    backdropClass:
      'bg-gradient-to-tr from-[#08080A] via-[#1F2A1B] to-[#5A7A48] [background-blend-mode:screen]',
  },
  {
    id: 'act-6-cta',
    index: 6,
    eyebrow: 'Ignition',
    accent: 'Live',
    title: 'Your brand is one link away.',
    body: 'Forgely deploys to Cloudflare with SSL, hooks up Medusa for orders and hands you a Copilot. Five minutes from URL to storefront.',
    backdropClass:
      'bg-gradient-to-b from-[#08080A] via-[#0E0E11] to-[#FFD166] [background-blend-mode:multiply]',
  },
]
