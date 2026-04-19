/**
 * Sentry init for the long-running BullMQ worker process.
 *
 * Imported for side-effect at the top of `src/index.ts`. No-op when
 * `SENTRY_DSN` is unset, so dev / CI never explodes on missing config.
 */

import type * as SentryNs from '@sentry/node'

type SentryNode = typeof SentryNs

let sentry: SentryNode | null = null

const dsn = process.env.SENTRY_DSN

if (dsn) {
  try {
    // Lazy require so dev installs without the package still type-check.
    // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
    sentry = require('@sentry/node') as SentryNode
    sentry.init({
      dsn,
      environment: process.env.SENTRY_ENV ?? process.env.NODE_ENV,
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      sendDefaultPii: false,
    })
    console.info('[worker] Sentry initialised')
  } catch (err) {
    console.warn('[worker] @sentry/node not installed; Sentry disabled.', err)
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
