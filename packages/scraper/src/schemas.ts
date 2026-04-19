import { z } from 'zod'

export const moneyAmountSchema = z.object({
  amountCents: z.number().int().nonnegative(),
  currency: z.string().length(3).toUpperCase(),
  raw: z.string().optional(),
})

export const scrapedImageSchema = z.object({
  url: z.string().url(),
  storedUrl: z.string().url().optional(),
  alt: z.string().optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
})

export const scrapedVariantSchema = z.object({
  id: z.string().min(1),
  title: z.string(),
  sku: z.string().optional(),
  price: moneyAmountSchema,
  compareAtPrice: moneyAmountSchema.optional(),
  available: z.boolean(),
  inventoryQuantity: z.number().int().optional(),
  options: z.record(z.string()).optional(),
  imageUrl: z.string().url().optional(),
})

export const scrapedProductSchema = z.object({
  id: z.string().min(1),
  handle: z.string().min(1),
  title: z.string().min(1),
  description: z.string(),
  descriptionHtml: z.string().optional(),
  vendor: z.string().optional(),
  productType: z.string().optional(),
  tags: z.array(z.string()),
  images: z.array(scrapedImageSchema),
  variants: z.array(scrapedVariantSchema),
  priceFrom: moneyAmountSchema,
  available: z.boolean(),
  url: z.string().url(),
  category: z.string().optional(),
  reviewCount: z.number().int().nonnegative().optional(),
  rating: z.number().min(0).max(5).optional(),
})

export const scrapedCollectionSchema = z.object({
  id: z.string().min(1),
  handle: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  productCount: z.number().int().nonnegative().optional(),
  productIds: z.array(z.string()),
  url: z.string().url(),
  image: scrapedImageSchema.optional(),
})

export const scrapedStoreSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  logo: z.string().url().optional(),
  currency: z.string().length(3).toUpperCase(),
  language: z.string().min(2),
  domain: z.string().min(1),
})

export const scrapedScreenshotsSchema = z.object({
  homepage: z.string().url().optional(),
  productPage: z.string().url().optional(),
  categoryPage: z.string().url().optional(),
})

export const scrapedDataSchema = z.object({
  source: z.enum([
    'shopify',
    'woocommerce',
    'amazon',
    'aliexpress',
    'alibaba_1688',
    'taobao',
    'jd',
    'etsy',
    'generic_ai',
    'unknown',
  ]),
  sourceUrl: z.string().url(),
  store: scrapedStoreSchema,
  products: z.array(scrapedProductSchema),
  collections: z.array(scrapedCollectionSchema),
  screenshots: scrapedScreenshotsSchema,
  scrapedAt: z.date(),
  confidence: z.number().min(0).max(1),
  meta: z.record(z.unknown()).optional(),
})

export type ScrapedDataInput = z.input<typeof scrapedDataSchema>
export type ScrapedDataOutput = z.output<typeof scrapedDataSchema>
