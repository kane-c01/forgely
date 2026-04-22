/**
 * CN billing — unified订阅激活 + 积分发放 + 审计日志。
 *
 * 微信/支付宝 webhook → verifyWebhook → activateCnSubscription(event, planSlug, cadence)
 *   1. upsert Subscription 行 (status='active')，stripeSubscriptionId 用通道前缀占位
 *      (wx_<orderId> / ali_<orderId>) 以免和 Stripe 的 sub_xxx 冲突且保持 unique。
 *   2. UserCredits.balance += plan.monthlyCredits（走 creditWallet 确保有 ledger 行）。
 *   3. CreditTransaction.metadata 记录 channel / externalId 便于追溯 & 对账。
 *   4. AuditLog.action='subscription.activated'.
 *
 * 订单 ID 规范：cnOrderId = `${channel}_${userId}_${planSlug}_${timestamp}_${rand}`。
 * 单次激活是幂等的 —— 复制 webhook 不会重复发积分（靠 metadata.idempotencyKey）。
 *
 * @owner W4 — payments real
 */
import type { Prisma } from '@prisma/client'

import { creditWallet } from '../credits/wallet.js'
import { Prisma as PrismaNS, prisma } from '../db.js'
import { ForgelyError } from '../errors.js'

import { AlipayProvider } from './alipay.js'
import { WechatPayProvider } from './wechat.js'
import type { PaymentChannel, PaymentScene, WebhookEvent } from './types.js'

/** 计划月度积分 fallback — 与 Plan.monthlyCredits 对齐，用于 Plan 表空时的兜底。 */
export const CN_PLAN_CREDITS: Record<string, number> = {
  starter: 1_500,
  pro: 6_000,
  agency: 25_000,
  enterprise: 100_000,
}

/** CNY 月/年费（分），在 Plan 表没设 CN 价格时 fallback。 */
export const CN_PLAN_PRICE_CNY_FEN: Record<string, { monthly: number; yearly: number }> = {
  starter: { monthly: 9900, yearly: 99000 },
  pro: { monthly: 59900, yearly: 599000 },
  agency: { monthly: 249900, yearly: 2499000 },
}

export interface GenerateCnOrderIdInput {
  channel: PaymentChannel
  userId: string
  planSlug: string
}

export const generateCnOrderId = (input: GenerateCnOrderIdInput): string => {
  const prefix = input.channel === 'wechat' ? 'wx' : input.channel === 'alipay' ? 'ali' : 'cn'
  const rand = Math.random().toString(36).slice(2, 10)
  return `${prefix}_${input.userId.slice(0, 8)}_${input.planSlug}_${Date.now()}_${rand}`
}

export interface ActivateCnSubscriptionInput {
  event: WebhookEvent
  /** Recovered from the original checkout request — we stash it in the order metadata. */
  planSlug: string
  cadence: 'monthly' | 'yearly'
  userId: string
}

export interface ActivateCnSubscriptionResult {
  subscriptionId: string
  creditsGranted: number
  transactionId: string
  auditLogId: string | null
  alreadyProcessed: boolean
}

/**
 * Idempotently activate a CN subscription + grant credits + write audit log.
 * Returns `alreadyProcessed: true` on duplicate webhook delivery.
 */
