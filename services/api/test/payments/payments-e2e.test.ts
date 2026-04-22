/**
 * CN payments — end-to-end webhook → subscription activation flow.
 *
 * Flow under test:
 *   1. Mock a WeChat Pay `paid` webhook payload (mock mode skips signature verification).
 *   2. Remember the checkout context (simulating a prior tRPC `createWechatPayCheckout`).
 *   3. Call `handleCnPaymentWebhook` — asserts:
 *        - Subscription row (upsert) becomes `status='active'` w/ correct plan + cadence.
 *        - UserCredits.balance += plan.monthlyCredits (starter=1500 / pro=6000 / agency=25000).
 *        - CreditTransaction row with `type='subscription'` + metadata.idempotencyKey.
 *        - AuditLog row with `action='subscription.activated'`.
 *   4. Replay the same webhook → idempotent (no duplicate credits / txs).
 *
 * Prisma is fully stubbed in-memory (no Postgres required).
 */
import { describe, expect, it, vi, beforeEach } from 'vitest'

interface UserRow {
  id: string
  email: string
  plan: string
}

interface SubscriptionRow {
  id: string
  userId: string
  plan: string
  status: string
  stripeSubscriptionId: string
  stripePriceId: string
  cadence: string
  currentPeriodStart: Date
  currentPeriodEnd: Date
  cancelAtPeriodEnd: boolean
  trialEndsAt: Date | null
  canceledAt: Date | null
  createdAt: Date
  updatedAt: Date
}

interface WalletRow {
  id: string
  userId: string
  balance: number
  reserved: number
  lifetimeEarned: number
  lifetimeSpent: number
  version: number
  dailySpendDate: Date | null
  dailySpentToday: number
  updatedAt: Date
  createdAt: Date
}

interface CreditTxRow {
  id: string
  userId: string
  type: string
  amount: number
  balance: number
  description: string
  metadata: Record<string, unknown> | null
  reservationId: string | null
  stripeEventId: string | null
  stripeChargeId: string | null
  createdAt: Date
}

interface PlanRow {
  id: string
  slug: string
  name: string
  priceMonthlyUsd: number
  priceYearlyUsd: number
  monthlyCredits: number
  maxSites: number
  maxCustomDomains: number
  enable3D: boolean
  enableAiCopilot: boolean
  enableCodeExport: boolean
  features: Record<string, unknown> | null
  active: boolean
  stripeProductId: string | null
  stripePriceMonthlyId: string | null
  stripePriceYearlyId: string | null
  sortOrder: number
}

interface AuditLogRow {
  id: string
  actorType: string
  actorId: string
  action: string
  targetType: string
  targetId: string
  before: unknown
  after: unknown
  reason: string | null
  ipAddress: string | null
  userAgent: string | null
  createdAt: Date
}

interface Store {
  users: UserRow[]
  subscriptions: SubscriptionRow[]
  wallets: WalletRow[]
  creditTxs: CreditTxRow[]
  plans: PlanRow[]
  auditLogs: AuditLogRow[]
}

const STORE: Store = {
  users: [],
  subscriptions: [],
  wallets: [],
  creditTxs: [],
  plans: [],
  auditLogs: [],
}

let AUTO_ID = 0
const nextId = (prefix: string): string => `${prefix}_${++AUTO_ID}`

const getNestedValue = (obj: unknown, path: string[]): unknown => {
  let cur: unknown = obj
  for (const key of path) {
    if (cur && typeof cur === 'object') {
      cur = (cur as Record<string, unknown>)[key]
    } else {
      return undefined
    }
  }
  return cur
}

