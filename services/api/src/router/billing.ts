/**
 * `billing.*` tRPC router — subscription + credit-pack checkout, customer
 * portal, plan / package catalog. Webhook handling is on its own HTTP route
 * (apps/app/app/api/stripe/webhook/route.ts → handleStripeWebhook).
 *
 * @owner W3 (T24)
 */

import { z } from 'zod'

import { validateCouponForUser } from '../billing/coupons.js'
import type { CouponContextKind } from '../billing/coupons.js'
import { prisma } from '../db.js'
import {
  createBillingPortalSession,
  createCreditPackCheckout,
  createSubscriptionCheckout,
} from '../stripe/index.js'

import { protectedProcedure, publicProcedure, router } from './trpc.js'

const PreviewCouponInput = z.object({
  code: z.string().trim().min(1).max(64),
  context: z.enum(['subscription', 'credit_pack', 'service']),
  /** Optional resolved price (cents). Caller should supply for preview UX. */
  priceUsd: z.number().int().nonnegative().max(10_000_000),
})

const SubscriptionCheckoutInput = z.object({
  planSlug: z.enum(['starter', 'pro', 'agency']),
  cadence: z.enum(['monthly', 'yearly']),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
  couponId: z.string().optional(),
})

const CreditPackCheckoutInput = z.object({
  packageSlug: z.string().min(1),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
})

const PortalInput = z.object({
  returnUrl: z.string().url().optional(),
})

export const billingRouter = router({
  /** Plan + credit-pack catalog. Public so the marketing site can render Pricing. */
  catalog: publicProcedure.query(async () => {
    const [plans, packages] = await Promise.all([
      prisma.plan.findMany({
        where: { active: true },
        orderBy: { sortOrder: 'asc' },
      }),
      prisma.creditsPackage.findMany({
        where: { active: true },
        orderBy: { sortOrder: 'asc' },
      }),
    ])
    return { plans, packages }
  }),

  /** Authenticated user's current subscription summary (or null on free). */
  subscription: protectedProcedure.query(async ({ ctx }) => {
    return prisma.subscription.findUnique({
      where: { userId: ctx.user.id },
    })
  }),

  /** Recent purchases (purchase / refund / subscription) — for the Billing page. */
  invoices: protectedProcedure
    .input(z.object({ limit: z.number().int().min(1).max(50).optional() }).optional())
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 20
      return prisma.creditTransaction.findMany({
        where: {
          userId: ctx.user.id,
          type: { in: ['purchase', 'subscription', 'refund'] },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      })
    }),

  /** Start a Stripe Checkout for a credit pack. */
  startCreditPackCheckout: protectedProcedure
    .input(CreditPackCheckoutInput)
    .mutation(async ({ ctx, input }) => {
      return createCreditPackCheckout({ userId: ctx.user.id, ...input })
    }),

  /** Start a Stripe Checkout for a recurring subscription. */
  startSubscriptionCheckout: protectedProcedure
    .input(SubscriptionCheckoutInput)
    .mutation(async ({ ctx, input }) => {
      return createSubscriptionCheckout({ userId: ctx.user.id, ...input })
    }),

  /** Stripe Customer Portal — self-serve cancel / upgrade / change card. */
  openCustomerPortal: protectedProcedure
    .input(PortalInput.optional())
    .mutation(async ({ ctx, input }) => {
      return createBillingPortalSession({
        userId: ctx.user.id,
        returnUrl: input?.returnUrl,
      })
    }),

  /** Validate a coupon code against a target context (no redemption yet). */
  previewCoupon: protectedProcedure.input(PreviewCouponInput).mutation(async ({ ctx, input }) => {
    const preview = await validateCouponForUser({
      code: input.code,
      userId: ctx.user.id,
      context: input.context as CouponContextKind,
      priceUsd: input.priceUsd,
    })
    return {
      code: preview.coupon.code,
      description: preview.coupon.description,
      discountType: preview.coupon.discountType,
      discountValue: preview.coupon.discountValue,
      discountUsd: preview.discountUsd,
      netUsd: preview.netUsd,
    }
  }),
})
