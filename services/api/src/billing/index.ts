/**
 * Public surface of `@forgely/api/billing`.
 *
 * @owner W3 (T24 follow-up)
 */

export { previewCoupon, redeemCoupon, validateCouponForUser } from './coupons.js'
export type { CouponPreview, CouponContextKind } from './coupons.js'
