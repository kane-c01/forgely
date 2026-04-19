/**
 * 5 representative `ScrapedData` fixtures used by the analyzer test suite.
 *
 * Every fixture pairs a store with the *expected* dominant Visual DNA so we
 * can assert that the agent recommends correctly. The fixtures are kept
 * intentionally lean (1-3 products each) to keep the prompts deterministic.
 */
import type { ScrapedData } from '@forgely/scraper'

import type { VisualDnaId } from '../../types/dna'

interface Fixture {
  label: string
  data: ScrapedData
  expectedDna: VisualDnaId
  expectedCategoryRoot: string
}

const baseScrape = (overrides: Partial<ScrapedData>): ScrapedData => ({
  source: 'shopify',
  sourceUrl: 'https://example.com',
  store: {
    name: 'Example',
    description: '',
    currency: 'USD',
    language: 'en',
    domain: 'example.com',
  },
  products: [],
  collections: [],
  screenshots: { homepage: 'https://cdn.test/example.jpg' },
  scrapedAt: new Date('2026-04-19T00:00:00Z'),
  confidence: 0.95,
  ...overrides,
})

export const FIXTURES: Fixture[] = [
  {
    label: 'toybloom-nordic',
    expectedDna: 'nordic_minimal',
    expectedCategoryRoot: 'toy',
    data: baseScrape({
      sourceUrl: 'https://toybloom.myshopify.com',
      store: {
        name: 'ToyBloom',
        description: 'Handcrafted Scandinavian wooden toys, made in small batches.',
        currency: 'USD',
        language: 'en',
        domain: 'toybloom.myshopify.com',
      },
      products: [
        {
          id: 'p1',
          handle: 'rainbow-stacker',
          title: 'Rainbow Stacker',
          description: 'Hand-sanded beech wood, water-based paint. Designed in Stockholm.',
          tags: ['wooden', 'open-ended'],
          images: [],
          variants: [],
          priceFrom: { amountCents: 4800, currency: 'USD' },
          available: true,
          url: 'https://toybloom.myshopify.com/products/rainbow-stacker',
          category: 'wooden_toys',
        },
        {
          id: 'p2',
          handle: 'silk-scarves',
          title: 'Silk Play Scarves',
          description: 'Set of 6 hand-dyed silk scarves for imaginative play.',
          tags: ['silk', 'open-ended'],
          images: [],
          variants: [],
          priceFrom: { amountCents: 2800, currency: 'USD' },
          available: true,
          url: 'https://toybloom.myshopify.com/products/silk-scarves',
          category: 'wooden_toys',
        },
      ],
    }),
  },
  {
    label: 'liquidlab-pop',
    expectedDna: 'playful_pop',
    expectedCategoryRoot: 'beverage',
    data: baseScrape({
      sourceUrl: 'https://drinkliquidlab.com',
      store: {
        name: 'Liquid Lab',
        description: 'Functional sparkling drinks. Loud cans, calm minds.',
        currency: 'USD',
        language: 'en',
        domain: 'drinkliquidlab.com',
      },
      products: [
        {
          id: 'p1',
          handle: 'mood-yuzu',
          title: 'Mood — Yuzu Spritz',
          description: 'Adaptogen-loaded sparkling water in a screaming-yellow can. 0g sugar.',
          tags: ['adaptogen', 'sparkling'],
          images: [],
          variants: [],
          priceFrom: { amountCents: 350, currency: 'USD' },
          available: true,
          url: 'https://drinkliquidlab.com/p/mood-yuzu',
          category: 'beverage',
        },
      ],
    }),
  },
  {
    label: 'forge-skin-clinical',
    expectedDna: 'clinical_wellness',
    expectedCategoryRoot: 'skincare',
    data: baseScrape({
      sourceUrl: 'https://forgeskin.com',
      store: {
        name: 'Forge Skin',
        description: 'Peer-reviewed actives. Pharmacist-formulated. No fragrance.',
        currency: 'USD',
        language: 'en',
        domain: 'forgeskin.com',
      },
      products: [
        {
          id: 'p1',
          handle: 'retinal-024',
          title: 'Retinal 0.24%',
          description: 'Stabilised retinaldehyde in a squalane base. Clinically tested.',
          tags: ['retinal', 'actives'],
          images: [],
          variants: [],
          priceFrom: { amountCents: 4900, currency: 'USD' },
          available: true,
          url: 'https://forgeskin.com/p/retinal-024',
          category: 'skincare',
        },
      ],
    }),
  },
  {
    label: 'kintsugi-ceramic',
    expectedDna: 'kyoto_ceramic',
    expectedCategoryRoot: 'ceramic',
    data: baseScrape({
      sourceUrl: 'https://kintsugihouse.jp',
      store: {
        name: 'Kintsugi House',
        description: 'Slow ceramics from a small Kyoto studio. Wood-fired.',
        currency: 'JPY',
        language: 'en',
        domain: 'kintsugihouse.jp',
      },
      products: [
        {
          id: 'p1',
          handle: 'matcha-bowl',
          title: 'Matcha Bowl — Hagi',
          description: 'Hand-thrown bowl in pale hagi clay. Each piece unique.',
          tags: ['ceramic', 'tea'],
          images: [],
          variants: [],
          priceFrom: { amountCents: 9800, currency: 'JPY' },
          available: true,
          url: 'https://kintsugihouse.jp/p/matcha-bowl',
          category: 'ceramic_tea',
        },
      ],
    }),
  },
  {
    label: 'voltage-tech',
    expectedDna: 'tech_precision',
    expectedCategoryRoot: 'electronic',
    data: baseScrape({
      sourceUrl: 'https://voltage.studio',
      store: {
        name: 'Voltage Studio',
        description: 'Modular desk gear for engineers.',
        currency: 'USD',
        language: 'en',
        domain: 'voltage.studio',
      },
      products: [
        {
          id: 'p1',
          handle: 'kvm-pro',
          title: 'KVM Pro 4K',
          description: 'Two-port DisplayPort 1.4 KVM with USB-C PD passthrough.',
          tags: ['kvm', 'pro-audio'],
          images: [],
          variants: [],
          priceFrom: { amountCents: 24900, currency: 'USD' },
          available: true,
          url: 'https://voltage.studio/p/kvm-pro',
          category: 'electronics',
        },
      ],
    }),
  },
]