const matchesFilter = <R extends Record<string, unknown>>(
  row: R,
  where: Record<string, unknown>,
): boolean => {
  for (const [k, v] of Object.entries(where)) {
    if (v == null) continue
    if (k === 'metadata' && v && typeof v === 'object' && 'path' in (v as object)) {
      const spec = v as { path: string[]; equals: unknown }
      const got = getNestedValue(row.metadata as unknown, spec.path)
      if (got !== spec.equals) return false
      continue
    }
    if (k === 'type' && typeof v === 'object' && v !== null && 'in' in (v as object)) {
      if (!(v as { in: unknown[] }).in.includes(row[k])) return false
      continue
    }
    if (row[k] !== v) return false
  }
  return true
}

const applyIncrement = (cur: number, spec: unknown): number => {
  if (typeof spec === 'number') return spec
  if (spec && typeof spec === 'object') {
    const s = spec as { increment?: number; decrement?: number }
    if (typeof s.increment === 'number') return cur + s.increment
    if (typeof s.decrement === 'number') return cur - s.decrement
  }
  return cur
}

const runTx = async <T>(fn: (tx: unknown) => Promise<T>): Promise<T> => fn(prismaStub)

const prismaStub = {
  async $transaction<T>(fn: (tx: unknown) => Promise<T>): Promise<T> {
    return runTx(fn)
  },

  user: {
    findUnique: async ({ where }: { where: { id: string } }) =>
      STORE.users.find((u) => u.id === where.id) ?? null,
    update: async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
      const u = STORE.users.find((x) => x.id === where.id)
      if (!u) throw new Error('user not found')
      Object.assign(u, data)
      return { ...u }
    },
  },

  plan: {
    findUnique: async ({ where }: { where: { slug: string } }) =>
      STORE.plans.find((p) => p.slug === where.slug) ?? null,
  },

  subscription: {
    findUnique: async ({ where }: { where: { userId: string } }) =>
      STORE.subscriptions.find((s) => s.userId === where.userId) ?? null,
    findFirst: async ({ where }: { where: Record<string, unknown> }) =>
      STORE.subscriptions.find((s) =>
        matchesFilter(s as unknown as Record<string, unknown>, where),
      ) ?? null,
    upsert: async ({
      where,
      create,
      update,
    }: {
      where: { userId: string }
      create: Omit<SubscriptionRow, 'id' | 'createdAt' | 'updatedAt'>
      update: Partial<SubscriptionRow>
    }) => {
      const existing = STORE.subscriptions.find((s) => s.userId === where.userId)
      if (existing) {
        Object.assign(existing, update, { updatedAt: new Date() })
        return { ...existing }
      }
      const row: SubscriptionRow = {
        id: nextId('sub'),
        ...(create as Omit<SubscriptionRow, 'id' | 'createdAt' | 'updatedAt'>),
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      STORE.subscriptions.push(row)
      return { ...row }
    },
  },

  userCredits: {
    findUnique: async ({ where }: { where: { userId: string } }) =>
      STORE.wallets.find((w) => w.userId === where.userId) ?? null,
    create: async ({ data }: { data: Partial<WalletRow> }) => {
      const row: WalletRow = {
        id: nextId('wallet'),
        userId: data.userId!,
        balance: data.balance ?? 0,
        reserved: data.reserved ?? 0,
        lifetimeEarned: data.lifetimeEarned ?? 0,
        lifetimeSpent: data.lifetimeSpent ?? 0,
        version: data.version ?? 0,
        dailySpendDate: data.dailySpendDate ?? null,
        dailySpentToday: data.dailySpentToday ?? 0,
        updatedAt: new Date(),
        createdAt: new Date(),
      }
      STORE.wallets.push(row)
      return { ...row }
    },
    update: async ({
      where,
      data,
    }: {
      where: { userId: string }
      data: Record<string, unknown>
    }) => {
      const w = STORE.wallets.find((x) => x.userId === where.userId)
      if (!w) throw new Error('wallet not found')
      for (const [k, v] of Object.entries(data)) {
        const current = (w as unknown as Record<string, unknown>)[k]
        if (typeof current === 'number') {
          ;(w as unknown as Record<string, unknown>)[k] = applyIncrement(current, v)
        } else {
          ;(w as unknown as Record<string, unknown>)[k] = v
        }
      }
      w.updatedAt = new Date()
      return { ...w }
    },
  },

  creditTransaction: {
    findFirst: async ({ where }: { where: Record<string, unknown> }) =>
      STORE.creditTxs.find((t) => matchesFilter(t as unknown as Record<string, unknown>, where)) ??
      null,
    findMany: async () => [...STORE.creditTxs],
    create: async ({ data }: { data: Partial<CreditTxRow> }) => {
      const row: CreditTxRow = {
        id: nextId('tx'),
        userId: data.userId!,
        type: data.type!,
        amount: data.amount!,
        balance: data.balance!,
        description: data.description!,
        metadata: (data.metadata as Record<string, unknown>) ?? null,
        reservationId: data.reservationId ?? null,
        stripeEventId: data.stripeEventId ?? null,
        stripeChargeId: data.stripeChargeId ?? null,
        createdAt: new Date(),
      }
      STORE.creditTxs.push(row)
      return { ...row }
    },
  },

  auditLog: {
    create: async ({ data }: { data: Partial<AuditLogRow> }) => {
      const row: AuditLogRow = {
        id: nextId('audit'),
        actorType: data.actorType!,
        actorId: data.actorId!,
        action: data.action!,
        targetType: data.targetType!,
        targetId: data.targetId!,
        before: data.before ?? null,
        after: data.after ?? null,
        reason: data.reason ?? null,
        ipAddress: data.ipAddress ?? null,
        userAgent: data.userAgent ?? null,
        createdAt: new Date(),
      }
      STORE.auditLogs.push(row)
      return { ...row }
    },
  },
} as const

