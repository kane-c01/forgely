/**
 * Domain types for the /super console.
 *
 * These mirror what `services/api` (T05/T06) will eventually return through
 * the `super` tRPC router. The /super pages import from this file only, so
 * once the real API exists we just have to swap `mock-data.ts` for a tRPC
 * client without touching any UI.
 *
 * Source of truth:
 *   - docs/MASTER.md §20 (Super Admin)
 *   - docs/MASTER.md §30 (Prisma schema — AuditLog, User, Subscription, …)
 */

// ─────────────────────────────────────────────────────────────────────────
// Roles & Auth
// ─────────────────────────────────────────────────────────────────────────

/** Three-tier role model — docs/MASTER.md §20.2 (decision Q2:A). */
export type SuperRole = 'OWNER' | 'ADMIN' | 'SUPPORT'

export interface SuperSession {
  userId: string
  email: string
  name: string
  role: SuperRole
  /** UTC unix ms — drives the inactivity warning in the topbar. */
  lastActiveAt: number
}

// ─────────────────────────────────────────────────────────────────────────
// Overview
// ─────────────────────────────────────────────────────────────────────────

export type DeltaDirection = 'up' | 'down' | 'flat'

export interface MetricSnapshot {
  /** Stable id used in URL fragments / debugging — e.g. "mrr", "dau". */
  id: 'mrr' | 'arr' | 'users' | 'dau' | 'gross_margin' | 'ai_spend'
  label: string
  value: number
  /** Rendered using `formatMetric()` — e.g. "$142,310" or "18,234". */
  unit: 'usd' | 'count' | 'percent'
  delta: { value: number; direction: DeltaDirection }
  /** 30-point sparkline series. Most-recent value last. */
  trend: number[]
}

export interface RevenueCostPoint {
  /** ISO date "2026-04-01". */
  date: string
  revenue: number
  aiCost: number
}

export type AlertSeverity = 'info' | 'warning' | 'critical'

export interface SystemAlert {
  id: string
  severity: AlertSeverity
  source: string
  message: string
  /** UTC unix ms. */
  occurredAt: number
}

export type ActivityType =
  | 'user_signup'
  | 'subscription_upgrade'
  | 'subscription_downgrade'
  | 'credits_purchase'
  | 'site_published'
  | 'refund_issued'
  | 'super_login'

export interface ActivityEvent {
  id: string
  type: ActivityType
  /** UTC unix ms. */
  occurredAt: number
  actor: { id: string; label: string }
  target?: { id: string; label: string }
  amountUsd?: number
  description: string
}

export interface OverviewSnapshot {
  metrics: MetricSnapshot[]
  revenueSeries: RevenueCostPoint[]
  alerts: SystemAlert[]
  recentActivity: ActivityEvent[]
  /** Server time (UTC unix ms) when the snapshot was assembled. */
  generatedAt: number
}

// ─────────────────────────────────────────────────────────────────────────
// Users
// ─────────────────────────────────────────────────────────────────────────

export type UserStatus = 'active' | 'suspended' | 'pending' | 'banned'
export type SubscriptionPlan = 'free' | 'starter' | 'pro' | 'business'

export interface SuperUserRow {
  id: string
  email: string
  name: string
  status: UserStatus
  plan: SubscriptionPlan
  sitesCount: number
  creditsBalance: number
  lifetimeSpendUsd: number
  /** UTC unix ms. */
  signedUpAt: number
  /** UTC unix ms or null if never. */
  lastSeenAt: number | null
  country?: string
}

export interface SuperUserDetail extends SuperUserRow {
  emailVerified: boolean
  phone?: string
  twoFactorEnabled: boolean
  notes: string[]
  recentSites: Array<{
    id: string
    name: string
    domain: string
    status: 'draft' | 'published' | 'paused'
    publishedAt: number | null
  }>
  recentTransactions: Array<{
    id: string
    type: 'subscription' | 'credits_pack' | 'refund'
    amountUsd: number
    occurredAt: number
    description: string
  }>
}

// ─────────────────────────────────────────────────────────────────────────
// Finance
// ─────────────────────────────────────────────────────────────────────────

export type StripePayoutStatus = 'paid' | 'pending' | 'failed' | 'in_transit'

export interface StripePayoutRow {
  id: string
  amountUsd: number
  status: StripePayoutStatus
  arrivalDate: number
  bankLast4: string
}

export interface CreditTransactionRow {
  id: string
  userId: string
  userEmail: string
  type: 'consumption' | 'purchase' | 'refund' | 'grant' | 'monthly_reset'
  /** Negative for consumption, positive for credits added. */
  amount: number
  balanceAfter: number
  occurredAt: number
  description: string
}

export type RefundStatus = 'queued' | 'approved' | 'rejected' | 'completed'

export interface RefundRow {
  id: string
  userId: string
  userEmail: string
  amountUsd: number
  reason: string
  status: RefundStatus
  requestedAt: number
  /** Hours since request — used for the >24h alert badge. */
  ageHours: number
}

export interface FinanceSnapshot {
  mrr: number
  arr: number
  netRevenue30d: number
  refundsPending: number
  payouts: StripePayoutRow[]
  creditTransactions: CreditTransactionRow[]
  refunds: RefundRow[]
  generatedAt: number
}

// ─────────────────────────────────────────────────────────────────────────
// Audit log
// ─────────────────────────────────────────────────────────────────────────

export type AuditActorType = 'super_admin' | 'user' | 'system'

export interface AuditLogEntry {
  id: string
  actorType: AuditActorType
  actorId: string
  actorLabel: string
  action: string
  targetType: string
  targetId: string
  targetLabel?: string
  before?: Record<string, unknown>
  after?: Record<string, unknown>
  reason?: string
  ipAddress: string
  userAgent: string
  /** UTC unix ms. */
  occurredAt: number
}

export interface AuditQuery {
  actorId?: string
  actorType?: AuditActorType
  action?: string
  targetType?: string
  targetId?: string
  /** ISO date inclusive. */
  fromDate?: string
  /** ISO date inclusive. */
  toDate?: string
  search?: string
  /** 1-indexed page. */
  page?: number
  pageSize?: number
}

export interface AuditQueryResult {
  rows: AuditLogEntry[]
  totalRows: number
  page: number
  pageSize: number
}

// ─────────────────────────────────────────────────────────────────────────
// Team
// ─────────────────────────────────────────────────────────────────────────

export interface TeamMember {
  id: string
  email: string
  name: string
  role: SuperRole
  /** UTC unix ms. */
  invitedAt: number
  acceptedAt: number | null
  twoFactorEnabled: boolean
  lastSeenAt: number | null
}