/** Expected canned mock outputs that match each fixture. */
export const FIXTURE_MOCKS: Record<
  string,
  {
    vision: {
      visualQuality: number
      dominantColors: string[]
      typographyClass: string
      weaknesses: string[]
      moodKeywords: string[]
    }
    text: {
      brandArchetype: string
      category: string
      priceSegment: string
      referenceBrands: string[]
      toneOfVoice: string[]
      targetCustomer: {
        persona: string
        ageRange: [number, number]
        regions: string[]
        motivations: string[]
      }
      recommendedDNA: string
      opportunity: string
    }
  }
> = {
  'toybloom-nordic': {
    vision: {
      visualQuality: 4,
      dominantColors: ['#FFFFFF', '#E8DDD2', '#3A3A3A'],
      typographyClass: 'utility sans (Helvetica)',
      weaknesses: ['default Shopify hero', 'no strong type hierarchy'],
      moodKeywords: ['warm', 'natural', 'wood'],
    },
    text: {
      brandArchetype: 'Caregiver',
      category: 'wooden_toys',
      priceSegment: 'premium',
      referenceBrands: ["Grimm's", 'Oeuf NYC'],
      toneOfVoice: ['warm', 'minimal'],
      targetCustomer: {
        persona: 'Mindful Millennial Parent',
        ageRange: [28, 42],
        regions: ['US', 'EU'],
        motivations: ['Scandinavian aesthetic', 'sustainability'],
      },
      recommendedDNA: 'nordic_minimal',
      opportunity: 'Lift the brand from generic Shopify to a cinematic Nordic boutique.',
    },
  },
  'liquidlab-pop': {
    vision: {
      visualQuality: 6,
      dominantColors: ['#FFEB3B', '#FF6B1A', '#000000'],
      typographyClass: 'condensed display + utility sans',
      weaknesses: ['cluttered hero stack'],
      moodKeywords: ['loud', 'pop', 'energetic'],
    },
    text: {
      brandArchetype: 'Jester',
      category: 'beverage',
      priceSegment: 'mid',
      referenceBrands: ['Recess', 'Olipop'],
      toneOfVoice: ['playful', 'bold'],
      targetCustomer: {
        persona: 'Burnout Gen-Z Creative',
        ageRange: [22, 32],
        regions: ['US'],
        motivations: ['dopamine hit', 'no sugar'],
      },
      recommendedDNA: 'playful_pop',
      opportunity: 'Bring the can-art energy onto the homepage with M01 Liquid Bath hero.',
    },
  },
  'forge-skin-clinical': {
    vision: {
      visualQuality: 5,
      dominantColors: ['#0F1A22', '#C9A96E', '#FFFFFF'],
      typographyClass: 'modern serif + sans body',
      weaknesses: ['feels like a template'],
      moodKeywords: ['scientific', 'cool'],
    },
    text: {
      brandArchetype: 'Sage',
      category: 'skincare',
      priceSegment: 'premium',
      referenceBrands: ['Aesop', 'BIOLOGICA'],
      toneOfVoice: ['scientific', 'minimal'],
      targetCustomer: {
        persona: 'Discerning Beauty Editor',
        ageRange: [30, 50],
        regions: ['US', 'EU', 'GB'],
        motivations: ['evidence-based formulations', 'no fragrance'],
      },
      recommendedDNA: 'clinical_wellness',
      opportunity: 'Build credibility with M05 Droplet Ripple + ingredient ballet.',
    },
  },
  'kintsugi-ceramic': {
    vision: {
      visualQuality: 7,
      dominantColors: ['#FEFDFB', '#8B5A3C', '#2D2A26'],
      typographyClass: 'humanist serif',
      weaknesses: ['hero is a static studio shot'],
      moodKeywords: ['serene', 'natural'],
    },
    text: {
      brandArchetype: 'Creator',
      category: 'ceramic_tea',
      priceSegment: 'luxury',
      referenceBrands: ['Heath Ceramics', 'Blue Bottle'],
      toneOfVoice: ['serene', 'editorial'],
      targetCustomer: {
        persona: 'Slow-living Tea Aficionado',
        ageRange: [32, 60],
        regions: ['JP', 'US', 'EU'],
        motivations: ['handmade objects', 'tea ritual'],
      },
      recommendedDNA: 'kyoto_ceramic',
      opportunity: 'Slow the page down to breathe with M04 Breathing Still.',
    },
  },
  'voltage-tech': {
    vision: {
      visualQuality: 6,
      dominantColors: ['#0A0A0A', '#1F1F28', '#00D9FF'],
      typographyClass: 'geometric sans + mono',
      weaknesses: ['feature blocks read like spec sheets'],
      moodKeywords: ['precision', 'cool'],
    },
    text: {
      brandArchetype: 'Magician',
      category: 'electronics',
      priceSegment: 'premium',
      referenceBrands: ['Apple', 'Nothing', 'Framework'],
      toneOfVoice: ['professional', 'futuristic'],
      targetCustomer: {
        persona: 'Senior Engineer at a hardware-adjacent SaaS',
        ageRange: [25, 45],
        regions: ['US', 'EU', 'GB'],
        motivations: ['needs reliable desk gear', 'appreciates industrial aesthetics'],
      },
      recommendedDNA: 'tech_precision',
      opportunity: 'Adopt M03 Light Sweep over a fixed-camera hero to sell the metalwork.',
    },
  },
}
