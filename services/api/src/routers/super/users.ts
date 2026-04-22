/**
 * /super > Users tRPC sub-router.
 *
 * Depends on (provided by W3):
 *   - `superAdminProcedure` from `../../trpc`
 *     (a procedure that already enforces `session.role === 'super_admin'`
 *      and exposes `ctx.prisma`, `ctx.session`, `ctx.request`)
 *   - `router` factory from `../../trpc`
 *
 * Until those land, the imports below are flagged as "unresolved" by the
 * IDE but will compile cleanly the moment T06 wires them up.
 */

import { router, superAdminProcedure } from '../../trpc'
import type { Prisma } from '@prisma/client'
import { TRPCError } from '@trpc/server'
import { assertCan } from './_acl'
import { recordAudit, SUPER_ACTIONS } from './_audit-log'
import {
  grantCreditsInput,
  listUsersInput,
  requestLoginAsInput,
  respondLoginAsInput,
  suspendUserInput,
  userIdInput,
} from './_schemas'

/**
 * Enrich a Prisma `User` row with the derived fields the /super UI uses
 * (`status`, `sitesCount`, `creditsBalance`, `lifetimeSpendUsd`,
 * `signedUpAt`, `lastSeenAt`).
 *
 * Shape matches `apps/app/lib/super/types.ts::SuperUserRow` so the
 * frontend can consume `trpc.super.users.list` rows without an adapter.
 */
interface UserWithRelations {
  id: string
  email: string
  name: string | null
  plan: string
  role: string
  region: string
  deletedAt: Date | null
  createdAt: Date
  updatedAt: Date
  _count: { sites: number }
  credits: { balance: number } | null
  subscription: { plan: string; status: string; cancelAtPeriodEnd: boolean } | null
  creditTxns: Array<{ amount: number; type: string }>
}

function mapUserRow(u: UserWithRelations) {
  // `deletedAt` is our soft-delete flag; treat it as suspended for the UI.
  const status: 'active' | 'suspended' | 'pending' | 'banned' = u.deletedAt ? 'suspended' : 'active'
  const plan = (['free', 'starter', 'pro', 'business'] as const).includes(
    u.plan as 'free' | 'starter' | 'pro' | 'business',
  )
    ? (u.plan as 'free' | 'starter' | 'pro' | 'business')
    : 'free'
  // Paid-in credits — the non-`grant`, non-`monthly_reset` deltas give us
  // a cheap lifetime-spend proxy until Stripe invoice history lands.
  const lifetimeSpendCredits = u.creditTxns
    .filter((t) => t.type === 'purchase' || t.type === 'subscription')
    .reduce((s, t) => s + Math.max(0, t.amount), 0)
  return {
    id: u.id,
    email: u.email,
    name: u.name ?? u.email.split('@')[0] ?? u.email,
    status,
    plan,
    sitesCount: u._count.sites,
    creditsBalance: u.credits?.balance ?? 0,
    // Credits ≈ USD at 1¢ each in MVP (docs/MASTER.md §3.6).
    lifetimeSpendUsd: Math.round(lifetimeSpendCredits / 100),
    signedUpAt: u.createdAt.getTime(),
    lastSeenAt: u.updatedAt.getTime(),
    country: u.region === 'cn' ? 'CN' : undefined,
  }
}

