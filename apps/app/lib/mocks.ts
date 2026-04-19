/**
 * In-memory mock dataset for the W6 dashboard.
 *
 * Keeps render output deterministic (no `Math.random` at import time) so
 * server / client HTML stays identical and Storybook snapshots are stable.
 *
 * Replace with real tRPC queries once T05 + api-client land.
 */
import type {
  BrandKit,
  Customer,
  MediaAsset,
  Order,
  Product,
  Site,
  ThemePage,
  ThemeVersion,
} from './types'

const BASE_TIME = new Date('2026-04-19T10:23:00Z').getTime()

function ago(minutes: number): string {
  return new Date(BASE_TIME - minutes * 60_000).toISOString()
}

/* ------------------------------ Sites ------------------------------ */

export const sites: Site[] = [
  {
    id: 'qiao-coffee',
    name: 'Qiao Coffee',
    domain: 'qiao-coffee.forgely.app',
    status: 'published',
    publishedAt: ago(60 * 24 * 6),
    visualDna: 'kyoto-ceramic',
    thumbnail: '☕',
    metrics: { revenue30d: 284_730, orders30d: 23, visitors30d: 1_203, conversion: 0.032 },
  },
  {
    id: 'mira-skin',
    name: 'Mira Skin',
    domain: 'shop.miraskin.com',
    status: 'published',
    publishedAt: ago(60 * 24 * 18),
    visualDna: 'clinical-wellness',
    thumbnail: '🧴',
    metrics: { revenue30d: 1_204_500, orders30d: 84, visitors30d: 9_412, conversion: 0.041 },
  },
  {
    id: 'forge-toys',
    name: 'Forge Toys',
    domain: 'forge-toys.forgely.app',
    status: 'building',
    publishedAt: null,
    visualDna: 'playful-pop',
    thumbnail: '🧸',
    metrics: { revenue30d: 0, orders30d: 0, visitors30d: 0, conversion: 0 },
  },
]

export const defaultSite = sites[0]!

/* ----------------------------- Products ---------------------------- */

export const products: Product[] = [
  {
    id: 'p_001',
    siteId: 'qiao-coffee',
    title: 'Primary Essentials Blend',
    handle: 'primary-essentials',
    status: 'active',
    inventory: 124,
    priceCents: 2400,
    compareAtCents: 3000,
    images: ['☕', '🫘', '📦'],
    collections: ['Bestsellers', 'Subscriptions'],
    vendor: 'Qiao Coffee',
    createdAt: ago(60 * 24 * 32),
    hot: true,
  },
  {
    id: 'p_002',
    siteId: 'qiao-coffee',
    title: 'Morning Light Decaf',
    handle: 'morning-light-decaf',
    status: 'active',
    inventory: 47,
    priceCents: 2200,
    images: ['🌅', '☕'],
    collections: ['Bestsellers'],
    vendor: 'Qiao Coffee',
    createdAt: ago(60 * 24 * 21),
  },
  {
    id: 'p_003',
    siteId: 'qiao-coffee',
    title: 'Ceramic Pour-Over Set',
    handle: 'ceramic-pour-over-set',
    status: 'active',
    inventory: 12,
    priceCents: 8900,
    images: ['🫖', '☕'],
    collections: ['Equipment'],
    vendor: 'Qiao Studio',
    createdAt: ago(60 * 24 * 14),
  },
  {
    id: 'p_004',
    siteId: 'qiao-coffee',
    title: 'Single-Origin Yirgacheffe',
    handle: 'yirgacheffe-single-origin',
    status: 'active',
    inventory: 6,
    priceCents: 3200,
    images: ['🌍', '🫘'],
    collections: ['Single Origin'],
    vendor: 'Qiao Coffee',
    createdAt: ago(60 * 24 * 9),
  },
  {
    id: 'p_005',
    siteId: 'qiao-coffee',
    title: 'Cold Brew Concentrate',
    handle: 'cold-brew-concentrate',
    status: 'draft',
    inventory: 0,
    priceCents: 1800,
    images: ['🧊'],
    collections: [],
    vendor: 'Qiao Coffee',
    createdAt: ago(60 * 24 * 4),
  },
  {
    id: 'p_006',
    siteId: 'qiao-coffee',
    title: 'Brewing Journal',
    handle: 'brewing-journal',
    status: 'archived',
    inventory: 0,
    priceCents: 1500,
    images: ['📓'],
    collections: ['Lifestyle'],
    vendor: 'Qiao Studio',
    createdAt: ago(60 * 24 * 90),
  },
]

