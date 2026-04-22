/**
 * 手机 OTP 一键登录（统一 cookie 颁发）.
 *
 * POST /api/auth/phone/login  { phone, code }
 *   1. loginWithPhoneOtp(...) → 校验 OTP + 找/建 User + 返回 userId
 *   2. createSession(user)   → cookie token + JWT
 *   3. recordAuthAudit        → AuditLog.action='auth.signin.phone'
 *   4. Set-Cookie (forgely_session) + 返回 { user, redirectTo }
 *
 * @owner W3 — CN auth real
 */
import { NextResponse, type NextRequest } from 'next/server'

import { recordAuthAudit, createSession, loginWithPhoneOtp } from '@forgely/api/auth'
import { SESSION_COOKIE_NAME, setSessionCookie } from '@forgely/api/auth'
import { prisma } from '@forgely/api/db'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const SESSION_TTL_SECONDS = 30 * 24 * 60 * 60

interface Body {
  phone?: string
  code?: string
  redirectTo?: string
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: Body = {}
  try {
    body = (await request.json()) as Body
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }
  if (!body.phone || !body.code) {
    return NextResponse.json({ error: 'phone_and_code_required' }, { status: 400 })
  }

  try {
    const { userId, isNewUser, phoneE164 } = await loginWithPhoneOtp({
      phone: body.phone,
      code: body.code,
      purpose: 'login',
    })

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json({ error: 'user_not_found' }, { status: 500 })
    }

    const session = await createSession(user, {
      ipAddress: request.headers.get('x-forwarded-for') ?? undefined,
      userAgent: request.headers.get('user-agent') ?? undefined,
    })

    await recordAuthAudit({
      actorId: userId,
      action: isNewUser ? 'auth.signup.phone' : 'auth.signin.phone',
      after: { phoneE164 },
      ipAddress: request.headers.get('x-forwarded-for') ?? undefined,
      userAgent: request.headers.get('user-agent') ?? undefined,
    })

    const res = NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phoneE164,
        isNewUser,
      },
      redirectTo: body.redirectTo ?? '/dashboard',
      sessionCookie: SESSION_COOKIE_NAME,
      expiresAt: session.expiresAt,
    })
    setSessionCookie(res.headers, session.sessionToken, { maxAgeSeconds: SESSION_TTL_SECONDS })
    return res
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    const status =
      msg.toLowerCase().includes('otp') || msg.toLowerCase().includes('code') ? 400 : 500
    return NextResponse.json({ error: msg }, { status })
  }
}
