import type {
  ActivityEvent,
  ActivityType,
  AlertSeverity,
  AuditLogEntry,
  AuditQuery,
  AuditQueryResult,
  CreditTransactionRow,
  FinanceSnapshot,
  MetricSnapshot,
  OverviewSnapshot,
  RefundRow,
  RefundStatus,
  RevenueCostPoint,
  StripePayoutRow,
  StripePayoutStatus,
  SubscriptionPlan,
  SuperUserDetail,
  SuperUserRow,
  SystemAlert,
  TeamMember,
  UserStatus,
} from './types'

/**
 * Deterministic seeded mock data so server / client renders match (avoids
 * Next.js hydration warnings) and so screenshots stay stable while real
 * services/api wiring is being built by W3.
 */

// ─────────────────────────────────────────────────────────────────────────
// PRNG — Mulberry32 (32-bit, deterministic, fast)
// ─────────────────────────────────────────────────────────────────────────

function mulberry32(seed: number) {
  let a = seed >>> 0
  return function rand(): number {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function pick<T>(rng: () => number, arr: readonly T[]): T {
  // Length is guaranteed > 0 by all callers; we keep the assertion local so
  // strict `noUncheckedIndexedAccess` stays happy elsewhere.
  return arr[Math.floor(rng() * arr.length)] as T
}

function range(n: number): number[] {
  return Array.from({ length: n }, (_, i) => i)
}

// ─────────────────────────────────────────────────────────────────────────
// Frozen reference timestamp.
//
// We deliberately use a fixed "now" so server-rendered snapshots are stable
// during dev. The real implementation behind tRPC will use Date.now().
// ─────────────────────────────────────────────────────────────────────────

export const MOCK_NOW_UTC_MS = Date.UTC(2026, 3, 19, 10, 23, 42) // 2026-04-19 10:23:42

// ─────────────────────────────────────────────────────────────────────────
// Overview
// ─────────────────────────────────────────────────────────────────────────

function makeTrend(seed: number, base: number, variance: number): number[] {
  const rng = mulberry32(seed)
  let v = base
  return range(30).map(() => {
    v += (rng() - 0.45) * variance
    return Math.max(0, Math.round(v))
  })
}

const METRICS: MetricSnapshot[] = [
  {
    id: 'mrr',
    label: 'MRR',
    value: 142_310,
    unit: 'usd',
    delta: { value: 12.3, direction: 'up' },
    trend: makeTrend(1001, 122_000, 6_000),
  },
  {
    id: 'arr',
    label: 'ARR',
    value: 1_707_720,
    unit: 'usd',
    delta: { value: 180.1, direction: 'up' },
    trend: makeTrend(1002, 1_400_000, 60_000),
  },
  {
    id: 'users',
    label: 'USERS',
    value: 18_234,
    unit: 'count',
    delta: { value: 2.4, direction: 'up' },
    trend: makeTrend(1003, 16_000, 600),
  },
  {
    id: 'dau',
    label: 'DAU',
    value: 4_921,
    unit: 'count',
    delta: { value: 0.8, direction: 'down' },
    trend: makeTrend(1004, 4_500, 350),
  },
]

function makeRevenueSeries(): RevenueCostPoint[] {
  const rngR = mulberry32(2001)
  const rngC = mulberry32(2002)
  let revenue = 3_400
  let aiCost = 480
  return range(30).map((i) => {
    revenue += (rngR() - 0.4) * 220
    aiCost += (rngC() - 0.45) * 35
    const date = new Date(MOCK_NOW_UTC_MS - (29 - i) * 24 * 60 * 60 * 1000)
    return {
      date: date.toISOString().slice(0, 10),
      revenue: Math.max(800, Math.round(revenue)),
      aiCost: Math.max(120, Math.round(aiCost)),
    }
  })
}

const ALERTS: SystemAlert[] = [
  {
    id: 'alert_kling_latency',
    severity: 'warning',
    source: 'AI Operations',
    message: 'Kling 2.0 p95 latency +340ms (last 5m)',
    occurredAt: MOCK_NOW_UTC_MS - 5 * 60 * 1000,
  },
  {
    id: 'alert_stripe_backlog',
    severity: 'warning',
    source: 'Billing',
    message: 'Stripe webhook backlog: 12 events',
    occurredAt: MOCK_NOW_UTC_MS - 2 * 60 * 1000,
  },
  {
    id: 'alert_refund_queue',
    severity: 'critical',
    source: 'Finance',
    message: 'Refund queue: 8 requests aged >24h',
    occurredAt: MOCK_NOW_UTC_MS,
  },
]

const ACTIVITY_FIXTURES: ActivityEvent[] = [
  {
    id: 'act_1',
    type: 'subscription_upgrade',
    occurredAt: MOCK_NOW_UTC_MS - 8 * 1000,
    actor: { id: 'usr_7a8f', label: 'user_7a8f' },
    amountUsd: 99,
    description: 'upgraded to Pro',
  },
  {
    id: 'act_2',
    type: 'site_published',
    occurredAt: MOCK_NOW_UTC_MS - 14 * 1000,
    actor: { id: 'usr_a3f81', label: 'user_a3f81' },
    target: { id: 'site_a3f81', label: 'site_a3f81' },
    description: 'site_a3f81 published',
  },
  {
    id: 'act_3',
    type: 'credits_purchase',
    occurredAt: MOCK_NOW_UTC_MS - 30 * 1000,
    actor: { id: 'usr_19c0', label: 'user_19c0' },
    amountUsd: 69,
    description: 'credits purchased 12,500',
  },
  {
    id: 'act_4',
    type: 'user_signup',
    occurredAt: MOCK_NOW_UTC_MS - 65 * 1000,
    actor: { id: 'usr_4d12', label: 'user_4d12' },
    description: 'new free signup',
  },
  {
    id: 'act_5',
    type: 'refund_issued',
    occurredAt: MOCK_NOW_UTC_MS - 95 * 1000,
    actor: { id: 'usr_5b29', label: 'user_5b29' },
    amountUsd: 29,
    description: 'manual refund (duplicate charge)',
  },
  {
    id: 'act_6',
    type: 'super_login',
    occurredAt: MOCK_NOW_UTC_MS - 130 * 1000,
    actor: { id: 'sa_alex', label: 'alex (OWNER)' },
    description: 'super-admin sign-in from 198.51.100.4',
  },
  {
    id: 'act_7',
    type: 'subscription_downgrade',
    occurredAt: MOCK_NOW_UTC_MS - 220 * 1000,
    actor: { id: 'usr_a991', label: 'user_a991' },
    description: 'downgraded Pro → Starter',
  },
]

export function getOverviewSnapshot(): OverviewSnapshot {
  return {
    metrics: METRICS,
    revenueSeries: makeRevenueSeries(),
    alerts: ALERTS,
    recentActivity: ACTIVITY_FIXTURES,
    generatedAt: MOCK_NOW_UTC_MS,
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Live activity stream — generates synthetic events
// ─────────────────────────────────────────────────────────────────────────

const LIVE_TYPES: readonly ActivityType[] = [
  'user_signup',
  'subscription_upgrade',
  'subscription_downgrade',
  'credits_purchase',
  'site_published',
  'refund_issued',
]

const LIVE_DESCRIPTIONS: Record<ActivityType, string[]> = {
  user_signup: ['new free signup', 'new starter signup', 'invited teammate joined'],
  subscription_upgrade: ['upgraded to Pro', 'upgraded to Business', 'starter → pro upgrade'],
  subscription_downgrade: ['Pro → Starter downgrade', 'Business → Pro downgrade'],
  credits_purchase: [
    'credits purchased 5,000',
    'credits purchased 12,500',
    'credits purchased 30,000',
  ],
  site_published: ['site published', 'site re-published with new theme', 'custom domain attached'],
  refund_issued: ['refund issued (duplicate)', 'refund issued (chargeback)'],
  super_login: ['super-admin sign-in'],
}

export function generateLiveEvent(seed: number): ActivityEvent {
  const rng = mulberry32(seed)
  const type = pick(rng, LIVE_TYPES)
  const id = `act_live_${seed.toString(36)}`
  const userPart = Math.floor(rng() * 0xffff).toString(16).padStart(4, '0')
  const descriptions = LIVE_DESCRIPTIONS[type]
  // descriptions arrays above are guaranteed non-empty for live types
  const description = descriptions[Math.floor(rng() * descriptions.length)]!
  const amount =
    type === 'subscription_upgrade'
      ? pick(rng, [29, 49, 99, 199])
      : type === 'credits_purchase'
        ? pick(rng, [19, 39, 69, 149])
        : type === 'refund_issued'
          ? pick(rng, [9, 19, 29, 49])
          : undefined

  return {
    id,
    type,
    occurredAt: Date.now(),
    actor: { id: `usr_${userPart}`, label: `user_${userPart}` },
    description,
    amountUsd: amount,
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Users
// ─────────────────────────────────────────────────────────────────────────

const FIRST_NAMES = [
  'Alex', 'Jordan', 'Riley', 'Sam', 'Morgan', 'Casey', 'Kai', 'Sky',
  'Avery', 'Quinn', 'Drew', 'Reese', 'Jamie', 'Rowan', 'Sage',
] as const

const LAST_NAMES = [
  'Chen', 'Patel', 'Garcia', 'Smith', 'Müller', 'Tanaka', 'Singh',
  'Okafor', 'Rossi', 'Nguyen', 'Cohen', 'Andersson', 'Costa',
] as const

const COUNTRIES = ['US', 'GB', 'DE', 'JP', 'BR', 'CA', 'AU', 'IN', 'NL', 'SG'] as const
const PLANS: readonly SubscriptionPlan[] = ['free', 'starter', 'pro', 'business']
const PLAN_WEIGHTS = [0.6, 0.22, 0.14, 0.04] as const
const STATUSES: readonly UserStatus[] = ['active', 'active', 'active', 'pending', 'suspended']

function pickWeighted<T>(rng: () => number, items: readonly T[], weights: readonly number[]): T {
  const r = rng()
  let acc = 0
  for (let i = 0; i < items.length; i += 1) {
    acc += weights[i] ?? 0
    if (r <= acc) return items[i] as T
  }
  return items[items.length - 1] as T
}

function makeUserRow(rng: () => number, idx: number): SuperUserRow {
  const first = pick(rng, FIRST_NAMES)
  const last = pick(rng, LAST_NAMES)
  const id = `usr_${(0x10000 + idx).toString(16)}`
  const plan = pickWeighted(rng, PLANS, PLAN_WEIGHTS)
  const status = pick(rng, STATUSES)
  const sites = plan === 'free' ? Math.floor(rng() * 2) : 1 + Math.floor(rng() * 4)
  const credits =
    plan === 'free'
      ? Math.floor(rng() * 200)
      : plan === 'starter'
        ? 200 + Math.floor(rng() * 800)
        : plan === 'pro'
          ? 1_500 + Math.floor(rng() * 3_500)
          : 8_000 + Math.floor(rng() * 12_000)
  const lifetime =
    plan === 'free'
      ? Math.floor(rng() * 5)
      : plan === 'starter'
        ? 29 + Math.floor(rng() * 200)
        : plan === 'pro'
          ? 200 + Math.floor(rng() * 1_500)
          : 1_500 + Math.floor(rng() * 8_000)
  const signedUpDaysAgo = Math.floor(rng() * 700)
  const lastSeenHoursAgo = rng() < 0.85 ? Math.floor(rng() * 720) : null

  return {
    id,
    email: `${first.toLowerCase()}.${last.toLowerCase().replace('ü', 'u')}@example.com`,
    name: `${first} ${last}`,
    status,
    plan,
    sitesCount: sites,
    creditsBalance: credits,
    lifetimeSpendUsd: lifetime,
    signedUpAt: MOCK_NOW_UTC_MS - signedUpDaysAgo * 24 * 60 * 60 * 1000,
    lastSeenAt:
      lastSeenHoursAgo === null ? null : MOCK_NOW_UTC_MS - lastSeenHoursAgo * 60 * 60 * 1000,
    country: pick(rng, COUNTRIES),
  }
}

let _userCache: SuperUserRow[] | undefined

export function getUserRows(): SuperUserRow[] {
  if (!_userCache) {
    const rng = mulberry32(3001)
    _userCache = range(64).map((i) => makeUserRow(rng, i))
  }
  return _userCache
}

export function getUserDetail(userId: string): SuperUserDetail | undefined {
  const row = getUserRows().find((u) => u.id === userId)
  if (!row) return undefined
  const rng = mulberry32(parseInt(userId.slice(4), 16) || 1)

  const recentSites = range(row.sitesCount).map((i) => ({
    id: `site_${row.id.slice(4)}_${i}`,
    name: pick(rng, ['Toybloom', 'Northwind', 'Atlas Goods', 'Lumen', 'Velvet & Oak', 'Kindle Co.']),
    domain: `${row.id.slice(4)}-${i}.forgely.app`,
    status: pick(rng, ['draft', 'published', 'paused'] as const),
    publishedAt:
      rng() < 0.7 ? MOCK_NOW_UTC_MS - Math.floor(rng() * 60) * 24 * 60 * 60 * 1000 : null,
  }))

  const recentTransactions = range(6).map((i) => {
    const type = pick(rng, ['subscription', 'credits_pack', 'refund'] as const)
    const amount =
      type === 'subscription'
        ? pick(rng, [29, 49, 99, 199])
        : type === 'credits_pack'
          ? pick(rng, [19, 39, 69, 149])
          : -pick(rng, [9, 19, 29])
    return {
      id: `tx_${row.id}_${i}`,
      type,
      amountUsd: amount,
      occurredAt: MOCK_NOW_UTC_MS - (i * 6 + Math.floor(rng() * 4)) * 24 * 60 * 60 * 1000,
      description:
        type === 'subscription'
          ? `${row.plan} renewal`
          : type === 'credits_pack'
            ? `Credits pack`
            : `Refund processed`,
    }
  })

  return {
    ...row,
    emailVerified: rng() > 0.1,
    twoFactorEnabled: rng() > 0.7,
    notes: row.status === 'suspended' ? ['Suspended by admin pending verification'] : [],
    recentSites,
    recentTransactions,
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Finance
// ─────────────────────────────────────────────────────────────────────────

function makePayouts(): StripePayoutRow[] {
  const rng = mulberry32(4001)
  const statuses: readonly StripePayoutStatus[] = ['paid', 'paid', 'paid', 'in_transit', 'pending', 'failed']
  return range(8).map((i) => ({
    id: `po_${(0x1000 + i).toString(16)}`,
    amountUsd: 8_000 + Math.floor(rng() * 18_000),
    status: pick(rng, statuses),
    arrivalDate: MOCK_NOW_UTC_MS - i * 24 * 60 * 60 * 1000,
    bankLast4: String(2000 + Math.floor(rng() * 7999)).slice(-4),
  }))
}

function makeCreditTransactions(): CreditTransactionRow[] {
  const rng = mulberry32(4002)
  const users = getUserRows().slice(0, 14)
  return range(20).map((i) => {
    const u = users[i % users.length]!
    const type = pick(
      rng,
      ['consumption', 'consumption', 'consumption', 'purchase', 'monthly_reset', 'refund', 'grant'] as const,
    )
    const amount =
      type === 'consumption'
        ? -pick(rng, [50, 80, 120, 240])
        : type === 'purchase'
          ? pick(rng, [5_000, 12_500, 30_000])
          : type === 'monthly_reset'
            ? pick(rng, [1_000, 2_500])
            : type === 'refund'
              ? pick(rng, [200, 500])
              : pick(rng, [100, 250, 500])
    const occurredAt = MOCK_NOW_UTC_MS - i * 47 * 60 * 1000
    return {
      id: `ct_${(0x10000 + i).toString(16)}`,
      userId: u.id,
      userEmail: u.email,
      type,
      amount,
      balanceAfter: Math.max(0, u.creditsBalance + amount * (i % 3 === 0 ? 1 : 0)),
      occurredAt,
      description:
        type === 'consumption'
          ? 'Hero moment generation'
          : type === 'purchase'
            ? 'Credits pack purchase'
            : type === 'monthly_reset'
              ? 'Monthly subscription reset'
              : type === 'refund'
                ? 'Refund granted'
                : 'Manual grant',
    }
  })
}

function makeRefunds(): RefundRow[] {
  const rng = mulberry32(4003)
  const users = getUserRows().slice(2, 14)
  const statuses: readonly RefundStatus[] = ['queued', 'queued', 'queued', 'approved', 'rejected', 'completed']
  return range(11).map((i) => {
    const u = users[i % users.length]!
    const ageHours = i < 4 ? 26 + Math.floor(rng() * 20) : Math.floor(rng() * 24)
    return {
      id: `re_${(0x100 + i).toString(16)}`,
      userId: u.id,
      userEmail: u.email,
      amountUsd: pick(rng, [9, 19, 29, 49, 99]),
      reason: pick(rng, [
        'Duplicate charge',
        'Subscription not used',
        'Chargeback dispute',
        'Service unavailable',
      ]),
      status: pick(rng, statuses),
      requestedAt: MOCK_NOW_UTC_MS - ageHours * 60 * 60 * 1000,
      ageHours,
    }
  })
}

export function getFinanceSnapshot(): FinanceSnapshot {
  return {
    mrr: 142_310,
    arr: 1_707_720,
    netRevenue30d: 134_982,
    refundsPending: 8,
    payouts: makePayouts(),
    creditTransactions: makeCreditTransactions(),
    refunds: makeRefunds(),
    generatedAt: MOCK_NOW_UTC_MS,
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Audit log
// ─────────────────────────────────────────────────────────────────────────

const AUDIT_ACTIONS = [
  'user.suspend',
  'user.unsuspend',
  'user.delete',
  'user.role.change',
  'credits.grant',
  'credits.revoke',
  'subscription.refund',
  'support.login_as_user.requested',
  'support.login_as_user.granted',
  'support.login_as_user.expired',
  'team.invite',
  'team.remove',
  'platform.setting.change',
  'site.takedown',
  'site.unflag',
] as const

const AUDIT_ACTORS = [
  { id: 'sa_alex', label: 'alex (OWNER)' },
  { id: 'sa_priya', label: 'priya (ADMIN)' },
  { id: 'sa_lin', label: 'lin (SUPPORT)' },
  { id: 'system', label: 'system' },
] as const

function makeAuditEntries(): AuditLogEntry[] {
  const rng = mulberry32(5001)
  const users = getUserRows()
  return range(180)
    .map((i): AuditLogEntry => {
      const action = pick(rng, AUDIT_ACTIONS)
      const actorMeta = pick(rng, AUDIT_ACTORS)
      const target = users[i % users.length]!
      const ageMinutes = i * 17 + Math.floor(rng() * 11)
      const occurredAt = MOCK_NOW_UTC_MS - ageMinutes * 60 * 1000
      const isUserAction = action.startsWith('user.') || action.startsWith('subscription.') || action.startsWith('credits.')
      const targetType = isUserAction ? 'user' : action.startsWith('site.') ? 'site' : action.startsWith('team.') ? 'team_member' : 'platform'

      return {
        id: `al_${(0x100000 + i).toString(16)}`,
        actorType: actorMeta.id === 'system' ? 'system' : 'super_admin',
        actorId: actorMeta.id,
        actorLabel: actorMeta.label,
        action,
        targetType,
        targetId: targetType === 'user' ? target.id : `${targetType}_${(0x100 + i).toString(16)}`,
        targetLabel: targetType === 'user' ? target.email : undefined,
        before: action.endsWith('.change') ? { plan: 'starter' } : undefined,
        after: action.endsWith('.change') ? { plan: 'pro' } : undefined,
        reason: rng() < 0.4 ? 'Customer support escalation #4821' : undefined,
        ipAddress: `198.51.${Math.floor(rng() * 255)}.${Math.floor(rng() * 255)}`,
        userAgent: 'Mozilla/5.0 (Forgely Super Console)',
        occurredAt,
      }
    })
    .sort((a, b) => b.occurredAt - a.occurredAt)
}

let _auditCache: AuditLogEntry[] | undefined

export function getAuditEntries(): AuditLogEntry[] {
  if (!_auditCache) _auditCache = makeAuditEntries()
  return _auditCache
}

export function queryAudit(query: AuditQuery): AuditQueryResult {
  const all = getAuditEntries()
  const page = Math.max(1, query.page ?? 1)
  const pageSize = Math.max(1, Math.min(query.pageSize ?? 50, 500))
  const fromTs = query.fromDate ? Date.parse(query.fromDate) : undefined
  const toTs = query.toDate ? Date.parse(query.toDate) + 86_400_000 : undefined
  const search = query.search?.trim().toLowerCase()

  const filtered = all.filter((row) => {
    if (query.actorId && row.actorId !== query.actorId) return false
    if (query.actorType && row.actorType !== query.actorType) return false
    if (query.action && row.action !== query.action) return false
    if (query.targetType && row.targetType !== query.targetType) return false
    if (query.targetId && row.targetId !== query.targetId) return false
    if (fromTs && row.occurredAt < fromTs) return false
    if (toTs && row.occurredAt >= toTs) return false
    if (search) {
      const hay = `${row.action} ${row.actorLabel} ${row.targetLabel ?? ''} ${row.reason ?? ''}`.toLowerCase()
      if (!hay.includes(search)) return false
    }
    return true
  })

  const start = (page - 1) * pageSize
  return {
    rows: filtered.slice(start, start + pageSize),
    totalRows: filtered.length,
    page,
    pageSize,
  }
}

export function getAuditActions(): readonly string[] {
  return AUDIT_ACTIONS
}

export function getAuditActors(): ReadonlyArray<{ id: string; label: string }> {
  return AUDIT_ACTORS
}

// ─────────────────────────────────────────────────────────────────────────
// Team
// ─────────────────────────────────────────────────────────────────────────

const TEAM_FIXTURES: TeamMember[] = [
  {
    id: 'sa_alex',
    email: 'alex@forgely.com',
    name: 'Alex Chen',
    role: 'OWNER',
    invitedAt: MOCK_NOW_UTC_MS - 365 * 24 * 60 * 60 * 1000,
    acceptedAt: MOCK_NOW_UTC_MS - 365 * 24 * 60 * 60 * 1000,
    twoFactorEnabled: true,
    lastSeenAt: MOCK_NOW_UTC_MS - 4 * 60 * 1000,
  },
  {
    id: 'sa_priya',
    email: 'priya@forgely.com',
    name: 'Priya Patel',
    role: 'ADMIN',
    invitedAt: MOCK_NOW_UTC_MS - 220 * 24 * 60 * 60 * 1000,
    acceptedAt: MOCK_NOW_UTC_MS - 219 * 24 * 60 * 60 * 1000,
    twoFactorEnabled: true,
    lastSeenAt: MOCK_NOW_UTC_MS - 22 * 60 * 1000,
  },
  {
    id: 'sa_lin',
    email: 'lin@forgely.com',
    name: 'Lin Rossi',
    role: 'SUPPORT',
    invitedAt: MOCK_NOW_UTC_MS - 90 * 24 * 60 * 60 * 1000,
    acceptedAt: MOCK_NOW_UTC_MS - 89 * 24 * 60 * 60 * 1000,
    twoFactorEnabled: false,
    lastSeenAt: MOCK_NOW_UTC_MS - 7 * 60 * 60 * 1000,
  },
  {
    id: 'sa_marc',
    email: 'marc@forgely.com',
    name: 'Marc Cohen',
    role: 'SUPPORT',
    invitedAt: MOCK_NOW_UTC_MS - 5 * 24 * 60 * 60 * 1000,
    acceptedAt: null,
    twoFactorEnabled: false,
    lastSeenAt: null,
  },
]

export function getTeamMembers(): TeamMember[] {
  return TEAM_FIXTURES
}

export function getAlertTone(severity: AlertSeverity): 'info' | 'warning' | 'error' {
  if (severity === 'info') return 'info'
  if (severity === 'critical') return 'error'
  return 'warning'
}
