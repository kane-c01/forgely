import type { CnSelectorBundle } from '../cn-shared.js'

/**
 * Selectors for JD.com PDP pages — `item.jd.com/<sku>.html` (also jd.hk).
 *
 * JD price is typically loaded by a separate XHR (`p.3.cn`); when the
 * upstream renderer (Playwright / ScraperAPI render=true) lets the JS
 * settle, the `.p-price` markup is hydrated. We also accept the
 * server-injected `og:price:amount` meta as a fast path.
 */
export const PDP_SELECTORS: CnSelectorBundle = {
  title: [
    'meta[property="og:title"]',
    'div.sku-name',
    '.itemInfo-wrap .sku-name',
    'h1.product-title',
  ],
  price: [
    'meta[property="og:price:amount"]',
    'span.p-price .price',
    '.summary-price .p-price .price',
    '.price.J-p-price',
  ],
  vendor: ['.J-hove-wrap .name a', '.seller-infor a', '#popbox .name', '.crumb-wrap .crumb-list a'],
  description: ['meta[property="og:description"]', 'meta[name="description"]', '#J-detail-content'],
  gallery: ['#spec-list', '.preview-pic', '.lh', '#preview'],
  images: ['img'],
}

/**
 * Selectors for JD search list pages — `search.jd.com/Search?keyword=...`.
 */
export const SEARCH_SELECTORS = {
  cardLinks: ['.gl-item .p-img a', 'li.gl-item a[href*="item.jd.com"]'],
}
