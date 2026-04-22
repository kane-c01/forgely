/**
 * HttpOnly session cookie helpers shared by all `/api/auth/**` Route Handlers.
 *
 * @owner W6 — CN auth
 */
import { type NextResponse } from 'next/server'
import { SESSION_COOKIE_NAME } from '@forgely/api/auth'

const DEV = process.env.NODE_ENV !== 'production'

export interface SessionCookiePayload {
  sessionToken: string
  expiresAt: Date
}

/** 写 HttpOnly / SameSite=Lax / 30 天 session cookie 到 response。 */
export function setSessionCookie(res: NextResponse, payload: SessionCookiePayload): void {
  res.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: payload.sessionToken,
    httpOnly: true,
    sameSite: 'lax',
    secure: !DEV,
    path: '/',
    expires: payload.expiresAt,
  })
}

/** 清除 cookie（signout）。 */
export function clearSessionCookie(res: NextResponse): void {
  res.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: '',
    httpOnly: true,
    sameSite: 'lax',
    secure: !DEV,
    path: '/',
    expires: new Date(0),
  })
}
