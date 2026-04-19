/**
 * Sentry init for `@forgely/api` server-side surface.
 *
 * Apps that host this router (apps/app) usually init Sentry via Next.js
 * `sentry.server.config.ts`. This module is for **standalone** consumers
 * (cron / jobs / scripts) that import `@forgely/api` from a long-running
 * process. It's safe to call init twice — Sentry just rebinds the hub.
 *
 * No-op when SENTRY_DSN is unset.
 */

import type * as SentryNs from '@sentry/node'

type SentryNode = typeof SentryNs

let sentry: SentryNode | null = null

const dsn = process.env.SENTRY_DSN

if (dsn) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
    sentry = require('@sentry/node') as SentryNode
    sentry.init({
      dsn,
      environment: process.env.SENTRY_ENV ?? process.env.NODE_ENV,
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      sendDefaultPii: false,
    })
  } catch {
    // Optional dep — silently fall back to no-op.
  }
}

export function captureException(err: unknown, context?: Record<string, unknown>): void {
  if (!sentry) return
  sentry.captureException(err, context ? { extra: context } : undefined)
}

export function flushSentry(timeoutMs = 2000): Promise<boolean> {
  if (!sentry) return Promise.resolve(true)
  return sentry.flush(timeoutMs)
}