/* ---------------------------- Customers ---------------------------- */

export const customers: Customer[] = [
  {
    id: 'c_001',
    siteId: 'qiao-coffee',
    name: 'Alice Tanaka',
    email: 'alice.t@example.com',
    phone: '+1 415 555 0142',
    totalSpentCents: 47_200,
    orderCount: 7,
    lastOrderAt: ago(60 * 6),
    tags: ['VIP', 'Subscriber'],
    joinedAt: ago(60 * 24 * 180),
  },
  {
    id: 'c_002',
    siteId: 'qiao-coffee',
    name: 'Daniel Park',
    email: 'dpark@example.com',
    totalSpentCents: 14_400,
    orderCount: 2,
    lastOrderAt: ago(60 * 24 * 3),
    tags: ['New'],
    joinedAt: ago(60 * 24 * 21),
  },
  {
    id: 'c_003',
    siteId: 'qiao-coffee',
    name: 'Mei Chen',
    email: 'mei@example.com',
    totalSpentCents: 124_800,
    orderCount: 12,
    lastOrderAt: ago(60 * 24 * 1),
    tags: ['VIP', 'Wholesale'],
    joinedAt: ago(60 * 24 * 365),
  },
  {
    id: 'c_004',
    siteId: 'qiao-coffee',
    name: 'Lucas Becker',
    email: 'lucas.b@example.de',
    phone: '+49 170 555 0188',
    totalSpentCents: 8_900,
    orderCount: 1,
    lastOrderAt: ago(60 * 12),
    tags: [],
    joinedAt: ago(60 * 12),
  },
  {
    id: 'c_005',
    siteId: 'qiao-coffee',
    name: 'Priya Mehta',
    email: 'priya.m@example.in',
    totalSpentCents: 33_600,
    orderCount: 4,
    lastOrderAt: ago(60 * 24 * 8),
    tags: ['Subscriber'],
    joinedAt: ago(60 * 24 * 95),
  },
]

/* ----------------------------- Orders ----------------------------- */

