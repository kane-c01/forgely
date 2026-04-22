/**
 * `billing.*` tRPC router — subscription + credit-pack checkout, customer
 * portal, plan / package catalog, **plus** CN payment checkout (wechat/alipay)
 * and success-polling.
 *
 * Webhook handling is on its own HTTP route:
 *   - apps/app/app/api/webhooks/stripe/route.ts → handleStripeWebhook
 *   - apps/app/app/api/webhooks/wechat/route.ts → WechatPayProvider.verifyWebhook → activateCnSubscription
 *   - apps/app/app/api/webhooks/alipay/route.ts → AlipayProvider.verifyWebhook → activateCnSubscription
 *
 * @owner W3 (T24) + W4 (CN payments real)
 */

import { z } from 'zod'

import { validateCouponForUser } from '../billing/coupons.js'
import type { CouponContextKind } from '../billing/coupons.js'
import { prisma } from '../db.js'
import { ForgelyError } from '../errors.js'
import {
  CN_PLAN_PRICE_CNY_FEN,
  checkCnPaymentStatus,
  generateCnOrderId,
  getPaymentProvider,
  rememberCheckoutContext,
} from '../payments/index.js'
import {
  createBillingPortalSession,
  createCreditPackCheckout,
  createSubscriptionCheckout,
} from '../stripe/index.js'

import { protectedProcedure, publicProcedure, router } from './trpc.js'

const PLAN_ENUM = z.enum(['starter', 'pro', 'agency'])
const CADENCE_ENUM = z.enum(['monthly', 'yearly'])

const PreviewCouponInput = z.object({
  code: z.string().trim().min(1).max(64),
  context: z.enum(['subscription', 'credit_pack', 'service']),
  priceUsd: z.number().int().nonnegative().max(10_000_000),
})

