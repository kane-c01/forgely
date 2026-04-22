/**
 * /super > System Health tRPC sub-router. ADMIN+.
 *
 * Aggregates infrastructure signals from external SaaS:
 *
 *   - Sentry      — error rate + new issues (HTTP API)
 *   - PostHog     — DAU + WAU (HTTP API)
 *   - Cloudflare  — R2 storage usage + Workers CPU (HTTP API)
 *   - Postgres    — connection pool + slow queries (Prisma / pg_stat)
 *   - AI spend    — DeepSeek / Qwen / Anthropic / OpenAI usage (provider APIs
 *                   summarised via the existing `services/api/src/ai` module
 *                   once it lands; until then we read the local AuditLog
 *                   `ai.spend.recorded` rows for an in-DB approximation).
 *
 * Every external call is wrapped with a `safe()` helper that returns
 * `{ status: 'unavailable' | 'unconfigured', error?: string }` so the
 * dashboard never crashes on a missing token.
 */
import { router, superAdminProcedure } from '../../router/trpc.js'
import { assertCan } from './_acl.js'
import { healthSourceInput } from './_schemas.js'

export interface SafeOk<T> {
  status: 'ok'
  value: T
  fetchedAt: number
}
export interface SafeErr {
  status: 'unavailable' | 'unconfigured' | 'error'
  error?: string
  fetchedAt: number
}
export type SafeResult<T> = SafeOk<T> | SafeErr

async function safe<T>(envKey: string, fetcher: () => Promise<T>): Promise<SafeResult<T>> {
  if (!process.env[envKey]) {
    return { status: 'unconfigured', fetchedAt: Date.now() }
  }
  try {
    const value = await fetcher()
    return { status: 'ok', value, fetchedAt: Date.now() }
  } catch (err) {
    return {
      status: 'error',
      error: err instanceof Error ? err.message : String(err),
      fetchedAt: Date.now(),
    }
  }
}

export interface SentryStats {
  newIssues24h: number
  unresolvedIssues: number
  eventRatePerMin: number
}

export interface PostHogStats {
  dau: number
  wau: number
  topEvents: Array<{ event: string; count: number }>
}

export interface CloudflareStats {
  r2Storage: { totalBytes: number; objectCount: number }
  workersCpuMsLast24h: number
}

export interface PostgresStats {
  poolUsed: number
  poolMax: number
  longQueriesP95Ms: number
  deadTuplesPercent: number
}

export interface AiSpendStats {
  totalUsd24h: number
  byProvider: Record<string, number>
  topModels: Array<{ provider: string; model: string; usd: number }>
}

export const superHealthRouter = router({
  overview: superAdminProcedure.query(async ({ ctx }) => {
    assertCan(ctx.user?.role, 'health.read')

    const [sentry, posthog, cloudflare, postgres, ai] = await Promise.all([
      fetchSentry(),
      fetchPostHog(),
      fetchCloudflare(),
      fetchPostgres(ctx.prisma),
      fetchAiSpend(ctx.prisma),
    ])

    const status: 'all_systems_ok' | 'degraded' | 'outage' = pickOverallStatus([
      sentry.status,
      posthog.status,
      cloudflare.status,
      postgres.status,
      ai.status,
    ])

    return {
      generatedAt: Date.now(),
      status,
      sentry,
      posthog,
      cloudflare,
      postgres,
      aiSpend: ai,
    }
  }),

  source: superAdminProcedure.input(healthSourceInput).query(async ({ ctx, input }) => {
    assertCan(ctx.user?.role, 'health.read')
    switch (input.source) {
      case 'sentry':
        return fetchSentry()
      case 'posthog':
        return fetchPostHog()
      case 'cloudflare':
        return fetchCloudflare()
      case 'postgres':
        return fetchPostgres(ctx.prisma)
      case 'ai_spend':
        return fetchAiSpend(ctx.prisma, input.windowHours)
    }
  }),
})

export type SuperHealthRouter = typeof superHealthRouter

// ─────────────────────────────────────────────────────────────────────────
// Source fetchers — kept private to this module. Real HTTP calls land
// alongside the dedicated `services/api/src/observability` module; the
// stubs below return shapes that the UI can already render against.
// ─────────────────────────────────────────────────────────────────────────