export const orders: Order[] = [
  {
    id: 'o_2042',
    siteId: 'qiao-coffee',
    number: '#2042',
    customerId: 'c_001',
    customerName: 'Alice Tanaka',
    status: 'paid',
    totalCents: 7_200,
    itemCount: 2,
    paymentMethod: 'stripe',
    shippingTo: { city: 'San Francisco', country: 'US' },
    items: [
      { productId: 'p_001', title: 'Primary Essentials Blend', quantity: 2, priceCents: 2400 },
      { productId: 'p_004', title: 'Single-Origin Yirgacheffe', quantity: 1, priceCents: 3200 },
    ],
    createdAt: ago(60 * 6),
    notes: 'Customer asked for grind = espresso',
  },
  {
    id: 'o_2041',
    siteId: 'qiao-coffee',
    number: '#2041',
    customerId: 'c_003',
    customerName: 'Mei Chen',
    status: 'fulfilled',
    totalCents: 28_800,
    itemCount: 9,
    paymentMethod: 'stripe',
    shippingTo: { city: 'Vancouver', country: 'CA' },
    items: [
      { productId: 'p_001', title: 'Primary Essentials Blend', quantity: 6, priceCents: 2400 },
      { productId: 'p_002', title: 'Morning Light Decaf', quantity: 3, priceCents: 2200 },
    ],
    createdAt: ago(60 * 14),
  },
  {
    id: 'o_2040',
    siteId: 'qiao-coffee',
    number: '#2040',
    customerId: 'c_004',
    customerName: 'Lucas Becker',
    status: 'shipped',
    totalCents: 8_900,
    itemCount: 1,
    paymentMethod: 'paypal',
    shippingTo: { city: 'Berlin', country: 'DE' },
    items: [
      { productId: 'p_003', title: 'Ceramic Pour-Over Set', quantity: 1, priceCents: 8900 },
    ],
    createdAt: ago(60 * 24),
  },
  {
    id: 'o_2039',
    siteId: 'qiao-coffee',
    number: '#2039',
    customerId: 'c_002',
    customerName: 'Daniel Park',
    status: 'pending',
    totalCents: 4_400,
    itemCount: 2,
    paymentMethod: 'stripe',
    shippingTo: { city: 'Seoul', country: 'KR' },
    items: [
      { productId: 'p_002', title: 'Morning Light Decaf', quantity: 2, priceCents: 2200 },
    ],
    createdAt: ago(60 * 32),
    notes: 'Waiting on bank confirmation',
  },
  {
    id: 'o_2038',
    siteId: 'qiao-coffee',
    number: '#2038',
    customerId: 'c_005',
    customerName: 'Priya Mehta',
    status: 'delivered',
    totalCents: 7_200,
    itemCount: 3,
    paymentMethod: 'stripe',
    shippingTo: { city: 'Mumbai', country: 'IN' },
    items: [
      { productId: 'p_001', title: 'Primary Essentials Blend', quantity: 3, priceCents: 2400 },
    ],
    createdAt: ago(60 * 48),
  },
  {
    id: 'o_2037',
    siteId: 'qiao-coffee',
    number: '#2037',
    customerId: 'c_001',
    customerName: 'Alice Tanaka',
    status: 'refunded',
    totalCents: 2_400,
    itemCount: 1,
    paymentMethod: 'stripe',
    shippingTo: { city: 'San Francisco', country: 'US' },
    items: [
      { productId: 'p_001', title: 'Primary Essentials Blend', quantity: 1, priceCents: 2400 },
    ],
    createdAt: ago(60 * 72),
    notes: 'Damaged in shipment',
  },
]

/* ------------------------- Revenue sparkline ----------------------- */

/** Deterministic 30-day series, in cents per day. */
export const revenueSeries30d: number[] = [
  3200, 2900, 4100, 3800, 5200, 6300, 4500, 4900, 5800, 7200, 6100, 5400, 4800, 5900, 8200, 9100,
  7800, 6900, 5300, 4700, 6200, 7400, 8800, 9600, 11_200, 9800, 8400, 9200, 10_500, 11_800,
]

/* ----------------------------- Media ------------------------------ */

export const mediaAssets: MediaAsset[] = [
  {
    id: 'm_001',
    siteId: 'qiao-coffee',
    kind: 'logo',
    source: 'uploaded',
    url: '☕',
    filename: 'qiao-coffee-primary.svg',
    sizeKb: 18,
    width: 512,
    height: 512,
    uses: 14,
    createdAt: ago(60 * 24 * 60),
  },
  {
    id: 'm_002',
    siteId: 'qiao-coffee',
    kind: 'product-photo',
    source: 'ai-generated',
    generator: 'flux',
    prompt: 'Ceramic mug on warm Japanese kinari linen, dawn light, 35mm film grain',
    url: '🫖',
    filename: 'pour-over-hero.jpg',
    sizeKb: 412,
    width: 2400,
    height: 1600,
    uses: 3,
    createdAt: ago(60 * 24 * 4),
  },
  {
    id: 'm_003',
    siteId: 'qiao-coffee',
    kind: 'lifestyle',
    source: 'ai-generated',
    generator: 'kling',
    prompt: 'Slow-motion espresso pour, golden hour, 4s loop',
    url: '🎬',
    filename: 'espresso-pour-loop.mp4',
    sizeKb: 4_120,
    width: 1920,
    height: 1080,
    uses: 1,
    createdAt: ago(60 * 24 * 2),
  },
  {
    id: 'm_004',
    siteId: 'qiao-coffee',
    kind: 'product-photo',
    source: 'library',
    url: '📦',
    filename: 'kraft-box-mockup.jpg',
    sizeKb: 320,
    width: 2000,
    height: 1500,
    uses: 0,
    createdAt: ago(60 * 24 * 9),
  },
  {
    id: 'm_005',
    siteId: 'qiao-coffee',
    kind: '3d',
    source: 'ai-generated',
    generator: 'meshy',
    prompt: 'Ceramic pour-over kettle, volumetric clay, 3D model',
    url: '🧱',
    filename: 'pour-over-3d.glb',
    sizeKb: 8_240,
    width: 0,
    height: 0,
    uses: 0,
    createdAt: ago(60 * 24 * 1),
  },
  {
    id: 'm_006',
    siteId: 'qiao-coffee',
    kind: 'icon',
    source: 'ai-generated',
    generator: 'ideogram',
    prompt: '"Q" monogram, hot brand iron, single color',
    url: '🔥',
    filename: 'q-mark.svg',
    sizeKb: 6,
    width: 96,
    height: 96,
    uses: 5,
    createdAt: ago(60 * 24 * 30),
  },
]

