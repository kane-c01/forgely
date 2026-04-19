/**
 * Coupon validation + redemption.
 *
 * Pure validation lives in `previewCoupon` so the client can show the
 * effective price BEFORE the user pays. `redeemCoupon` is called from the
 * Stripe webhook (or admin grant flow) and writes a `CouponRedemption`
 * row + bumps the redemption counter atomically.
 *
 * @owner W3 (T24 follow-up)
 */

import type { Coupon } from '@prisma/client'

import { prisma } from '../db.js'
import { ForgelyError, errors } from '../errors.js'

export const COUPON_APPLIES_TO = ['subscription', 'credit_pack', 'service', 'any'] as const
export type CouponContextKind = Exclude<(typeof COUPON_APPLIES_TO)[number], 'any'>

export interface CouponPreview {
  coupon: Coupon
  /** Discount, in USD cents, that would be applied to `priceUsd`. */
  discountUsd: number
  /** New net price after discount (>= 0). */
  netUsd: number
}

/**
 * Validate a code against a target context (without redeeming).
 * Returns the discount preview or throws a typed ForgelyError.
 */
export const previewCoupon = async (params: {
  code: string
  userId: string
  context: CouponContextKind
  priceUsd: number
}): Promise<CouponPreview> => {
  const code = params.code.trim().toUpperCase()
  const coupon = await prisma.coupon.findUnique({ where: { code } })
  if (!coupon || !coupon.active) {
    throw new ForgelyError('NOT_FOUND', 'Coupon not found.', 404, { code })
  }
  const now = Date.now()
  if (coupon.startsAt && coupon.startsAt.getTime() > now) {
    throw new ForgelyError('CONFLICT', 'Coupon is not yet active.', 409, { code })
  }
  if (coupon.expiresAt && coupon.expiresAt.getTime() <= now) {
    throw new ForgelyError('CONFLICT', 'Coupon has expired.', 409, { code })
  }
  if (coupon.maxRedemptions !== null && coupon.redemptions >= coupon.maxRedemptions) {
    throw new ForgelyError('CONFLICT', 'Coupon is fully redeemed.', 409, { code })
  }
  if (coupon.appliesTo !== 'any' && coupon.appliesTo !== params.context) {
    throw new ForgelyError('CONFLICT', `Coupon does not apply to ${params.context}.`, 409, {
      code,
      appliesTo: coupon.appliesTo,
    })
  }
  if (coupon.maxPerUser !== null && coupon.maxPerUser !== undefined) {
    const used = await prisma.couponRedemption.count({
      where: { couponId: coupon.id, userId: params.userId },
    })
    if (used >= coupon.maxPerUser) {
      throw new ForgelyError('CONFLICT', 'Coupon has been used too many times.', 409, { code })
    }
  }

  const discountUsd =
    coupon.discountType === 'percent_off'
      ? Math.round((params.priceUsd * coupon.discountValue) / 100)
      : Math.min(coupon.discountValue, params.priceUsd)
  const netUsd = Math.max(0, params.priceUsd - discountUsd)

  return { coupon, discountUsd, netUsd }
}

/**
 * Atomically log a coupon redemption + bump the counter. Idempotent on
 * `(couponId, userId, context)` — calling twice with the same args is a
 * no-op (returns the existing row).
 */
export const redeemCoupon = async (params: {
  couponId: string
  userId: string
  /** e.g. "stripe_session:cs_...", "service:done_for_you" */
  context: string
  amountOffUsd: number
}): Promise<{ redemptionId: string; created: boolean }> => {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.couponRedemption.findFirst({
      where: { couponId: params.couponId, userId: params.userId, context: params.context },
      select: { id: true },
    })
    if (existing) return { redemptionId: existing.id, created: false }

    const redemption = await tx.couponRedemption.create({
      data: {
        couponId: params.couponId,
        userId: params.userId,
        context: params.context,
        amountOffUsd: params.amountOffUsd,
      },
    })
    await tx.coupon.update({
      where: { id: params.couponId },
      data: { redemptions: { increment: 1 } },
    })
    return { redemptionId: redemption.id, created: true }
  })
}

/** Convenience wrapper used by tRPC: preview + return for the UI. */
export const validateCouponForUser = async (params: {
  code: string
  userId: string
  context: CouponContextKind
  priceUsd: number
}): Promise<CouponPreview> => {
  if (params.priceUsd < 0) {
    throw errors.validation('Price must be non-negative.')
  }
  return previewCoupon(params)
}
