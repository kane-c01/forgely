/**
 * 微信扫码回调 — open.weixin.qq.com 授权后带 ?code=&state= 回跳到本路由：
 *   1. loginWithCode(code)  → upsert User + WechatAccount, return userId
 *   2. createSession(user)  → mint cookie token + JWT
 *   3. recordAuthAudit       → AuditLog.action='auth.signin.wechat'
 *   4. Set-Cookie (forgely_session) + redirect to ?next=/dashboard
 *
 * Works in dev mock mode too — `loginWithCode` accepts any `mock_<state>`
 * code and builds a deterministic union_id without hitting open.weixin.qq.com.
 *
 * @owner W3 — CN auth real
 */
import { NextResponse, type NextRequest } from 'next/server'

import { recordAuthAudit } from '@forgely/api/auth'
import { prisma } from '@forgely/api/db'
import { createSession } from '@forgely/api/auth'
import { SESSION_COOKIE_NAME, setSessionCookie } from '@forgely/api/auth'
import { loginWithCode } from '@forgely/api/auth'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const SESSION_TTL_SECONDS = 30 * 24 * 60 * 60 // 30 天

export async function GET(request: NextRequest): Promise<NextResponse> {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state') ?? ''
  const next = url.searchParams.get('next') ?? '/dashboard'

  if (!code) {
    return NextResponse.redirect(new URL(`/login?error=missing_code&state=${state}`, request.url))
  }

  try {
    const { userId, isNewUser } = await loginWithCode(code)
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.redirect(
        new URL(`/login?error=user_not_found&state=${state}`, request.url),
      )
    }

    const session = await createSession(user, {
      ipAddress: request.headers.get('x-forwarded-for') ?? undefined,
      userAgent: request.headers.get('user-agent') ?? undefined,
    })

    await recordAuthAudit({
      actorId: userId,
      action: isNewUser ? 'auth.signup.wechat' : 'auth.signin.wechat',
      ipAddress: request.headers.get('x-forwarded-for') ?? undefined,
      userAgent: request.headers.get('user-agent') ?? undefined,
    })

    const res = NextResponse.redirect(new URL(next, request.url))
    setSessionCookie(res.headers, session.sessionToken, { maxAgeSeconds: SESSION_TTL_SECONDS })
    res.headers.set('x-forgely-session-cookie', SESSION_COOKIE_NAME)
    return res
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[wechat-callback] failed', { msg })
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(msg).slice(0, 120)}`, request.url),
    )
  }
}
