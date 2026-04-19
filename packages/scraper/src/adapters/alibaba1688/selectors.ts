import type { CnSelectorBundle } from '../cn-shared.js'

/**
 * Selectors for 1688.com offer (PDP) pages — `detail.1688.com/offer/<id>.html`.
 * Selectors are stacked from "most reliable" to "fallback"; the helper
 * picks the first non-empty match.
 */
export const PDP_SELECTORS: CnSelectorBundle = {
  title: [
    'meta[property="og:title"]',
    'h1.d-title',
    'h1.title-text',
    '.mod-detail-title h1',
    'div.mod-detail-title',
  ],
  price: [
    'meta[property="og:price:amount"]',
    'span.price-now .value',
    '.mod-detail-price .price',
    '.mod-detail-price .value',
    '.price-original',
    '.price.fd-clr',
    'span.value',
  ],
  vendor: ['.company-name a', '.company-info .name', '.company-info a', '.factory-name'],
  description: [
    'meta[property="og:description"]',
    'meta[name="description"]',
    '.mod-detail-description',
  ],
  category: ['.mod-detail-bread .breadcrumb-item:nth-last-child(2)', '.bread-crumb a'],
  gallery: ['.vertical-img', '.preview-image', 'ul.detail-gallery', '.mod-detail-gallery'],
  images: ['img'],
}

/**
 * Selectors for 1688 storefront pages — `shop{shopId}.1688.com/page/offerlist.htm`.
 * These return product cards (each card → one offer link).
 */
export const SHOP_LIST_SELECTORS = {
  /** Each anchor that wraps a product card → href = offer URL. */
  cardLinks: [
    'a.offer-card',
    'a.list-item',
    '.product-list a[href*="/offer/"]',
    'a[href*="detail.1688.com/offer"]',
  ],
}

/**
 * Selectors for 1688 search results (`/search.html?keywords=...`).
 */
export const SEARCH_RESULTS_SELECTORS = {
  cardLinks: ['a.organic-list-offer', '.offer-list-item a', '.J-offer-wrapper a[href*="/offer/"]'],
}