const SubscriptionCheckoutInput = z.object({
  planSlug: PLAN_ENUM,
  cadence: CADENCE_ENUM,
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

const WechatCheckoutInput = z.object({
  planSlug: PLAN_ENUM,
  cadence: CADENCE_ENUM,
  /** `native` = PC 扫码；`h5` = 手机浏览器；`jsapi` = 公众号内；`mini` = 小程序。 */
  scene: z.enum(['native', 'h5', 'jsapi', 'mini']).default('native'),
  wechatOpenid: z.string().min(1).max(128).optional(),
  returnUrl: z.string().url().optional(),
})

const AlipayCheckoutInput = z.object({
  planSlug: PLAN_ENUM,
  cadence: CADENCE_ENUM,
  /** `native` = PC 扫码；`wap` = 移动网页；`pc` = PC 网页跳转。 */
  scene: z.enum(['native', 'wap', 'pc']).default('native'),
  returnUrl: z.string().url().optional(),
})

const CheckPaymentInput = z.object({
  orderId: z.string().min(1).max(128),
})

/** Resolve the CN price for a plan + cadence (in RMB fen). Plan.features can
 * override via `priceCnyMonthlyFen` / `priceCnyYearlyFen`; otherwise fall back. */
const resolveCnPriceFen = async (
  planSlug: string,
  cadence: 'monthly' | 'yearly',
): Promise<number> => {
  const plan = await prisma.plan.findUnique({ where: { slug: planSlug } })
  const features = plan?.features as Record<string, unknown> | null | undefined
  const fromPlanFeatures =
    cadence === 'monthly'
      ? (features?.priceCnyMonthlyFen as number | undefined)
      : (features?.priceCnyYearlyFen as number | undefined)
  if (fromPlanFeatures && fromPlanFeatures > 0) return fromPlanFeatures
  const fallback = CN_PLAN_PRICE_CNY_FEN[planSlug]
  if (!fallback) {
    throw new ForgelyError('CN_PLAN_UNKNOWN', `未知 CN 计划：${planSlug}`, 400)
  }
  return cadence === 'monthly' ? fallback.monthly : fallback.yearly
}

export const billingRouter = router({
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

  subscription: protectedProcedure.query(async ({ ctx }) => {
    return prisma.subscription.findUnique({
      where: { userId: ctx.user.id },
    })
  }),

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

  /** Ledger transactions (any type). Used by the Billing history tab. */
  listTransactions: protectedProcedure
    .input(
      z
        .object({
          limit: z.number().int().min(1).max(100).optional(),
          cursor: z.string().optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 25
      const rows = await prisma.creditTransaction.findMany({
        where: { userId: ctx.user.id },
        orderBy: { createdAt: 'desc' },
        take: limit + 1,
        ...(input?.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
      })
      const nextCursor = rows.length > limit ? (rows[limit]?.id ?? null) : null
      return { items: rows.slice(0, limit), nextCursor }
    }),

  startCreditPackCheckout: protectedProcedure
    .input(CreditPackCheckoutInput)
    .mutation(async ({ ctx, input }) => {
      return createCreditPackCheckout({ userId: ctx.user.id, ...input })
    }),

  startSubscriptionCheckout: protectedProcedure
    .input(SubscriptionCheckoutInput)
    .mutation(async ({ ctx, input }) => {
      return createSubscriptionCheckout({ userId: ctx.user.id, ...input })
    }),

  openCustomerPortal: protectedProcedure
    .input(PortalInput.optional())
    .mutation(async ({ ctx, input }) => {
      return createBillingPortalSession({
        userId: ctx.user.id,
        returnUrl: input?.returnUrl,
      })
    }),

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

  // ─── CN Payments ────────────────────────────────────────────────────────

  /** Create a WeChat Pay checkout — returns QR / redirect / jsapi params. */
  createWechatPayCheckout: protectedProcedure
    .input(WechatCheckoutInput)
    .mutation(async ({ ctx, input }) => {
      const amount = await resolveCnPriceFen(input.planSlug, input.cadence)
      const orderId = generateCnOrderId({
        channel: 'wechat',
        userId: ctx.user.id,
        planSlug: input.planSlug,
      })
      const provider = getPaymentProvider('wechat')
      const checkout = await provider.createCheckout({
        orderId,
        amountCents: amount,
        currency: 'CNY',
        description: `Forgely ${input.planSlug.toUpperCase()} 订阅（${input.cadence === 'yearly' ? '年' : '月'}）`,
        notifyUrl:
          process.env.WECHAT_PAY_NOTIFY_URL ?? 'https://app.forgely.cn/api/webhooks/wechat',
        scene: input.scene,
        wechatOpenid: input.wechatOpenid,
        returnUrl: input.returnUrl,
        userId: ctx.user.id,
        metadata: {
          planSlug: input.planSlug,
          cadence: input.cadence,
          userId: ctx.user.id,
        },
      })
      rememberCheckoutContext(orderId, {
        userId: ctx.user.id,
        planSlug: input.planSlug,
        cadence: input.cadence,
        channel: 'wechat',
        scene: input.scene,
      })
      return {
        orderId,
        amountCents: amount,
        channel: 'wechat' as const,
        qrCode: checkout.qrCode,
        redirectUrl: checkout.redirectUrl,
        jsapiParams: checkout.jsapiParams,
        expiresAt: checkout.expiresAt,
      }
    }),

  /** Create an Alipay checkout — returns QR / redirect URL. */
  createAlipayCheckout: protectedProcedure
    .input(AlipayCheckoutInput)
    .mutation(async ({ ctx, input }) => {
      const amount = await resolveCnPriceFen(input.planSlug, input.cadence)
      const orderId = generateCnOrderId({
        channel: 'alipay',
        userId: ctx.user.id,
        planSlug: input.planSlug,
      })
      const provider = getPaymentProvider('alipay')
      const checkout = await provider.createCheckout({
        orderId,
        amountCents: amount,
        currency: 'CNY',
        description: `Forgely ${input.planSlug.toUpperCase()} 订阅（${input.cadence === 'yearly' ? '年' : '月'}）`,
        notifyUrl: process.env.ALIPAY_NOTIFY_URL ?? 'https://app.forgely.cn/api/webhooks/alipay',
        scene: input.scene,
        returnUrl: input.returnUrl,
        userId: ctx.user.id,
        metadata: {
          planSlug: input.planSlug,
          cadence: input.cadence,
          userId: ctx.user.id,
        },
      })
      rememberCheckoutContext(orderId, {
        userId: ctx.user.id,
        planSlug: input.planSlug,
        cadence: input.cadence,
        channel: 'alipay',
        scene: input.scene,
      })
      return {
        orderId,
        amountCents: amount,
        channel: 'alipay' as const,
        qrCode: checkout.qrCode,
        redirectUrl: checkout.redirectUrl,
        expiresAt: checkout.expiresAt,
      }
    }),

  /** Poll whether a CN order has been paid — /billing page uses this after
   * showing the QR code. Returns `paid` once the webhook has landed. */
  checkPayment: protectedProcedure.input(CheckPaymentInput).query(async ({ ctx, input }) => {
    const status = await checkCnPaymentStatus(input.orderId, ctx.user.id)
    return { orderId: input.orderId, status }
  }),
})