export const superUsersRouter = router({
  list: superAdminProcedure.input(listUsersInput).query(async ({ ctx, input }) => {
    assertCan(ctx.user?.role, 'users.read')

    const conditions: Prisma.UserWhereInput[] = []
    if (input.plan) conditions.push({ plan: input.plan })
    if (input.status === 'suspended') conditions.push({ deletedAt: { not: null } })
    if (input.status === 'active') conditions.push({ deletedAt: null })
    if (input.search) {
      conditions.push({
        OR: [
          { email: { contains: input.search, mode: 'insensitive' } },
          { name: { contains: input.search, mode: 'insensitive' } },
          { id: { equals: input.search } },
        ],
      })
    }
    const where: Prisma.UserWhereInput = conditions.length ? { AND: conditions } : {}

    const [rows, total] = await Promise.all([
      ctx.prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (input.page - 1) * input.pageSize,
        take: input.pageSize,
        include: {
          _count: { select: { sites: true } },
          credits: { select: { balance: true } },
          subscription: { select: { plan: true, status: true, cancelAtPeriodEnd: true } },
          creditTxns: { select: { amount: true, type: true }, take: 200 },
        },
      }),
      ctx.prisma.user.count({ where }),
    ])
    return {
      rows: rows.map((r) => mapUserRow(r as unknown as UserWithRelations)),
      total,
      page: input.page,
      pageSize: input.pageSize,
    }
  }),

  detail: superAdminProcedure.input(userIdInput).query(async ({ ctx, input }) => {
    assertCan(ctx.user?.role, 'users.detail.read')
    const user = await ctx.prisma.user.findUnique({
      where: { id: input.userId },
      include: {
        sites: { take: 8, orderBy: { updatedAt: 'desc' } },
        credits: { select: { balance: true } },
        subscription: { select: { plan: true, status: true, cancelAtPeriodEnd: true } },
        creditTxns: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: { id: true, type: true, amount: true, createdAt: true, description: true },
        },
        _count: { select: { sites: true } },
      },
    })
    if (!user) throw new TRPCError({ code: 'NOT_FOUND' })

    const allTxns = await ctx.prisma.creditTransaction.findMany({
      where: { userId: user.id },
      select: { amount: true, type: true },
      take: 500,
    })
    const base = mapUserRow({
      ...user,
      creditTxns: allTxns,
    } as unknown as UserWithRelations)

    return {
      ...base,
      emailVerified: !!user.emailVerifiedAt,
      phone: user.phoneE164 ?? undefined,
      twoFactorEnabled: !!user.totpEnabledAt,
      notes: [],
      recentSites: user.sites.map((s) => ({
        id: s.id,
        name: s.name,
        domain: s.customDomain ?? `${s.subdomain}.forgely.app`,
        status: (s.status === 'published'
          ? 'published'
          : s.status === 'suspended'
            ? 'paused'
            : 'draft') as 'draft' | 'published' | 'paused',
        publishedAt: s.publishedAt ? s.publishedAt.getTime() : null,
      })),
      recentTransactions: user.creditTxns.map((t) => ({
        id: t.id,
        type:
          t.type === 'refund' ? 'refund' : t.type === 'purchase' ? 'credits_pack' : 'subscription',
        amountUsd: Math.round(Math.abs(t.amount) / 100),
        occurredAt: t.createdAt.getTime(),
        description: t.description ?? t.type,
      })),
    }
  }),

  suspend: superAdminProcedure.input(suspendUserInput).mutation(async ({ ctx, input }) => {
    assertCan(ctx.user?.role, 'users.suspend')
    const before = await ctx.prisma.user.findUnique({ where: { id: input.userId } })
    if (!before) throw new TRPCError({ code: 'NOT_FOUND' })
    // `User.status` doesn't exist on the current Prisma schema yet — W3
    // owns adding it. We approximate via `deletedAt` (soft-delete) so the
    // suspend / unsuspend round-trip still works at runtime.
    const after = await ctx.prisma.user.update({
      where: { id: input.userId },
      data: { deletedAt: new Date() },
    })
    await recordAudit(ctx, {
      action: SUPER_ACTIONS.USER_SUSPEND,
      targetType: 'user',
      targetId: input.userId,
      before: { deletedAt: before.deletedAt },
      after: { deletedAt: after.deletedAt },
      reason: input.reason,
    })
    return { ok: true as const }
  }),

  unsuspend: superAdminProcedure.input(userIdInput).mutation(async ({ ctx, input }) => {
    assertCan(ctx.user?.role, 'users.unsuspend')
    const before = await ctx.prisma.user.findUnique({ where: { id: input.userId } })
    if (!before) throw new TRPCError({ code: 'NOT_FOUND' })
    const after = await ctx.prisma.user.update({
      where: { id: input.userId },
      data: { deletedAt: null },
    })
    await recordAudit(ctx, {
      action: SUPER_ACTIONS.USER_UNSUSPEND,
      targetType: 'user',
      targetId: input.userId,
      before: { deletedAt: before.deletedAt },
      after: { deletedAt: after.deletedAt },
    })
    return { ok: true as const }
  }),

  grantCredits: superAdminProcedure.input(grantCreditsInput).mutation(async ({ ctx, input }) => {
    assertCan(ctx.user?.role, 'credits.grant')
    const credits = await ctx.prisma.userCredits.update({
      where: { userId: input.userId },
      data: { balance: { increment: input.amount } },
    })
    await ctx.prisma.creditTransaction.create({
      data: {
        userId: input.userId,
        type: 'grant',
        amount: input.amount,
        balance: credits.balance,
        description: `Manual grant by super-admin (${input.reason})`,
      },
    })
    await recordAudit(ctx, {
      action: SUPER_ACTIONS.CREDITS_GRANT,
      targetType: 'user',
      targetId: input.userId,
      after: { amount: input.amount, balance: credits.balance },
      reason: input.reason,
    })
    return { ok: true as const, balance: credits.balance }
  }),

  requestLoginAs: superAdminProcedure
    .input(requestLoginAsInput)
    .mutation(async ({ ctx, input }) => {
      assertCan(ctx.user?.role, 'users.login_as.request')
      // Real impl: insert into LoginAsTicket table + push websocket message
      // to the target user. For MVP the client polls and the user clicks
      // Allow / Deny in apps/app. The ticketId is minted here — the request
      // schema only requires userId + reason.
      const ticketId = `login_as_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
      await recordAudit(ctx, {
        action: SUPER_ACTIONS.LOGIN_AS_REQUEST,
        targetType: 'user',
        targetId: input.userId,
        reason: input.reason,
        after: { ticketId, ttlMinutes: 30 },
      })
      return {
        ticketId,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        status: 'awaiting_user' as const,
      }
    }),

  respondLoginAs: superAdminProcedure
    .input(respondLoginAsInput)
    .mutation(async ({ ctx, input }) => {
      // Called by the *target user* — the procedure check therefore needs
      // to be relaxed in W3's wiring; for now we leave it on
      // superAdminProcedure as a placeholder and the real `userProcedure`
      // will replace it.
      await recordAudit(ctx, {
        action:
          input.decision === 'allow' ? SUPER_ACTIONS.LOGIN_AS_GRANT : SUPER_ACTIONS.LOGIN_AS_DENY,
        targetType: 'login_as_ticket',
        targetId: input.ticketId,
        after: { decision: input.decision },
      })
      return { ok: true as const }
    }),
})

export type SuperUsersRouter = typeof superUsersRouter