vi.mock('../../src/db.js', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>
  return {
    ...actual,
    prisma: prismaStub,
    Prisma: { ...(actual.Prisma as Record<string, unknown>), JsonNull: null },
  }
})

// Delete any env so wechat/alipay providers go into mock mode.
for (const k of [
  'WECHAT_PAY_MCH_ID',
  'WECHAT_PAY_PRIVATE_KEY',
  'WECHAT_PAY_APIV3_KEY',
  'WECHAT_PAY_SERIAL_NO',
  'WECHAT_PAY_APP_ID',
  'ALIPAY_APP_ID',
  'ALIPAY_APP_PRIVATE_KEY',
  'ALIPAY_PUBLIC_KEY',
]) {
  delete process.env[k]
}

// Lazy-import so vi.mock above patches the module first.
const importModule = async () => {
  return await import('../../src/payments/index.js')
}

const seed = () => {
  STORE.users = [
    {
      id: 'user_pro',
      email: 'pro@example.com',
      plan: 'free',
    },
    {
      id: 'user_starter',
      email: 'starter@example.com',
      plan: 'free',
    },
  ]
  STORE.plans = [
    {
      id: 'plan_pro',
      slug: 'pro',
      name: 'Pro',
      priceMonthlyUsd: 8900,
      priceYearlyUsd: 89000,
      monthlyCredits: 6000,
      maxSites: 5,
      maxCustomDomains: 5,
      enable3D: true,
      enableAiCopilot: true,
      enableCodeExport: true,
      features: null,
      active: true,
      stripeProductId: null,
      stripePriceMonthlyId: null,
      stripePriceYearlyId: null,
      sortOrder: 2,
    },
    {
      id: 'plan_starter',
      slug: 'starter',
      name: 'Starter',
      priceMonthlyUsd: 1900,
      priceYearlyUsd: 19000,
      monthlyCredits: 1500,
      maxSites: 1,
      maxCustomDomains: 1,
      enable3D: false,
      enableAiCopilot: false,
      enableCodeExport: false,
      features: null,
      active: true,
      stripeProductId: null,
      stripePriceMonthlyId: null,
      stripePriceYearlyId: null,
      sortOrder: 1,
    },
  ]
  STORE.subscriptions = []
  STORE.wallets = []
  STORE.creditTxs = []
  STORE.auditLogs = []
  AUTO_ID = 0
}

