import type { SourcePlatform } from './types.js'

/**
 * Base error for everything the scraper layer throws.
 *
 * Always carries a stable `code` for routing in upstream UIs and a
 * `retryable` hint for the queue worker.
 */
export class ScraperError extends Error {
  readonly code: string
  readonly retryable: boolean
  readonly source?: SourcePlatform
  override readonly cause?: unknown
  readonly meta?: Record<string, unknown>

  constructor(
    message: string,
    options: {
      code: string
      retryable?: boolean
      source?: SourcePlatform
      cause?: unknown
      meta?: Record<string, unknown>
    },
  ) {
    super(message)
    this.name = 'ScraperError'
    this.code = options.code
    this.retryable = options.retryable ?? false
    this.source = options.source
    this.cause = options.cause
    this.meta = options.meta
  }
}

export class UnauthorizedError extends ScraperError {
  constructor(message = 'Source requires authentication', meta?: Record<string, unknown>) {
    super(message, { code: 'UNAUTHORIZED', retryable: false, meta })
    this.name = 'UnauthorizedError'
  }
}

export class NotFoundError extends ScraperError {
  constructor(message = 'Source URL not found', meta?: Record<string, unknown>) {
    super(message, { code: 'NOT_FOUND', retryable: false, meta })
    this.name = 'NotFoundError'
  }
}

export class TimeoutError extends ScraperError {
  constructor(message = 'Scrape timed out', meta?: Record<string, unknown>) {
    super(message, { code: 'TIMEOUT', retryable: true, meta })
    this.name = 'TimeoutError'
  }
}

export class RateLimitedError extends ScraperError {
  readonly retryAfterMs: number
  constructor(retryAfterMs: number, message = 'Rate limited by upstream') {
    super(message, { code: 'RATE_LIMITED', retryable: true, meta: { retryAfterMs } })
    this.name = 'RateLimitedError'
    this.retryAfterMs = retryAfterMs
  }
}

export class BlockedError extends ScraperError {
  constructor(message = 'Source blocked the request (captcha / WAF)') {
    super(message, { code: 'BLOCKED', retryable: true })
    this.name = 'BlockedError'
  }
}

export class UnsupportedPlatformError extends ScraperError {
  constructor(url: string) {
    super(`No adapter supports this URL: ${url}`, {
      code: 'UNSUPPORTED_PLATFORM',
      retryable: false,
      meta: { url },
    })
    this.name = 'UnsupportedPlatformError'
  }
}

export class NetworkError extends ScraperError {
  constructor(message: string, cause?: unknown) {
    super(message, { code: 'NETWORK', retryable: true, cause })
    this.name = 'NetworkError'
  }
}

export class DataValidationError extends ScraperError {
  constructor(message: string, meta?: Record<string, unknown>) {
    super(message, { code: 'DATA_VALIDATION', retryable: false, meta })
    this.name = 'DataValidationError'
  }
}

export function isRetryable(err: unknown): boolean {
  return err instanceof ScraperError && err.retryable
}