/* ---------------------------- BrandKit ---------------------------- */

export const brandKits: BrandKit[] = [
  {
    id: 'bk_qiao',
    siteId: 'qiao-coffee',
    name: 'Qiao Coffee',
    logo: {
      primary: '☕',
      variants: { light: '☕', dark: '🍵', favicon: '🔥', ogImage: '🌅' },
      uploaded: true,
    },
    colors: {
      primary: '#C74A0A',
      secondary: '#1F1F28',
      accent: '#FFD166',
      bg: '#F5EDE0',
      fg: '#1A1410',
      muted: '#8C7E6F',
      semantic: { success: '#22C55E', warning: '#F59E0B', error: '#EF4444' },
    },
    fonts: {
      heading: { family: 'Fraunces', weights: [400, 700], source: 'google' },
      body: { family: 'Inter', weights: [400, 500], source: 'google' },
      display: { family: 'Fraunces', weights: [200], source: 'google' },
    },
    voice: {
      tone: ['warm', 'craft', 'unhurried'],
      keywords: ['ritual', 'origin', 'morning'],
      avoidWords: ['cheap', 'instant', 'mass-produced'],
      samplePhrases: [
        'A morning worth waking up for.',
        'From the same farm, in your hands.',
      ],
    },
    imageStyle: {
      mood: ['warm', 'tactile', 'craft'],
      colorGrading: 'kinari-warm',
      composition: 'still-life',
    },
    updatedAt: ago(60 * 24 * 2),
  },
  {
    id: 'bk_mira',
    siteId: 'mira-skin',
    name: 'Mira Skin',
    logo: {
      primary: '🧴',
      variants: { light: '🧴', dark: '🧴', favicon: '🧴', ogImage: '✨' },
      uploaded: false,
    },
    colors: {
      primary: '#2D6A4F',
      secondary: '#FFFFFF',
      accent: '#A7C957',
      bg: '#F8F9F6',
      fg: '#0E2415',
      muted: '#7A8B7E',
      semantic: { success: '#22C55E', warning: '#F59E0B', error: '#EF4444' },
    },
    fonts: {
      heading: { family: 'Inter Display', weights: [500, 700], source: 'google' },
      body: { family: 'Inter', weights: [400, 500], source: 'google' },
    },
    voice: {
      tone: ['clinical', 'calm', 'precise'],
      keywords: ['barrier', 'evidence', 'science'],
      avoidWords: ['miracle', 'cure', 'detox'],
      samplePhrases: ['Backed by 12 published studies.', 'Skin science, simplified.'],
    },
    imageStyle: { mood: ['clean', 'soft'], colorGrading: 'cool-neutral', composition: 'overhead' },
    updatedAt: ago(60 * 24 * 30),
  },
]

/* --------------------------- Theme Editor -------------------------- */

