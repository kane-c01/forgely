/**
 * POST /api/onboarding/complete — 保存公司信息 + 首次完成发 100 积分。
 *
 * Body: { companyName, businessCategory, targetMarkets: string[] }
 * 需要已登录（cookie）。
 *
 * @owner W6 — CN auth
 */
import { NextResponse } from 'next/server'

import { prisma, isForgelyError } from '@forgely/api'
import { completeOnboarding, SESSION_COOKIE_NAME, validateSession } from '@forgely/api/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface Body {
  companyName?: unknown
  businessCategory?: unknown
  targetMarkets?: unknown
}

const VALID_CATEGORIES = new Set([
  'apparel',
  'beauty',
  'electronics',
  'home',
  'food',
  'health',
  'sports',
  'other',
])

export async function POST(req: Request): Promise<Response> {
  const cookie = req.headers.get('cookie') ?? ''
  const match = cookie.match(new RegExp(`${SESSION_COOKIE_NAME}=([^;]+)`))
  const sessionToken = match ? decodeURIComponent(match[1] ?? '') : ''
  if (!sessionToken) {
    return NextResponse.json({ ok: false, code: 'UNAUTHORIZED' }, { status: 401 })
  }
  const result = await validateSession(sessionToken)
  if (!result) {
    return NextResponse.json({ ok: false, code: 'UNAUTHORIZED' }, { status: 401 })
  }

  let body: Body
  try {
    body = (await req.json()) as Body
  } catch {
    return NextResponse.json({ ok: false, code: 'INVALID_BODY' }, { status: 400 })
  }

  const companyName = typeof body.companyName === 'string' ? body.companyName.trim() : ''
  const businessCategory = typeof body.businessCategory === 'string' ? body.businessCategory : ''
  const targetMarkets = Array.isArray(body.targetMarkets)
    ? (body.targetMarkets.filter((m) => typeof m === 'string' && m.length > 0) as string[])
    : []

  if (companyName.length < 2 || companyName.length > 80) {
    return NextResponse.json(
      { ok: false, code: 'INVALID_COMPANY_NAME', message: '公司名 2–80 个字符' },
      { status: 400 },
    )
  }
  if (!VALID_CATEGORIES.has(businessCategory)) {
    return NextResponse.json(
      { ok: false, code: 'INVALID_CATEGORY', message: '经营类目无效' },
      { status: 400 },
    )
  }
  if (targetMarkets.length === 0) {
    return NextResponse.json(
      { ok: false, code: 'MARKETS_REQUIRED', message: '至少选择一个目标市场' },
      { status: 400 },
    )
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null
  const ua = req.headers.get('user-agent') ?? null

  try {
    const outcome = await completeOnboarding({
      userId: result.user.id,
      companyName,
      businessCategory,
      targetMarkets,
      ipAddress: ip,
      userAgent: ua,
    })
    // 验证：读回实际积分余额
    const wallet = await prisma.userCredits.findUnique({
      where: { userId: result.user.id },
      select: { balance: true },
    })
    return NextResponse.json({
      ok: true,
      onboardedAt: outcome.onboardedAt.toISOString(),
      creditsGranted: outcome.creditsGranted,
      creditsBalance: wallet?.balance ?? 0,
    })
  } catch (err) {
    if (isForgelyError(err)) {
      return NextResponse.json(
        { ok: false, code: err.code, message: err.userMessage },
        { status: err.statusCode ?? 400 },
      )
    }
    console.error('[onboarding/complete] 意外错误', err)
    return NextResponse.json({ ok: false, code: 'INTERNAL', message: '保存失败' }, { status: 500 })
  }
}
