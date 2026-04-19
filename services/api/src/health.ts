/**
 * Lightweight health probe.
 *
 * Designed to be called from a Next.js Route Handler (apps/app `/api/health`)
 * and consumed by Better Stack uptime monitors. Returns shape:
 *
 *   { ok: boolean, db: 'up' | 'down', redis: 'up' | 'down' | 'skipped',
 *     uptimeSeconds: number, version: string, ts: number }
 *
 * Each subsystem is probed with a tight timeout so a stuck dependency can't
 * stall the probe past 1.5s wall-clock.
 */

import { prisma } from './db.js'

const VERSION = process.env.APP_VERSION ?? process.env.GIT_SHA ?? 'dev'
const STARTED_AT = Date.now()

type Status = 'up' | 'down' | 'skipped'

interface HealthReport {
  ok: boolean
  db: Status
  redis: Status
  uptimeSeconds: number
  version: string
  ts: number
}

async function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} probe timed out after ${ms}ms`)), ms)
  })
  try {
    return await Promise.race([p, timeout])
  } finally {
    if (timer) clearTimeout(timer)
  }
}

async function probeDb(): Promise<Status> {
  try {
    await withTimeout(prisma.$queryRaw`SELECT 1`, 800, 'db')
    return 'up'
  } catch {
    return 'down'
  }
}

async function probeRedis(): Promise<Status> {
  const redisUrl = process.env.REDIS_URL
  if (!redisUrl) return 'skipped'
  try {
    // ioredis is not a direct dep of @forgely/api; it's hoisted via @forgely/worker.
    // Use a string spec so TS doesn't require the package and bundle compilers
    // don't statically resolve it.
    const spec = 'ioredis'
    const mod = (await import(/* @vite-ignore */ /* webpackIgnore: true */ spec)) as {
      default: new (
        url: string,
        opts?: Record<string, unknown>,
      ) => {
        connect: () => Promise<void>
        ping: () => Promise<string>
        disconnect: () => void
      }
    }
    const Redis = mod.default
    const r = new Redis(redisUrl, { lazyConnect: true, maxRetriesPerRequest: 1 })
    try {
      await withTimeout(r.connect(), 600, 'redis-connect')
      const pong = await withTimeout(r.ping(), 400, 'redis-ping')
      return pong === 'PONG' ? 'up' : 'down'
    } finally {
      r.disconnect()
    }
  } catch {
    return 'down'
  }
}

export async function getHealthStatus(): Promise<HealthReport> {
  const [db, redis] = await Promise.all([probeDb(), probeRedis()])
  const ok = db !== 'down' && redis !== 'down'
  return {
    ok,
    db,
    redis,
    uptimeSeconds: Math.round((Date.now() - STARTED_AT) / 1000),
    version: VERSION,
    ts: Date.now(),
  }
}