export const themePages: ThemePage[] = [
  {
    id: 'home',
    name: 'Home',
    slug: '/',
    blocks: [
      {
        id: 'b_hero',
        type: 'hero',
        visible: true,
        props: {
          eyebrow: 'New · Spring Harvest',
          headline: 'A morning worth waking up for.',
          subhead: 'Single-origin beans, pulled at dawn, shipped within 7 days of roast.',
          ctaPrimary: 'Shop the blend',
          ctaSecondary: 'Read the story',
          mediaId: 'm_003',
          alignment: 'left',
          intensity: 'cinematic',
        },
      },
      {
        id: 'b_value',
        type: 'value-props',
        visible: true,
        props: {
          headline: 'Why Qiao',
          items: [
            { icon: '🌍', title: 'Direct from origin', body: 'Same farm, every bag.' },
            { icon: '🔥', title: 'Roasted weekly', body: 'Never older than 7 days.' },
            { icon: '🫘', title: 'Whole bean only', body: 'Ground at the moment of brew.' },
          ],
        },
      },
      {
        id: 'b_grid',
        type: 'product-grid',
        visible: true,
        props: { headline: 'Featured', collection: 'bestsellers', columns: 3, limit: 6 },
      },
      {
        id: 'b_testimonials',
        type: 'testimonials',
        visible: true,
        props: { headline: 'From the morning desk', layout: 'cards' },
      },
      {
        id: 'b_news',
        type: 'newsletter',
        visible: true,
        props: { headline: 'Brewed weekly', subhead: 'New origins, new rituals.' },
      },
      {
        id: 'b_footer',
        type: 'footer',
        visible: true,
        props: { columns: 4 },
      },
    ],
  },
  {
    id: 'about',
    name: 'About',
    slug: '/about',
    blocks: [
      {
        id: 'b_about_hero',
        type: 'hero',
        visible: true,
        props: {
          headline: 'A small studio in Kyoto.',
          subhead: 'We started Qiao because morning coffee deserves better than a vacuum brick.',
          alignment: 'center',
          intensity: 'editorial',
        },
      },
      { id: 'b_about_text', type: 'rich-text', visible: true, props: { body: '...' } },
      { id: 'b_about_footer', type: 'footer', visible: true, props: { columns: 4 } },
    ],
  },
  {
    id: 'collections',
    name: 'Collections',
    slug: '/collections',
    blocks: [
      { id: 'b_col_hero', type: 'hero', visible: true, props: { headline: 'Collections' } },
      { id: 'b_col_grid', type: 'product-grid', visible: true, props: { columns: 4 } },
      { id: 'b_col_footer', type: 'footer', visible: true, props: { columns: 4 } },
    ],
  },
]

export const themeVersions: ThemeVersion[] = [
  { id: 'v_24', label: 'AI: warmer tones across hero', createdAt: ago(5), source: 'ai', byline: 'Copilot' },
  { id: 'v_23', label: 'Manual edit · headline rewrite', createdAt: ago(60 * 2), source: 'manual', byline: 'You' },
  { id: 'v_22', label: 'Added testimonials block', createdAt: ago(60 * 8), source: 'manual', byline: 'You' },
  { id: 'v_21', label: 'AI: tightened spacing on mobile', createdAt: ago(60 * 24), source: 'ai', byline: 'Copilot' },
  { id: 'v_20', label: 'Autosave', createdAt: ago(60 * 24 * 2), source: 'autosave', byline: 'System' },
]

/* ---------------------------- helpers ---------------------------- */

export function getSite(id: string): Site | undefined {
  return sites.find((s) => s.id === id)
}

export function getProduct(id: string): Product | undefined {
  return products.find((p) => p.id === id)
}

export function getOrder(id: string): Order | undefined {
  return orders.find((o) => o.id === id)
}

export function getCustomer(id: string): Customer | undefined {
  return customers.find((c) => c.id === id)
}

export function getMedia(id: string): MediaAsset | undefined {
  return mediaAssets.find((m) => m.id === id)
}

export function getBrandKit(siteId: string): BrandKit | undefined {
  return brandKits.find((b) => b.siteId === siteId)
}

export function ordersForCustomer(customerId: string): Order[] {
  return orders.filter((o) => o.customerId === customerId)
}
