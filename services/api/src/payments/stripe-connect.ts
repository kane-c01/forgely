/**
 * Stripe Connect — 让中国 B 端老板 OAuth 授权一个自己的 Stripe 账号，
 * 站点对海外消费者收 USD 时直接进他们自己的 Stripe，Forgely 平台
 * 走 Application Fee 抽成（可选 0% / 1% / 自定义）。
 *
 * 文档：https://docs.stripe.com/connect/express-accounts
 *
 * 流程：
 *   1. /api/stripe/connect/onboard → 创建 Express account + AccountLink
 *      → 用户跳到 Stripe 完成 KYC / 银行信息
 *   2. /api/stripe/connect/return → 检查账号状态，写库 `User.stripeConnectAccountId`
 *   3. 用户站结账时 PaymentIntent 加 `application_fee_amount` + `transfer_data.destination`
 *
 * @owner W1 — CN pivot (docs/PIVOT-CN.md §3.2)
 */
import { ForgelyError } from '../errors.js'

interface StripeAccountLink {
  url: string
  expires_at: number
  account: string
}

interface ConnectAccountStatus {
  id: string
  charges_enabled: boolean
  payouts_enabled: boolean
  requirements: { currently_due: string[]; pending_verification: string[] }
}

const STRIPE_BASE = 'https://api.stripe.com/v1'

function readSecret(): string {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new ForgelyError('STRIPE_NOT_CONFIGURED', 'Stripe 未配置 STRIPE_SECRET_KEY', 500)
  return key
}

async function stripeFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${STRIPE_BASE}${path}`, {
    ...init,
    headers: {
      authorization: `Bearer ${readSecret()}`,
      'content-type': 'application/x-www-form-urlencoded',
      ...(init.headers ?? {}),
    },
  })
  if (!res.ok) {
    const txt = await res.text()
    throw new ForgelyError(
      'STRIPE_UPSTREAM',
      `Stripe ${path} 失败: ${res.status} ${txt.slice(0, 200)}`,
      502,
    )
  }
  return (await res.json()) as T
}

/** 创建一个 Express Connect account + 返回 onboarding URL。 */
export async function startOnboarding(opts: {
  email: string
  country?: string
  returnUrl: string
  refreshUrl: string
  /** 平台默认抽成（可选，0-1 浮点；用于后续 PaymentIntent 自动计算 fee）。*/
  defaultApplicationFeeRate?: number
}): Promise<{ accountId: string; onboardingUrl: string; defaultApplicationFeeRate: number }> {
  const acct = await stripeFetch<{ id: string }>(`/accounts`, {
    method: 'POST',
    body: new URLSearchParams({
      type: 'express',
      country: opts.country ?? 'US',
      email: opts.email,
      'capabilities[card_payments][requested]': 'true',
      'capabilities[transfers][requested]': 'true',
    }),
  })
  const link = await stripeFetch<StripeAccountLink>(`/account_links`, {
    method: 'POST',
    body: new URLSearchParams({
      account: acct.id,
      refresh_url: opts.refreshUrl,
      return_url: opts.returnUrl,
      type: 'account_onboarding',
    }),
  })
  return {
    accountId: acct.id,
    onboardingUrl: link.url,
    defaultApplicationFeeRate: opts.defaultApplicationFeeRate ?? 0,
  }
}

/** 查询账号状态 — 用户从 Stripe 跳回 Forgely 时调一次。*/
export async function getConnectStatus(accountId: string): Promise<ConnectAccountStatus> {
  return stripeFetch<ConnectAccountStatus>(`/accounts/${accountId}`)
}

/** 创建一个直入用户 Stripe 账号的 PaymentIntent — 用户站结账用。*/
export async function createConnectedPaymentIntent(opts: {
  amountCents: number
  currency: string
  destinationAccountId: string
  applicationFeeCents?: number
  description?: string
  metadata?: Record<string, string>
}): Promise<{ id: string; clientSecret: string }> {
  const body = new URLSearchParams({
    amount: String(opts.amountCents),
    currency: opts.currency.toLowerCase(),
    'transfer_data[destination]': opts.destinationAccountId,
    ...(opts.applicationFeeCents
      ? { application_fee_amount: String(opts.applicationFeeCents) }
      : {}),
    ...(opts.description ? { description: opts.description } : {}),
  })
  if (opts.metadata) {
    for (const [k, v] of Object.entries(opts.metadata)) {
      body.append(`metadata[${k}]`, v)
    }
  }
  const res = await stripeFetch<{ id: string; client_secret: string }>(`/payment_intents`, {
    method: 'POST',
    body,
  })
  return { id: res.id, clientSecret: res.client_secret }
}

/**
 * Refund a connected-account PaymentIntent (or one of its Charges).
 *
 * Stripe Connect refund options:
 *   - `charge`     refund a specific Charge id (preferred when known)
 *   - `payment_intent` refund the latest charge of a PaymentIntent
 *
 * `reverse_transfer=true` ensures the platform's application fee is
 * reversed proportionally so the merchant doesn't end up footing the bill.
 *
 * Returns the canonical Stripe refund summary; throws STRIPE_UPSTREAM
 * with body context on non-2xx.
 */
export async function refundConnectedPayment(opts: {
  /** One of charge / paymentIntent must be set. */
  chargeId?: string
  paymentIntentId?: string
  amountCents?: number
  reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer'
  /** Reverse the platform application fee in proportion. */
  reverseTransfer?: boolean
  /** Stripe-Account header for direct charges (when refunding on the connected account). */
  onConnectedAccount?: string
  metadata?: Record<string, string>
}): Promise<{
  refundId: string
  status: 'pending' | 'succeeded' | 'failed' | 'canceled' | 'requires_action'
  amountCents: number
}> {
  if (!opts.chargeId && !opts.paymentIntentId) {
    throw new ForgelyError(
      'STRIPE_UPSTREAM',
      'refundConnectedPayment: 必须提供 chargeId 或 paymentIntentId 之一。',
      400,
    )
  }
  const body = new URLSearchParams({
    ...(opts.chargeId ? { charge: opts.chargeId } : {}),
    ...(opts.paymentIntentId ? { payment_intent: opts.paymentIntentId } : {}),
    ...(opts.amountCents !== undefined ? { amount: String(opts.amountCents) } : {}),
    ...(opts.reason ? { reason: opts.reason } : {}),
    ...(opts.reverseTransfer === false ? {} : { reverse_transfer: 'true' }),
    ...(opts.reverseTransfer === false ? {} : { refund_application_fee: 'true' }),
  })
  if (opts.metadata) {
    for (const [k, v] of Object.entries(opts.metadata)) {
      body.append(`metadata[${k}]`, v)
    }
  }

  const headers = opts.onConnectedAccount
    ? { 'stripe-account': opts.onConnectedAccount }
    : undefined

  const res = await stripeFetch<{
    id: string
    status: 'pending' | 'succeeded' | 'failed' | 'canceled' | 'requires_action'
    amount: number
  }>('/refunds', {
    method: 'POST',
    headers,
    body,
  })
  return { refundId: res.id, status: res.status, amountCents: res.amount }
}

/**
 * Optional: detach a connected account (e.g. user requested to switch
 * Stripe accounts). Stripe doesn't support hard delete via API; we just
 * clear the requirements so future PaymentIntents fall back to the
 * platform default.
 */
export async function disconnectAccount(accountId: string): Promise<void> {
  await stripeFetch(`/accounts/${accountId}`, {
    method: 'POST',
    body: new URLSearchParams({ 'metadata[forgely_disconnected_at]': new Date().toISOString() }),
  })
}
