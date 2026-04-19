/**
 * Tests for `consumeRateLimit` against an in-memory `RateLimitWindow`
 * stub — no Postgres required.
 */
import { describe, expect, it } from 'vitest'

import { consumeRateLimit } from '../../src/credits/rate-limit.js'
import type { ForgelyError } from '../../src/errors.js'

interface Row {
  bucketKey: string
  windowStart: Date
  count: number
}

const makeStub = () => {
  const rows = new Map<string, Row>()
  const stub = {
    rateLimitWindow: {
      upsert: async ({
        where,
        create,
        update,
      }: {
        where: { bucketKey_windowStart: { bucketKey: string; windowStart: Date } }
        create: Row
        update: { count?: { increment?: number } }
      }) => {
        const key = `${where.bucketKey_windowStart.bucketKey}|${where.bucketKey_windowStart.windowStart.toISOString()}`
        const existing = rows.get(key)
        if (!existing) {
          rows.set(key, { ...create })
          return rows.get(key)!
        }
        existing.count += update.count?.increment ?? 0
        return existing
      },
    },
  }
  return { stub, rows }
}

describe('credits/rate-limit.consumeRateLimit', () => {
  it('counts up to the cap and then throws RATE_LIMITED', async () => {
    const { stub } = makeStub()
    const args = { bucketKey: 'auth:signin:1.2.3.4', windowMs: 60_000, max: 3 }

    for (let i = 0; i < 3; i += 1) {
      const r = await consumeRateLimit(args, stub as never)
      expect(r.remaining).toBe(2 - i)
    }

    try {
      await consumeRateLimit(args, stub as never)
      throw new Error('should not reach')
    } catch (err) {
      expect((err as ForgelyError).code).toBe('RATE_LIMITED')
      expect((err as ForgelyError).statusCode).toBe(429)
    }
  })

  it('different windows do not bleed', async () => {
    const { stub } = makeStub()
    const args = { bucketKey: 'k', windowMs: 60_000, max: 1 }
    const a = await consumeRateLimit(args, stub as never, new Date(0))
    expect(a.count).toBe(1)
    // 90s later → new window, fresh allowance.
    const b = await consumeRateLimit(args, stub as never, new Date(90_000))
    expect(b.count).toBe(1)
  })
})