export const activateCnSubscription = async (
  input: ActivateCnSubscriptionInput,
): Promise<ActivateCnSubscriptionResult> => {
  if (input.event.type !== 'paid') {
    throw new ForgelyError(
      'CN_SUB_NOT_PAID',
      `CN subscription activation requires paid event, got ${input.event.type}`,
      400,
    )
  }

  const user = await prisma.user.findUnique({ where: { id: input.userId } })
  if (!user) {
    throw new ForgelyError('CN_SUB_USER_NOT_FOUND', `用户 ${input.userId} 不存在`, 404)
  }

  // Our internal orderId already carries the channel prefix (wx_ / ali_).
  // We reuse it verbatim as the Subscription.stripeSubscriptionId unique key.
  const externalKey = input.event.orderId
  const idempotencyKey = `cn:${input.event.channel}:${input.event.externalId}`

  const existing = await prisma.creditTransaction.findFirst({
    where: {
      userId: input.userId,
      type: 'subscription',
      metadata: { path: ['idempotencyKey'], equals: idempotencyKey },
    },
    select: { id: true },
  })
  if (existing) {
    const sub = await prisma.subscription.findUnique({ where: { userId: input.userId } })
    return {
      subscriptionId: sub?.id ?? 'unknown',
      creditsGranted: 0,
      transactionId: existing.id,
      auditLogId: null,
      alreadyProcessed: true,
    }
  }

  const planFromDb = await prisma.plan.findUnique({ where: { slug: input.planSlug } })
  const monthlyCredits = planFromDb?.monthlyCredits ?? CN_PLAN_CREDITS[input.planSlug] ?? 0
  if (monthlyCredits <= 0) {
    throw new ForgelyError(
      'CN_SUB_NO_CREDITS',
      `plan ${input.planSlug} has no monthly credits`,
      400,
    )
  }

  const now = new Date()
  const periodEnd = new Date(now)
  if (input.cadence === 'yearly') {
    periodEnd.setUTCFullYear(periodEnd.getUTCFullYear() + 1)
  } else {
    periodEnd.setUTCMonth(periodEnd.getUTCMonth() + 1)
  }

  const subscriptionData = {
    plan: input.planSlug,
    status: 'active',
    stripeSubscriptionId: externalKey,
    stripePriceId: `${input.event.channel}_${input.planSlug}_${input.cadence}`,
    cadence: input.cadence,
    currentPeriodStart: now,
    currentPeriodEnd: periodEnd,
    cancelAtPeriodEnd: false,
    trialEndsAt: null,
    canceledAt: null,
  }

  const sub = await prisma.subscription.upsert({
    where: { userId: input.userId },
    create: { userId: input.userId, ...subscriptionData },
    update: subscriptionData,
  })

  await prisma.user.update({
    where: { id: input.userId },
    data: { plan: input.planSlug },
  })

  const { balance: _, transactionId } = await creditWallet({
    userId: input.userId,
    amount: monthlyCredits,
    type: 'subscription',
    description: `CN subscription — ${input.planSlug} (${input.event.channel})`,
    metadata: {
      idempotencyKey,
      channel: input.event.channel,
      externalId: input.event.externalId,
      orderId: input.event.orderId,
      planSlug: input.planSlug,
      cadence: input.cadence,
      amountCents: input.event.amountCents,
      currency: input.event.currency,
      source: 'cn_webhook',
    },
  })
  void _

  const audit = await prisma.auditLog
    .create({
      data: {
        actorType: 'system',
        actorId: `cn-${input.event.channel}`,
        action: 'subscription.activated',
        targetType: 'user',
        targetId: input.userId,
        before: PrismaNS.JsonNull,
        after: {
          channel: input.event.channel,
          planSlug: input.planSlug,
          cadence: input.cadence,
          externalId: input.event.externalId,
          amountCents: input.event.amountCents,
          currency: input.event.currency,
        } as Prisma.InputJsonValue,
      },
    })
    .catch(() => null)

  return {
    subscriptionId: sub.id,
    creditsGranted: monthlyCredits,
    transactionId,
    auditLogId: audit?.id ?? null,
    alreadyProcessed: false,
  }
}

export interface ResolveCheckoutContextInput {
  orderId: string
  userId: string
}

/**
 * Look up the pending-order context written at checkout-time so the webhook
 * knows which plan the payment was for. Uses an in-process Map fallback for
 * mock mode + tests; production should be wired via Redis.
 */
const CHECKOUT_CONTEXT = new Map<
  string,
  {
    userId: string
    planSlug: string
    cadence: 'monthly' | 'yearly'
    channel: PaymentChannel
    scene: PaymentScene
    createdAt: number
  }
>()

export const rememberCheckoutContext = (
  orderId: string,
  ctx: {
    userId: string
    planSlug: string
    cadence: 'monthly' | 'yearly'
    channel: PaymentChannel
    scene: PaymentScene
  },
): void => {
  CHECKOUT_CONTEXT.set(orderId, { ...ctx, createdAt: Date.now() })
  // Keep the map bounded — drop entries older than 1 hour.
  const cutoff = Date.now() - 60 * 60 * 1000
  for (const [k, v] of CHECKOUT_CONTEXT.entries()) {
    if (v.createdAt < cutoff) CHECKOUT_CONTEXT.delete(k)
  }
}

export const recallCheckoutContext = (
  orderId: string,
): {
  userId: string
  planSlug: string
  cadence: 'monthly' | 'yearly'
  channel: PaymentChannel
  scene: PaymentScene
} | null => {
  const ctx = CHECKOUT_CONTEXT.get(orderId)
  if (!ctx) return null
  return {
    userId: ctx.userId,
    planSlug: ctx.planSlug,
    cadence: ctx.cadence,
    channel: ctx.channel,
    scene: ctx.scene,
  }
}

