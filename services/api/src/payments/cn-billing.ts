/**
 * Forgely 平台计费层 — 用 CN 支付通道（微信支付 / 支付宝）给中国 B 端
 * 老板收订阅月费 / 积分包钱（PIVOT-CN.md §3.1）。
 *
 * 这个文件把通用 PaymentProvider 接口包成"按 plan 或 package 收钱"
 * 的高层 helper，并负责把 pending 订单写入 CnPayment 表，以便 webhook
 * 翻状态时能找到上下文（kind / itemSlug / cadence）。
 *
 * 注意：用户独立站对海外消费者收的款（Stripe Connect / PayPal）走另一
 * 条独立链路（services/api/src/stripe/* 和 services/api/src/payments/
 * stripe-connect.ts），与本文件无关。
 *
 * @owner W3 — Sprint 3++
 */

import { randomBytes } from 'node:crypto'

import { prisma } from '../db.js'
import { ForgelyError } from '../errors.js'

import { AlipayProvider } from './alipay.js'
import { WechatPayProvider } from './wechat.js'
import type { CheckoutResult, PaymentChannel, PaymentScene } from './types.js'

export type CnChannel = Extract<PaymentChannel, 'wechat' | 'alipay'>
export type CnKind = 'subscription' | 'credit_pack'
export type CnCadence = 'monthly' | 'yearly'

/**
 * Convert USD-cents prices stored in `Plan` / `CreditsPackage` into CNY
 * amounts the WeChat/Alipay APIs accept. Override the rate via
 * `USD_TO_CNY_RATE` env (default 7.0). Stored prices remain USD so the
 * existing Stripe / Connect flow doesn't change.
 */
const USD_TO_CNY_RATE = (() => {
  const v = parseFloat(process.env.USD_TO_CNY_RATE ?? '7')
  if (!Number.isFinite(v) || v <= 0) return 7
  return v
})()

const usdCentsToCnyCents = (usdCents: number): number => Math.round(usdCents * USD_TO_CNY_RATE)

const newOrderId = (prefix: string): string =>
  `${prefix}_${Date.now().toString(36)}${randomBytes(4).toString('hex')}`

const providerFor = (channel: CnChannel) =>
  channel === 'wechat' ? new WechatPayProvider() : new AlipayProvider()

/**
 * Default scene per channel — `native` returns a QR code for desktop /
 * mobile-browser flow, which is what /billing UI uses by default. Callers
 * pass a different scene (`h5` / `jsapi` / `app`) if they're embedding.
 */
const defaultScene = (channel: CnChannel): PaymentScene =>
  channel === 'wechat' ? 'native' : 'native'

export interface StartCnSubscriptionInput {
  userId: string
  planSlug: 'starter' | 'pro' | 'agency'
  cadence: CnCadence
  channel: CnChannel
  scene?: PaymentScene
  /** Optional override of the H5/Wap return URL (back-redirect after pay). */
  returnUrl?: string
}

export interface StartCnCreditPackInput {
  userId: string
  packageSlug: string
  channel: CnChannel
  scene?: PaymentScene
  returnUrl?: string
}

export interface CnCheckoutSummary {
  /** Forgely-side `CnPayment.id`. Front-end polls this. */
  id: string
  channel: CnChannel
  kind: CnKind
  amountCents: number
  currency: 'CNY'
  status: 'pending'
  qrCode?: string
  redirectUrl?: string
  externalId: string
  expiresAt: Date
}

const cadenceField = (cadence: CnCadence): 'priceMonthlyUsd' | 'priceYearlyUsd' =>
  cadence === 'yearly' ? 'priceYearlyUsd' : 'priceMonthlyUsd'

async function persistAndReturn(args: {
  userId: string
  channel: CnChannel
  kind: CnKind
  itemSlug: string
  cadence: CnCadence | null
  amountCents: number
  result: CheckoutResult
}): Promise<CnCheckoutSummary> {
  const { userId, channel, kind, itemSlug, cadence, amountCents, result } = args
  const row = await prisma.cnPayment.create({
    data: {
      userId,
      channel,
      kind,
      itemSlug,
      cadence: cadence ?? null,
      amountCents,
      currency: 'CNY',
      qrCode: result.qrCode ?? null,
      redirectUrl: result.redirectUrl ?? null,
      externalId: result.externalId,
      expiresAt: result.expiresAt,
    },
  })
  return {
    id: row.id,
    channel,
    kind,
    amountCents,
    currency: 'CNY',
    status: 'pending',
    qrCode: result.qrCode,
    redirectUrl: result.redirectUrl,
    externalId: result.externalId,
    expiresAt: result.expiresAt,
  }
}