async function fetchSentry(): Promise<SafeResult<SentryStats>> {
  return safe('SENTRY_AUTH_TOKEN', async () => ({
    newIssues24h: 0,
    unresolvedIssues: 0,
    eventRatePerMin: 0,
  }))
}

async function fetchPostHog(): Promise<SafeResult<PostHogStats>> {
  return safe('POSTHOG_API_KEY', async () => ({
    dau: 0,
    wau: 0,
    topEvents: [],
  }))
}

async function fetchCloudflare(): Promise<SafeResult<CloudflareStats>> {
  return safe('CLOUDFLARE_API_TOKEN', async () => ({
    r2Storage: { totalBytes: 0, objectCount: 0 },
    workersCpuMsLast24h: 0,
  }))
}

async function fetchPostgres(prisma: {
  $queryRawUnsafe: (sql: string) => Promise<unknown[]>
}): Promise<SafeResult<PostgresStats>> {
  // `pg_stat_activity` is always available — no env gate needed, but if
  // Prisma is the only client we'll just report a single connection.
  try {
    const rows = (await prisma.$queryRawUnsafe(
      'SELECT state, count(*)::int FROM pg_stat_activity WHERE datname = current_database() GROUP BY state',
    )) as Array<{ state: string; count: number }>
    const inUse = rows.filter((r) => r.state === 'active').reduce((s, r) => s + r.count, 0)
    const idle = rows.filter((r) => r.state === 'idle').reduce((s, r) => s + r.count, 0)
    return {
      status: 'ok',
      fetchedAt: Date.now(),
      value: {
        poolUsed: inUse,
        poolMax: inUse + idle,
        longQueriesP95Ms: 0,
        deadTuplesPercent: 0,
      },
    }
  } catch (err) {
    return {
      status: 'error',
      fetchedAt: Date.now(),
      error: err instanceof Error ? err.message : String(err),
    }
  }
}

async function fetchAiSpend(
  // Loosened from the strict structural type to just `auditLog: { findMany }`
  // so Prisma's generated client (with its big union for the `where` arg)
  // assigns cleanly. We only need `findMany` returning rows with `after`.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Prisma generated types are too wide for a structural narrow.
  prisma: { auditLog: { findMany: (args: any) => Promise<Array<{ after: unknown }>> } },
  windowHours: number = 24,
): Promise<SafeResult<AiSpendStats>> {
  try {
    const since = new Date(Date.now() - windowHours * 60 * 60 * 1000)
    const rows = await prisma.auditLog.findMany({
      where: { action: 'ai.spend.recorded', createdAt: { gte: since } },
    } as unknown as { where: unknown })

    const byProvider: Record<string, number> = {}
    const byModel = new Map<string, { provider: string; model: string; usd: number }>()
    let total = 0
    for (const row of rows) {
      const after = (row.after ?? {}) as { provider?: string; model?: string; usd?: number }
      const provider = after.provider ?? 'unknown'
      const model = after.model ?? 'unknown'
      const usd = typeof after.usd === 'number' ? after.usd : 0
      total += usd
      byProvider[provider] = (byProvider[provider] ?? 0) + usd
      const k = `${provider}/${model}`
      const cur = byModel.get(k) ?? { provider, model, usd: 0 }
      cur.usd += usd
      byModel.set(k, cur)
    }
    const topModels = [...byModel.values()].sort((a, b) => b.usd - a.usd).slice(0, 5)
    return {
      status: 'ok',
      fetchedAt: Date.now(),
      value: { totalUsd24h: Math.round(total * 100) / 100, byProvider, topModels },
    }
  } catch (err) {
    return {
      status: 'error',
      fetchedAt: Date.now(),
      error: err instanceof Error ? err.message : String(err),
    }
  }
}

function pickOverallStatus(
  parts: Array<'ok' | 'unavailable' | 'unconfigured' | 'error'>,
): 'all_systems_ok' | 'degraded' | 'outage' {
  if (parts.every((p) => p === 'ok' || p === 'unconfigured')) return 'all_systems_ok'
  if (parts.some((p) => p === 'error' || p === 'unavailable')) {
    const errCount = parts.filter((p) => p === 'error' || p === 'unavailable').length
    return errCount >= 3 ? 'outage' : 'degraded'
  }
  return 'all_systems_ok'
}
