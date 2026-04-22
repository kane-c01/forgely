/**
 * POST /api/auth/signout — 清 session，撤销 DB 侧 session row。
 *
 * @owner W6 — CN auth
 */
import { NextResponse } from 'next/server'

import { revokeSession, SESSION_COOKIE_NAME } from '@forgely/api/auth'

import { clearSessionCookie } from '@/lib/session-cookie'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: Request): Promise<Response> {
  const cookie = req.headers.get('cookie') ?? ''
  const match = cookie.match(new RegExp(`${SESSION_COOKIE_NAME}=([^;]+)`))
  const sessionToken = match ? decodeURIComponent(match[1] ?? '') : ''
  if (sessionToken) {
    await revokeSession(sessionToken).catch(() => undefined)
  }
  const res = NextResponse.json({ ok: true })
  clearSessionCookie(res)
  return res
}
