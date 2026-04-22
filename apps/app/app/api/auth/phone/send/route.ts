/**
 * POST /api/auth/phone/send — 发送手机号登录验证码。
 *
 * Body: { phone: string, purpose?: 'login' | 'reset_password' }
 * Response: 200 { ok: true, expiresAt, resendAvailableAt, mock }
 *           400 { ok: false, code, message }
 *           429 { ok: false, code: 'RATE_LIMITED', retryAfter }
 *
 * @owner W6 — CN auth
 */
import { NextResponse } from 'next/server'

import { requestOtp, type OtpPurpose } from '@forgely/api/auth'
import { isForgelyError } from '@forgely/api'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface Body {
  phone?: unknown
  purpose?: unknown
}

export async function POST(req: Request): Promise<Response> {
  let body: Body
  try {
    body = (await req.json()) as Body
  } catch {
    return NextResponse.json({ ok: false, code: 'INVALID_BODY' }, { status: 400 })
  }

  const phone = typeof body.phone === 'string' ? body.phone.trim() : ''
  const purposeRaw = typeof body.purpose === 'string' ? body.purpose : 'login'
  if (!phone) {
    return NextResponse.json({ ok: false, code: 'PHONE_REQUIRED' }, { status: 400 })
  }
  if (!['login', 'bind', 'verify', 'reset_password'].includes(purposeRaw)) {
    return NextResponse.json({ ok: false, code: 'PURPOSE_INVALID' }, { status: 400 })
  }

  try {
    const result = await requestOtp({
      phone,
      purpose: purposeRaw as OtpPurpose,
      requestIp: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? undefined,
    })
    return NextResponse.json({
      ok: true,
      expiresAt: result.expiresAt.toISOString(),
      resendAvailableAt: result.resendAvailableAt.toISOString(),
      mock: result.mock,
    })
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
    console.error('[phone/send] 意外错误', err)
    return NextResponse.json(
      { ok: false, code: 'INTERNAL', message: '发送验证码失败' },
      { status: 500 },
    )
  }
}
