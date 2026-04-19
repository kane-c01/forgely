import type { CnSelectorBundle } from '../cn-shared.js'

/**
 * Selectors for Pinduoduo PDP pages.
 *
 * PDD's web client is heavily SPA — most useful data lives in
 * `window.rawData` JSON. Selectors below cover the SSR-rendered fallback
 * (server occasionally caches the first paint on `mobile.yangkeduo.com`),
 * but the adapter prefers `extractRawData()` when available.
 */
export const PDP_SELECTORS: CnSelectorBundle = {
  title: ['meta[property="og:title"]', '.goods-name', '.product-title', 'h1'],
  price: [
    'meta[property="og:price:amount"]',
    'span.price-now',
    '.price-block .number',
    '.goods-price',
  ],
  vendor: ['.mall-name a', '.mall-name', '.shop-name'],
  description: ['meta[property="og:description"]', 'meta[name="description"]'],
  gallery: ['.goods-banner', '.banner-item', '.preview-images'],
  images: ['img'],
}

/**
 * Pinduoduo embeds a structured payload in `window.rawData`. This regex
 * captures the JSON literal so we can pull authoritative goodsName /
 * minOnSaleGroupPrice / mall info regardless of selector drift.
 */
const RAW_DATA_REGEX = /window\.rawData\s*=\s*(\{[\s\S]*?\})\s*;\s*<\/script>/

export function extractRawData(html: string): Record<string, unknown> | null {
  const match = html.match(RAW_DATA_REGEX)
  if (!match?.[1]) return null
  try {
    return JSON.parse(match[1]) as Record<string, unknown>
  } catch {
    return null
  }
}

export interface PddRawProduct {
  goodsName?: string
  minOnSaleGroupPrice?: number
  minOnSaleNormalPrice?: number
  goodsId?: number | string
  mall?: { mallName?: string; mallId?: number | string }
  thumbList?: Array<{ url: string }>
}

/** Find the goods detail block inside Pinduoduo's runtime data tree. */
export function findGoodsDetail(rawData: Record<string, unknown>): PddRawProduct | null {
  const queries = [rawData['store'], rawData['initDataObj'], rawData['initialState']]
  for (const root of queries) {
    if (!root || typeof root !== 'object') continue
    const goods = (root as Record<string, unknown>)['goods']
    if (goods && typeof goods === 'object') {
      const detail = (goods as Record<string, unknown>)['detail'] ?? goods
      if (detail && typeof detail === 'object') return detail as PddRawProduct
    }
  }
  return null
}
