/**
 * GET /api/auth/wechat/claim?state=...
 *
 * 前端每 2s 轮询一次：
 *   - 未成功：返回 { status: 'waiting' | 'expired' | 'error' }
 *   - 成功：签发 session cookie + 清理 queue → 返回 { status: 'success', redirectTo }
 *
 * @owner W6 — CN auth
 */
import { NextResponse } from 'next/server'

import { prisma } from '@forgely/api'
import { completeLogin, consumeWechatLogin, pollWechatLogin } from '@forgely/api/auth'

import { setSessionCookie } from '@/lib/session-cookie'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: Request): Promise<Response> {
  const url = new URL(req.url)
  const state = url.searchParams.get('state')
  if (!state) {
    return NextResponse.json({ status: 'error', message: '缺少 state' }, { status: 400 })
  }

  const record = await pollWechatLogin(state)
  if (!record) {
    return NextResponse.json({ status: 'expired' })
  }

  if (record.status !== 'success' || !record.userId) {
    return NextResponse.json({
      status: record.status,
      mock: record.mock ?? false,
      error: record.error,
    })
  }

  const user = await prisma.user.findUnique({ where: { id: record.userId } })
  if (!user) {
    await consumeWechatLogin(state)
    return NextResponse.json({ status: 'error', message: '用户不存在' }, { status: 500 })
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null
  const ua = req.headers.get('user-agent') ?? null
  const result = await completeLogin({
    user,
    provider: 'wechat',
    isNewUser: record.isNewUser ?? false,
    ipAddress: ip,
    userAgent: ua,
    metadata: { mock: record.mock ?? false },
  })

  await consumeWechatLogin(state)

  const res = NextResponse.json({
    status: 'success',
    userId: user.id,
    isNewUser: record.isNewUser ?? false,
    needsOnboarding: result.needsOnboarding,
    redirectTo: result.redirectTo,
    mock: record.mock ?? false,
  })
  setSessionCookie(res, {
    sessionToken: result.session.sessionToken,
    expiresAt: result.session.expiresAt,
  })
  return res
}
