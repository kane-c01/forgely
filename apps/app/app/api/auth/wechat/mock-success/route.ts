/**
 * Dev-only: simulates "用户扫码成功" without ever hitting open.weixin.qq.com.
 *
 * Wired from `buildAuthorizeUrl` when `isWechatDevMock()` is true — the QR
 * image points to this URL, and after a short UX delay the frontend loads
 * it (or the user visits it directly). It synthesises a `mock_<state>` code
 * and hands off to the real `/api/auth/wechat/callback` for a single code
 * path (so the dev + prod flows are byte-for-byte identical past this point).
 *
 * @owner W3 — CN auth real
 */
import { NextResponse, type NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest): Promise<NextResponse> {
  if (process.env.WECHAT_APP_ID && process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'mock-success is disabled in production with real WeChat credentials' },
      { status: 403 },
    )
  }
  const url = new URL(request.url)
  const state = url.searchParams.get('state') ?? 'mock'
  const next = url.searchParams.get('next') ?? '/dashboard'
  const callback = new URL('/api/auth/wechat/callback', request.url)
  callback.searchParams.set('code', `mock_${state}`)
  callback.searchParams.set('state', state)
  callback.searchParams.set('next', next)
  return NextResponse.redirect(callback)
}
