/**
 * Local domain types for the W6 dashboard.
 *
 * These mirror the production Prisma models in `services/api/prisma/schema.prisma`
 * but are kept here so the app can render with mock data while T05/T06/T17
 * are still in flight. When the api-client ships we replace this file with
 * the generated types.
 */

export type SiteStatus = 'draft' | 'building' | 'published' | 'archived'

export interface Site {
  id: string
  name: string
  domain: string                // qiao-coffee.forgely.app or example.com
  status: SiteStatus
  publishedAt: string | null
  visualDna: string             // 'kyoto-ceramic' | ...
  thumbnail: string             // emoji used as placeholder cover
  metrics: {
    revenue30d: number          // USD cents
    orders30d: number
    visitors30d: number
    conversion: number          // 0-1
  }
}

export type ProductStatus = 'active' | 'draft' | 'archived'

export interface Product {
  id: string
  siteId: string
  title: string
  handle: string
  status: ProductStatus
  inventory: number
  priceCents: number
  compareAtCents?: number
  images: string[]              // emoji placeholders
  collections: string[]         // collection names
  vendor: string
  createdAt: string
  hot?: boolean                 // Hot product flag (§14.1)
}

export type OrderStatus =
  | 'pending'
  | 'paid'
  | 'fulfilled'
  | 'shipped'
  | 'delivered'
  | 'refunded'
  | 'cancelled'

export interface OrderItem {
  productId: string
  title: string
  quantity: number
  priceCents: number
}

export interface Order {
  id: string
  siteId: string
  number: string                // #1042
  customerId: string
  customerName: string
  status: OrderStatus
  totalCents: number
  itemCount: number
  paymentMethod: 'stripe' | 'paypal' | 'manual'
  shippingTo: { city: string; country: string }
  items: OrderItem[]
  createdAt: string
  notes?: string
}

export interface Customer {
  id: string
  siteId: string
  name: string
  email: string
  phone?: string
  totalSpentCents: number
  orderCount: number
  lastOrderAt: string | null
  tags: string[]                // 'VIP' | 'wholesale' | ...
  joinedAt: string
}

export type MediaKind =
  | 'logo'
  | 'product-photo'
  | 'lifestyle'
  | 'video'
  | '3d'
  | 'icon'

export type MediaSource = 'uploaded' | 'ai-generated' | 'library'

export interface MediaAsset {
  id: string
  siteId?: string
  kind: MediaKind
  source: MediaSource
  generator?: 'flux' | 'kling' | 'meshy' | 'ideogram'
  prompt?: string
  url: string                   // emoji placeholder
  filename: string
  sizeKb: number
  width: number
  height: number
  uses: number                  // count of places using this asset
  createdAt: string
}

export interface BrandKitColors {
  primary: string
  secondary: string
  accent: string
  bg: string
  fg: string
  muted: string
  semantic: { success: string; warning: string; error: string }
}

export interface BrandKitFont {
  family: string
  weights: number[]
  source: 'google' | 'uploaded' | 'system'
}

export interface BrandKit {
  id: string
  siteId?: string
  name: string
  logo: {
    primary: string
    variants: { light: string; dark: string; favicon: string; ogImage: string }
    uploaded: boolean
  }
  colors: BrandKitColors
  fonts: { heading: BrandKitFont; body: BrandKitFont; display?: BrandKitFont }
  voice: {
    tone: string[]
    keywords: string[]
    avoidWords: string[]
    samplePhrases: string[]
  }
  imageStyle: { mood: string[]; colorGrading: string; composition: string }
  updatedAt: string
}

/* ------------------------------------------------------------------ */
/* Theme Editor (subset of @forgely/dsl SiteDSL)                        */
/* ------------------------------------------------------------------ */

export type BlockType =
  | 'hero'
  | 'product-grid'
  | 'value-props'
  | 'testimonials'
  | 'rich-text'
  | 'newsletter'
  | 'footer'

export interface ThemeBlock {
  id: string
  type: BlockType
  visible: boolean
  props: Record<string, unknown>
}

export interface ThemePage {
  id: string
  name: string
  slug: string
  blocks: ThemeBlock[]
}

export interface ThemeVersion {
  id: string
  label: string
  createdAt: string
  source: 'manual' | 'ai' | 'autosave'
  byline: string
}

export type DevicePreset = 'desktop' | 'tablet' | 'mobile'