beforeEach(() => {
  seed()
})

describe('payments e2e — WeChat Pay webhook → subscription activation', () => {
  it('activates Pro subscription, grants 6000 credits, writes tx + audit', async () => {
    const { handleCnPaymentWebhook, rememberCheckoutContext, generateCnOrderId } =
      await importModule()

    const orderId = generateCnOrderId({
      channel: 'wechat',
      userId: 'user_pro',
      planSlug: 'pro',
    })
    rememberCheckoutContext(orderId, {
      userId: 'user_pro',
      planSlug: 'pro',
      cadence: 'monthly',
      channel: 'wechat',
      scene: 'native',
    })

    // WeChat Pay mock mode accepts a plain JSON body.
    const body = JSON.stringify({
      orderId,
      externalId: 'wx_tx_abc123',
      amountCents: 59900,
      currency: 'CNY',
      tradeState: 'SUCCESS',
    })

    const result = await handleCnPaymentWebhook({
      channel: 'wechat',
      body,
      headers: new Headers(),
    })

    expect(result.status).toBe('processed')
    expect(result.event.type).toBe('paid')
    expect(result.activation).not.toBeNull()
    expect(result.activation?.creditsGranted).toBe(6000)

    expect(STORE.subscriptions).toHaveLength(1)
    expect(STORE.subscriptions[0]).toMatchObject({
      userId: 'user_pro',
      plan: 'pro',
      status: 'active',
      cadence: 'monthly',
      stripeSubscriptionId: orderId,
    })

    expect(STORE.wallets).toHaveLength(1)
    expect(STORE.wallets[0]).toMatchObject({
      userId: 'user_pro',
      balance: 6000,
      lifetimeEarned: 6000,
    })

    const tx = STORE.creditTxs.find((t) => t.type === 'subscription')
    expect(tx).toBeDefined()
    expect(tx?.amount).toBe(6000)
    expect((tx?.metadata as Record<string, unknown>)?.channel).toBe('wechat')
    expect((tx?.metadata as Record<string, unknown>)?.idempotencyKey).toBe('cn:wechat:wx_tx_abc123')

    const audit = STORE.auditLogs.find((a) => a.action === 'subscription.activated')
    expect(audit).toBeDefined()
    expect(audit?.actorType).toBe('system')
    expect(audit?.actorId).toBe('cn-wechat')
    expect(audit?.targetId).toBe('user_pro')

    // User.plan flipped to pro.
    expect(STORE.users.find((u) => u.id === 'user_pro')?.plan).toBe('pro')
  })

  it('is idempotent — replaying the same webhook does NOT double-grant', async () => {
    const { handleCnPaymentWebhook, rememberCheckoutContext, generateCnOrderId } =
      await importModule()

    const orderId = generateCnOrderId({
      channel: 'wechat',
      userId: 'user_pro',
      planSlug: 'pro',
    })
    rememberCheckoutContext(orderId, {
      userId: 'user_pro',
      planSlug: 'pro',
      cadence: 'monthly',
      channel: 'wechat',
      scene: 'native',
    })

    const body = JSON.stringify({
      orderId,
      externalId: 'wx_tx_same',
      amountCents: 59900,
      currency: 'CNY',
      tradeState: 'SUCCESS',
    })

    await handleCnPaymentWebhook({ channel: 'wechat', body, headers: new Headers() })
    const again = await handleCnPaymentWebhook({ channel: 'wechat', body, headers: new Headers() })

    expect(again.status).toBe('duplicate')
    expect(STORE.wallets[0]?.balance).toBe(6000) // still 6000, not 12000
    expect(STORE.creditTxs.filter((t) => t.type === 'subscription')).toHaveLength(1)
    // Audit fires once.
    expect(STORE.auditLogs.filter((a) => a.action === 'subscription.activated')).toHaveLength(1)
  })

  it('ignores non-paid events (trade_state != SUCCESS)', async () => {
    const { handleCnPaymentWebhook, rememberCheckoutContext, generateCnOrderId } =
      await importModule()

    const orderId = generateCnOrderId({
      channel: 'wechat',
      userId: 'user_pro',
      planSlug: 'pro',
    })
    rememberCheckoutContext(orderId, {
      userId: 'user_pro',
      planSlug: 'pro',
      cadence: 'monthly',
      channel: 'wechat',
      scene: 'native',
    })

    const result = await handleCnPaymentWebhook({
      channel: 'wechat',
      body: JSON.stringify({ orderId, tradeState: 'CLOSED', amountCents: 0 }),
      headers: new Headers(),
    })

    expect(result.status).toBe('ignored')
    expect(STORE.subscriptions).toHaveLength(0)
    expect(STORE.wallets).toHaveLength(0)
  })

  it('ignores when checkout context is missing (stray webhook)', async () => {
    const { handleCnPaymentWebhook } = await importModule()

    const result = await handleCnPaymentWebhook({
      channel: 'wechat',
      body: JSON.stringify({
        orderId: 'wx_unknown_order',
        externalId: 'wx_tx_xyz',
        amountCents: 59900,
        currency: 'CNY',
        tradeState: 'SUCCESS',
      }),
      headers: new Headers(),
    })

    expect(result.status).toBe('ignored')
    expect(result.message).toContain('missing checkout context')
  })
})

