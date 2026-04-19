import type { CnSelectorBundle } from '../cn-shared.js'

/**
 * Selectors for Taobao + Tmall PDP pages.
 * Both share the Alibaba detail.htm template; Tmall's flagship-store URL
 * (`detail.tmall.com`) returns a slightly different markup layered on top
 * of the same skeleton. The bundle handles both.
 */
export const PDP_SELECTORS: CnSelectorBundle = {
  title: [
    'meta[property="og:title"]',
    'h3.tb-main-title',
    '.tb-detail-hd h1',
    'h1[data-spm="1000983"]',
    '.tm-title',
    'h1.tb-title',
  ],
  price: [
    'meta[property="og:price:amount"]',
    '.tm-price',
    '.tb-rmb-num',
    '.price.J_price.J_actualPrice em',
    '.tb-promo-price .tb-rmb-num',
    '.tb-detail-price',
  ],
  vendor: [
    'a.shop-name-link',
    '.slogo-shopname strong',
    'meta[property="og:site_name"]',
    '.shop-detail-name',
  ],
  description: ['meta[property="og:description"]', 'meta[name="description"]', '.tb-detail-desc'],
  gallery: ['#J_UlThumb', '.tb-thumb', '.tm-clear .tb-pic'],
  images: ['img'],
}

/**
 * Selectors for Taobao seller comment pages (`comment.taobao.com`). Used
 * by the optional rating/review collector.
 */
export const COMMENT_SELECTORS = {
  ratingScore: ['.J_RateScore', '.tb-rate .score', '.shop-rate-score'],
  /** Item count text — "100+ 评价". */
  reviewCount: ['.J_ReviewCount', '.tb-rate-count', '.shop-rate-count'],
}

/**
 * Markers we look for in the rendered HTML to detect the slider/captcha
 * page. When present we MUST switch to a fresh cookie / proxy rather than
 * trying to parse — the title selector would otherwise return "请输入验证码".
 */
export const ANTIBOT_MARKERS = [
  '滑动验证',
  '请输入验证码',
  'nc_iconfont',
  'baxia-dialog',
  'punish-text',
]

/**
 * Extract the `_m_h5_tk` token from a Taobao response. The token is needed
 * to call internal mtop endpoints (e.g. mobile reviews). Returns `null`
 * when the cookie isn't set yet.
 */
export function extractMh5Token(headers: Headers | string): string | null {
  const cookie = typeof headers === 'string' ? headers : (headers.get('set-cookie') ?? '')
  const match = cookie.match(/_m_h5_tk=([^;_]+)/)
  return match?.[1] ?? null
}
