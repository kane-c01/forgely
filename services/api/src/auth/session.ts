/**
 * Unified session cookie helpers — a thin layer above `sessions.ts` that
 * encapsulates the cookie shape all three login paths (email/password,
 * WeChat, phone-OTP) rely on.
 *
 * All three should:
 *   1. call `createSession(user, device)` from `sessions.ts` to mint a server row + JWT,
 *   2. emit the cookie via `buildSessionCookie(sessionToken, expiresAt)`.
 *
 * Cookie defaults: `HttpOnly; SameSite=Lax; Path=/; Secure` (in production).
 *
 * Kept framework-agnostic — the Next.js routes import the raw string via
 * `res.headers.append('Set-Cookie', buildSessionCookie(...))` so the api
 * package stays free of any `next/server` dependency.
 *
 * @owner W3 — CN auth real
 */

/** Canonical cookie name for the opaque session token. */
export const SESSION_COOKIE_NAME = 'forgely_session'

export interface SessionCookieOptions {
  /** Cookie path (default `/`). */
  path?: string
  /** Domain (default unset → host-only). */
  domain?: string
  /**
   * Seconds until expiry. When omitted we emit a session cookie (no Max-Age)
   * so the browser drops it on window close — use this for ephemeral
   * dev scenarios only; production always passes a positive TTL.
   */
  maxAgeSeconds?: number
  /** Override `Secure` flag. Defaults to production env detection. */
  secure?: boolean
  /** `SameSite` policy. Defaults to `Lax`. */
  sameSite?: 'Strict' | 'Lax' | 'None'
}

const isProd = (): boolean => process.env.NODE_ENV === 'production'

/**
 * Build a canonical `Set-Cookie` header value for the session token.
 * Identical shape across email/password, WeChat, and phone-OTP paths.
 */
export const buildSessionCookie = (
  sessionToken: string,
  opts: SessionCookieOptions = {},
): string => {
  const parts: string[] = [`${SESSION_COOKIE_NAME}=${sessionToken}`]
  parts.push(`Path=${opts.path ?? '/'}`)
  parts.push('HttpOnly')
  parts.push(`SameSite=${opts.sameSite ?? 'Lax'}`)
  if (opts.secure ?? isProd()) parts.push('Secure')
  if (opts.domain) parts.push(`Domain=${opts.domain}`)
  if (typeof opts.maxAgeSeconds === 'number' && opts.maxAgeSeconds > 0) {
    parts.push(`Max-Age=${Math.floor(opts.maxAgeSeconds)}`)
  }
  return parts.join('; ')
}

/** Cookie-clearing counterpart for sign-out. */
export const buildClearSessionCookie = (opts: SessionCookieOptions = {}): string => {
  const parts: string[] = [
    `${SESSION_COOKIE_NAME}=`,
    `Path=${opts.path ?? '/'}`,
    'HttpOnly',
    `SameSite=${opts.sameSite ?? 'Lax'}`,
    'Max-Age=0',
    'Expires=Thu, 01 Jan 1970 00:00:00 GMT',
  ]
  if (opts.secure ?? isProd()) parts.push('Secure')
  if (opts.domain) parts.push(`Domain=${opts.domain}`)
  return parts.join('; ')
}

/**
 * Parse the opaque session token from a raw `Cookie` header (server-side).
 * Returns `null` if absent / malformed.
 */
export const parseSessionCookie = (cookieHeader: string | null | undefined): string | null => {
  if (!cookieHeader) return null
  for (const chunk of cookieHeader.split(';')) {
    const [rawName, ...rest] = chunk.trim().split('=')
    if (rawName === SESSION_COOKIE_NAME) {
      return decodeURIComponent(rest.join('=') ?? '') || null
    }
  }
  return null
}

/** Shape expected by Next.js Response headers (avoids importing next/server). */
export interface HeadersLike {
  append(name: string, value: string): void
}

/** Convenience: append the session cookie to any headers-like object. */
export const setSessionCookie = (
  headers: HeadersLike,
  sessionToken: string,
  opts: SessionCookieOptions = {},
): void => {
  headers.append('Set-Cookie', buildSessionCookie(sessionToken, opts))
}

export const clearSessionCookie = (headers: HeadersLike, opts: SessionCookieOptions = {}): void => {
  headers.append('Set-Cookie', buildClearSessionCookie(opts))
}