describe('payments e2e — Alipay webhook → subscription activation', () => {
  it('activates Starter (1500 credits) via alipay mock webhook', async () => {
    const { handleCnPaymentWebhook, rememberCheckoutContext, generateCnOrderId } =
      await importModule()

    const orderId = generateCnOrderId({
      channel: 'alipay',
      userId: 'user_starter',
      planSlug: 'starter',
    })
    rememberCheckoutContext(orderId, {
      userId: 'user_starter',
      planSlug: 'starter',
      cadence: 'monthly',
      channel: 'alipay',
      scene: 'native',
    })

    const body = new URLSearchParams({
      out_trade_no: orderId,
      trade_no: 'alipay_tx_s1',
      total_amount: '99.00',
      trade_status: 'TRADE_SUCCESS',
    }).toString()

    const result = await handleCnPaymentWebhook({
      channel: 'alipay',
      body,
      headers: new Headers(),
    })

    expect(result.status).toBe('processed')
    expect(result.activation?.creditsGranted).toBe(1500)
    expect(STORE.subscriptions[0]?.plan).toBe('starter')
    expect(STORE.wallets[0]?.balance).toBe(1500)

    const audit = STORE.auditLogs.find((a) => a.action === 'subscription.activated')
    expect(audit?.actorId).toBe('cn-alipay')
  })
})

describe('payments e2e — checkPayment polling', () => {
  it('returns pending before webhook, paid after', async () => {
    const {
      handleCnPaymentWebhook,
      rememberCheckoutContext,
      generateCnOrderId,
      checkCnPaymentStatus,
    } = await importModule()

    const orderId = generateCnOrderId({
      channel: 'wechat',
      userId: 'user_pro',
      planSlug: 'pro',
    })
    rememberCheckoutContext(orderId, {
      userId: 'user_pro',
      planSlug: 'pro',
      cadence: 'monthly',
      channel: 'wechat',
      scene: 'native',
    })

    expect(await checkCnPaymentStatus(orderId, 'user_pro')).toBe('pending')

    await handleCnPaymentWebhook({
      channel: 'wechat',
      body: JSON.stringify({
        orderId,
        externalId: 'wx_tx_paid',
        amountCents: 59900,
        currency: 'CNY',
        tradeState: 'SUCCESS',
      }),
      headers: new Headers(),
    })

    expect(await checkCnPaymentStatus(orderId, 'user_pro')).toBe('paid')
  })
})
