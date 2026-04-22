/**
 * POST /api/auth/phone/login — 手机号 + OTP 登录。
 *
 * Body: { phone: string, code: string }
 * Success: 200 { ok: true, userId, isNewUser, needsOnboarding, redirectTo }
 *         + Set-Cookie: forgely_session=...
 * Failure: 400/401 { ok: false, code, message }
 *
 * @owner W6 — CN auth
 */
import { NextResponse } from 'next/server'

import { prisma, isForgelyError } from '@forgely/api'
import { loginWithPhoneOtp, completeLogin } from '@forgely/api/auth'

import { setSessionCookie } from '@/lib/session-cookie'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface Body {
  phone?: unknown
  code?: unknown
}

export async function POST(req: Request): Promise<Response> {
  let body: Body
  try {
    body = (await req.json()) as Body
  } catch {
    return NextResponse.json({ ok: false, code: 'INVALID_BODY' }, { status: 400 })
  }

  const phone = typeof body.phone === 'string' ? body.phone.trim() : ''
  const code = typeof body.code === 'string' ? body.code.trim() : ''
  if (!phone || !/^\d{6}$/.test(code)) {
    return NextResponse.json(
      { ok: false, code: 'INVALID_INPUT', message: '请输入手机号和 6 位验证码' },
      { status: 400 },
    )
  }

  try {
    const login = await loginWithPhoneOtp({ phone, code, purpose: 'login' })
    const user = await prisma.user.findUnique({ where: { id: login.userId } })
    if (!user) {
      return NextResponse.json({ ok: false, code: 'USER_NOT_FOUND' }, { status: 500 })
    }
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null
    const ua = req.headers.get('user-agent') ?? null
    const result = await completeLogin({
      user,
      provider: 'phone',
      isNewUser: login.isNewUser,
      ipAddress: ip,
      userAgent: ua,
      metadata: { phoneE164: login.phoneE164 },
    })

    const res = NextResponse.json({
      ok: true,
      userId: user.id,
      isNewUser: login.isNewUser,
      needsOnboarding: result.needsOnboarding,
      redirectTo: result.redirectTo,
    })
    setSessionCookie(res, {
      sessionToken: result.session.sessionToken,
      expiresAt: result.session.expiresAt,
    })
    return res
  } catch (err) {
    if (isForgelyError(err)) {
      return NextResponse.json(
        {
          ok: false,
          code: err.code,
          message: err.userMessage,
          details: err.context,
        },
        { status: err.statusCode ?? 400 },
      )
    }
    console.error('[phone/login] 意外错误', err)
    return NextResponse.json(
      { ok: false, code: 'INTERNAL', message: '登录失败，请稍后重试' },
      { status: 500 },
    )
  }
}