const PAY_NOTIFY_URL = (channel: CnChannel): string => {
  const base =
    process.env.NEXT_PUBLIC_APP_URL ?? process.env.PUBLIC_APP_URL ?? 'http://localhost:3001'
  return `${base.replace(/\/$/, '')}/api/webhooks/${channel === 'wechat' ? 'wechat-pay' : 'alipay'}`
}

/** Start a subscription checkout via WeChat or Alipay. */
export async function createCnSubscriptionCheckout(
  input: StartCnSubscriptionInput,
): Promise<CnCheckoutSummary> {
  const plan = await prisma.plan.findUnique({ where: { slug: input.planSlug } })
  if (!plan || !plan.active) {
    throw new ForgelyError('PLAN_NOT_FOUND', `Unknown plan: ${input.planSlug}`, 404)
  }
  const usdCents = plan[cadenceField(input.cadence)]
  if (!usdCents || usdCents <= 0) {
    throw new ForgelyError(
      'PLAN_NOT_FOUND',
      `Plan ${plan.slug} has no ${input.cadence} price.`,
      400,
    )
  }
  const amountCents = usdCentsToCnyCents(usdCents)

  const provider = providerFor(input.channel)
  const orderId = newOrderId('sub')
  const result = await provider.createCheckout({
    orderId,
    amountCents,
    currency: 'CNY',
    description: `Forgely ${plan.name} 订阅 (${input.cadence === 'yearly' ? '年付' : '月付'})`,
    notifyUrl: PAY_NOTIFY_URL(input.channel),
    returnUrl: input.returnUrl,
    scene: input.scene ?? defaultScene(input.channel),
    userId: input.userId,
    metadata: {
      forgelyKind: 'subscription',
      forgelyUserId: input.userId,
      forgelyPlanSlug: plan.slug,
      forgelyCadence: input.cadence,
    },
  })

  return persistAndReturn({
    userId: input.userId,
    channel: input.channel,
    kind: 'subscription',
    itemSlug: plan.slug,
    cadence: input.cadence,
    amountCents,
    result,
  })
}

/** Start a one-shot credit-pack checkout via WeChat or Alipay. */
export async function createCnCreditPackCheckout(
  input: StartCnCreditPackInput,
): Promise<CnCheckoutSummary> {
  const pkg = await prisma.creditsPackage.findUnique({
    where: { slug: input.packageSlug },
  })
  if (!pkg || !pkg.active) {
    throw new ForgelyError(
      'PACKAGE_NOT_FOUND',
      `Unknown credits package: ${input.packageSlug}`,
      404,
    )
  }
  const amountCents = usdCentsToCnyCents(pkg.priceUsd)

  const provider = providerFor(input.channel)
  const orderId = newOrderId('pack')
  const result = await provider.createCheckout({
    orderId,
    amountCents,
    currency: 'CNY',
    description: `Forgely 积分包 ${pkg.name} (${pkg.credits.toLocaleString()} 积分)`,
    notifyUrl: PAY_NOTIFY_URL(input.channel),
    returnUrl: input.returnUrl,
    scene: input.scene ?? defaultScene(input.channel),
    userId: input.userId,
    metadata: {
      forgelyKind: 'credit_pack',
      forgelyUserId: input.userId,
      forgelyPackageSlug: pkg.slug,
    },
  })

  return persistAndReturn({
    userId: input.userId,
    channel: input.channel,
    kind: 'credit_pack',
    itemSlug: pkg.slug,
    cadence: null,
    amountCents,
    result,
  })
}

/** Polled by the front-end QR modal so the user gets confirmation feedback. */
export async function getCnPaymentStatus(args: { userId: string; paymentId: string }): Promise<{
  id: string
  status: 'pending' | 'paid' | 'expired' | 'failed' | 'refunded'
  paidAt: Date | null
  expiresAt: Date
}> {
  const row = await prisma.cnPayment.findUnique({ where: { id: args.paymentId } })
  if (!row) {
    throw new ForgelyError('NOT_FOUND', 'Payment not found.', 404, { paymentId: args.paymentId })
  }
  if (row.userId !== args.userId) {
    throw new ForgelyError('FORBIDDEN', 'You do not own this payment.', 403)
  }
  // Auto-expire stale rows so the UI eventually stops polling.
  let status = row.status as 'pending' | 'paid' | 'expired' | 'failed' | 'refunded'
  if (status === 'pending' && row.expiresAt.getTime() < Date.now()) {
    await prisma.cnPayment.update({
      where: { id: row.id },
      data: { status: 'expired' },
    })
    status = 'expired'
  }
  return {
    id: row.id,
    status,
    paidAt: row.paidAt,
    expiresAt: row.expiresAt,
  }
}
