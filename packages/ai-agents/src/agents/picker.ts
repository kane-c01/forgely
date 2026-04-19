/**
 * Picker Agent — surface the 3 most "hero-worthy" products from a catalog.
 *
 * Used by the Conversation Agent at the `choosing_hero` stage so the
 * UI can render an `expects.kind = 'product'` card grid for the user.
 *
 * Scoring (docs/MASTER.md §14.1):
 *   • visual quality   — clear product photo on a clean background
 *   • differentiation  — uncommon SKU / colour / category
 *   • price velocity   — neither bargain-bin nor luxury outlier
 *   • inventory        — stock > 10 (a hero block selling an out-of-stock
 *                        product is the worst customer experience)
 *
 * For MVP the implementation is a deterministic heuristic; a follow-up
 * Sprint will swap in a CLIP / Vision model. Either way the output
 * shape stays the same so the Conversation Agent doesn't change.
 *
 * @owner W6 (Sprint 3 — task #6)
 */

import { z } from 'zod'

/* ───────────────────── Public types ──────────────────────────── */

export const PickerProductSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(200),
  /** Cents in the catalogue currency (we don't try to FX here). */
  priceCents: z.number().int().nonnegative(),
  currency: z.string().length(3).default('USD'),
  /** First product image URL — already deduped / normalised by Scraper. */
  imageUrl: z.string().url().optional(),
  /** Inventory quantity if known. `undefined` means the source didn't expose it. */
  inventory: z.number().int().nonnegative().optional(),
  /** Free-form vendor tag — used for differentiation scoring. */
  vendor: z.string().max(120).optional(),
  /** Raw collection / category labels from the source store. */
  collections: z.array(z.string()).default([]),
  /** Created-at ISO so we can lightly favour fresher items. */
  createdAt: z.string().datetime().optional(),
})

export type PickerProduct = z.infer<typeof PickerProductSchema>

export interface PickerCandidate {
  product: PickerProduct
  /** Total composite score — higher is more hero-worthy. */
  score: number
  /** Ordered list of human-readable reasons we ranked it where we did. */
  reasons: string[]
  /** Per-axis breakdown so the UI can show "why" if asked. */
  breakdown: {
    visual: number
    differentiation: number
    price: number
    inventory: number
  }
}

export interface PickerOptions {
  /** How many candidates to surface — defaults to 3. */
  limit?: number
  /** Optional currency hint for price-band heuristics. */
  currency?: string
  /** Optional locale-aware median if the caller already has it. */
  catalogueMedianCents?: number
}

/* ───────────────────── Implementation ────────────────────────── */

const MIN_INVENTORY_FOR_HERO = 10
const VISUAL_BONUS_FOR_LARGE_IMAGE = 0.15

function median(nums: readonly number[]): number {
  if (nums.length === 0) return 0
  const sorted = [...nums].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0 ? (sorted[mid - 1]! + sorted[mid]!) / 2 : sorted[mid]!
}

function scoreVisual(p: PickerProduct): number {
  if (!p.imageUrl) return 0.2
  // Heuristic: longer URL slugs often imply CDN-served, image-optimised
  // assets vs. tiny raw uploads. A real implementation runs CLIP here.
  const lengthBonus = Math.min(0.4, p.imageUrl.length / 400)
  return 0.5 + lengthBonus + (p.imageUrl.endsWith('.webp') ? VISUAL_BONUS_FOR_LARGE_IMAGE : 0)
}

function scoreDifferentiation(p: PickerProduct, all: readonly PickerProduct[]): number {
  if (all.length <= 1) return 0.5
  const sameVendor = all.filter((q) => q.vendor && q.vendor === p.vendor).length
  const vendorRarity = 1 - sameVendor / all.length
  const collectionRarity =
    p.collections.length === 0
      ? 0.4
      : 1 -
        p.collections.reduce(
          (acc, c) => acc + all.filter((q) => q.collections.includes(c)).length / all.length,
          0,
        ) /
          p.collections.length
  return Math.min(1, 0.3 + 0.4 * vendorRarity + 0.3 * collectionRarity)
}

function scorePrice(p: PickerProduct, medianCents: number): number {
  if (medianCents === 0 || p.priceCents === 0) return 0.4
  const ratio = p.priceCents / medianCents
  // Best around 1×–2× median. Drop sharply outside [0.3, 5].
  if (ratio < 0.3 || ratio > 5) return 0.1
  if (ratio < 0.7) return 0.5
  if (ratio <= 2) return 1
  if (ratio <= 3) return 0.7
  return 0.3
}

function scoreInventory(p: PickerProduct): number {
  if (p.inventory === undefined) return 0.6
  if (p.inventory === 0) return 0
  if (p.inventory < MIN_INVENTORY_FOR_HERO) return 0.4
  if (p.inventory < 50) return 0.85
  return 1
}

function compositeReasons(b: PickerCandidate['breakdown']): string[] {
  const reasons: string[] = []
  if (b.visual >= 0.7) reasons.push('Strong product photography')
  else if (b.visual <= 0.3) reasons.push('Image quality is borderline — replace before launch')
  if (b.differentiation >= 0.7) reasons.push('Stands out from rest of catalogue')
  if (b.price >= 0.85) reasons.push('Priced at the catalogue sweet spot')
  else if (b.price <= 0.3) reasons.push('Price sits at an outlier band — risk for hero')
  if (b.inventory === 0) reasons.push('Out of stock — cannot be the hero')
  else if (b.inventory >= 0.85) reasons.push('Plenty in stock')
  return reasons.length > 0 ? reasons : ['Solid all-rounder candidate']
}

/**
 * Rank a list of products by hero-worthiness. Pure function — no I/O,
 * no LLM calls — so it's safe to call inside a tight loop or unit test.
 */
export function rankProducts(
  products: readonly PickerProduct[],
  opts: PickerOptions = {},
): PickerCandidate[] {
  const { limit = 3, catalogueMedianCents } = opts
  if (products.length === 0) return []

  const medianCents = catalogueMedianCents ?? median(products.map((p) => p.priceCents))

  const candidates: PickerCandidate[] = products.map((p) => {
    const breakdown = {
      visual: scoreVisual(p),
      differentiation: scoreDifferentiation(p, products),
      price: scorePrice(p, medianCents),
      inventory: scoreInventory(p),
    }
    // Out-of-stock is an absolute disqualifier for the hero block.
    if (breakdown.inventory === 0) {
      return {
        product: p,
        breakdown,
        score: 0,
        reasons: compositeReasons(breakdown),
      }
    }
    const score =
      0.35 * breakdown.visual +
      0.2 * breakdown.differentiation +
      0.25 * breakdown.price +
      0.2 * breakdown.inventory
    return { product: p, breakdown, score, reasons: compositeReasons(breakdown) }
  })

  return candidates
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}

/**
 * Convenience helper that adapts an arbitrary `unknown[]` (e.g. from a
 * Scraper output that hasn't been validated) into the Picker shape and
 * runs `rankProducts`. Invalid rows are silently skipped.
 */
export function rankUnknownProducts(rows: unknown[], opts?: PickerOptions): PickerCandidate[] {
  const valid: PickerProduct[] = []
  for (const row of rows) {
    const parsed = PickerProductSchema.safeParse(row)
    if (parsed.success) valid.push(parsed.data)
  }
  return rankProducts(valid, opts)
}
