/**
 * POST /api/auth/email/login — 邮箱 + 密码登录。
 *
 * Body: { email, password }
 * 成功：200 + Set-Cookie forgely_session=...
 *
 * @owner W6 — CN auth
 */
import { NextResponse } from 'next/server'

import { prisma, isForgelyError } from '@forgely/api'
import { completeLogin, signinWithPassword } from '@forgely/api/auth'

import { setSessionCookie } from '@/lib/session-cookie'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface Body {
  email?: unknown
  password?: unknown
}

export async function POST(req: Request): Promise<Response> {
  let body: Body
  try {
    body = (await req.json()) as Body
  } catch {
    return NextResponse.json({ ok: false, code: 'INVALID_BODY' }, { status: 400 })
  }

  const email = typeof body.email === 'string' ? body.email.trim() : ''
  const password = typeof body.password === 'string' ? body.password : ''
  if (!email || !password) {
    return NextResponse.json(
      { ok: false, code: 'INVALID_INPUT', message: '请输入邮箱和密码' },
      { status: 400 },
    )
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? undefined
  const ua = req.headers.get('user-agent') ?? undefined

  try {
    const auth = await signinWithPassword({ email, password }, { ipAddress: ip, userAgent: ua })
    const user = await prisma.user.findUnique({ where: { id: auth.user.id } })
    if (!user) {
      return NextResponse.json({ ok: false, code: 'USER_NOT_FOUND' }, { status: 500 })
    }
    // signinWithPassword 已经 createSession，这里只走 completeLogin 的其它副作用
    // （audit + credits + onboarding redirect），session 复用已有的。
    const wasOnboarded = user.onboardedAt !== null
    const result = await completeLogin({
      user,
      provider: 'email',
      isNewUser: false,
      ipAddress: ip ?? null,
      userAgent: ua ?? null,
    })
    const res = NextResponse.json({
      ok: true,
      userId: user.id,
      needsOnboarding: !wasOnboarded,
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
        { ok: false, code: err.code, message: err.userMessage },
        { status: err.statusCode ?? 400 },
      )
    }
    console.error('[email/login] 意外错误', err)
    return NextResponse.json({ ok: false, code: 'INTERNAL', message: '登录失败' }, { status: 500 })
  }
}