/** Check whether a CN order was successfully paid (used by /billing polling). */
export const checkCnPaymentStatus = async (
  orderId: string,
  userId: string,
): Promise<'pending' | 'paid' | 'unknown'> => {
  if (!orderId.startsWith('wx_') && !orderId.startsWith('ali_')) return 'unknown'

  const sub = await prisma.subscription.findFirst({
    where: {
      userId,
      stripeSubscriptionId: orderId,
      status: 'active',
    },
  })
  if (sub) return 'paid'
  return 'pending'
}

type CnWebhookMetadata = { userId?: string; planSlug?: string; cadence?: string }

/** Pull the checkout metadata from either the in-memory context or the raw webhook payload. */
const resolveCnWebhookContext = (
  event: WebhookEvent,
): { userId: string; planSlug: string; cadence: 'monthly' | 'yearly' } | null => {
  const fromMemory = recallCheckoutContext(event.orderId)
  if (fromMemory) {
    return {
      userId: fromMemory.userId,
      planSlug: fromMemory.planSlug,
      cadence: fromMemory.cadence,
    }
  }

  // Fallback: recover from provider raw payload. WeChat Pay stores metadata in
  // `attach` (JSON string); Alipay stores it in `passback_params` (urlencoded JSON).
  let parsed: CnWebhookMetadata = {}
  try {
    if (event.channel === 'wechat') {
      const raw = event.raw as { decoded?: { attach?: string } } | undefined
      const attach = raw?.decoded?.attach
      if (attach) parsed = JSON.parse(attach) as CnWebhookMetadata
    } else if (event.channel === 'alipay') {
      const raw = event.raw as { passback_params?: string } | Record<string, string>
      const passback =
        typeof raw === 'object' && 'passback_params' in raw
          ? (raw as Record<string, string>).passback_params
          : undefined
      if (passback) parsed = JSON.parse(decodeURIComponent(passback)) as CnWebhookMetadata
    }
  } catch {
    return null
  }

  if (!parsed.userId || !parsed.planSlug) return null
  const cadence: 'monthly' | 'yearly' = parsed.cadence === 'yearly' ? 'yearly' : 'monthly'
  return { userId: parsed.userId, planSlug: parsed.planSlug, cadence }
}

export interface HandleCnWebhookInput {
  channel: PaymentChannel
  /** Raw body as received from the channel HTTP POST. */
  body: string
  /** Request headers (WeChat Pay uses them to carry signature). Alipay ignores. */
  headers: Headers
}

export interface HandleCnWebhookResult {
  status: 'processed' | 'ignored' | 'duplicate'
  channel: PaymentChannel
  event: WebhookEvent
  activation: ActivateCnSubscriptionResult | null
  message?: string
}

/**
 * End-to-end CN webhook handler used by the Next.js route:
 *   1. verifyWebhook (signature + decrypt).
 *   2. 只处理 `type === 'paid'`（其他忽略）。
 *   3. 找 checkout context (memory or `attach`/`passback_params`).
 *   4. activateCnSubscription（幂等）。
 *   5. 返回通道要的响应字符串在 route 层拼。
 */
export const handleCnPaymentWebhook = async (
  input: HandleCnWebhookInput,
): Promise<HandleCnWebhookResult> => {
  const provider =
    input.channel === 'wechat'
      ? new WechatPayProvider()
      : input.channel === 'alipay'
        ? new AlipayProvider()
        : null
  if (!provider) {
    throw new ForgelyError(
      'CN_WEBHOOK_UNSUPPORTED_CHANNEL',
      `Unsupported channel ${input.channel}`,
      400,
    )
  }

  const event = await provider.verifyWebhook(input.headers, input.body)

  if (event.type !== 'paid') {
    return {
      status: 'ignored',
      channel: input.channel,
      event,
      activation: null,
      message: `skip non-paid event: ${event.type}`,
    }
  }

  const ctx = resolveCnWebhookContext(event)
  if (!ctx) {
    return {
      status: 'ignored',
      channel: input.channel,
      event,
      activation: null,
      message: 'missing checkout context (orderId unknown)',
    }
  }

  const activation = await activateCnSubscription({
    event,
    planSlug: ctx.planSlug,
    cadence: ctx.cadence,
    userId: ctx.userId,
  })

  return {
    status: activation.alreadyProcessed ? 'duplicate' : 'processed',
    channel: input.channel,
    event,
    activation,
    message: activation.alreadyProcessed
      ? 'idempotent: activation already recorded'
      : `activated user ${ctx.userId} plan=${ctx.planSlug} +${activation.creditsGranted} credits`,
  }
}
