/**
 * GET /api/auth/wechat/callback?code=...&state=... —— 微信开放平台回跳端点。
 *
 * 用户在微信 App 里点"确认授权"后，微信服务器会 302 到这里：
 *   https://app.forgely.cn/api/auth/wechat/callback?code=xxx&state=xxx
 *
 * 我们做：
 *   1. exchangeCodeForToken(code) → openid + unionid + access_token
 *   2. upsert User + WechatAccount
 *   3. 把 (state, userId) 写进 Redis/memory login queue
 *   4. redirect `/login?wechat=ok`（用户看到 "扫码完成，请在原窗口继续"）
 *
 * 前端原窗口会持续轮询 /api/auth/wechat/claim 拿到成功状态，然后拿到 cookie。
 *
 * @owner W6 — CN auth
 */
import { NextResponse } from 'next/server'

import { loginWithCode, markWechatLoginError, markWechatLoginSuccess } from '@forgely/api/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: Request): Promise<Response> {
  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? new URL(req.url).origin

  if (!state) {
    return NextResponse.redirect(`${appUrl}/login?wechat=missing_state`, { status: 302 })
  }
  if (!code) {
    await markWechatLoginError(state, '用户取消授权')
    return NextResponse.redirect(`${appUrl}/login?wechat=cancelled`, { status: 302 })
  }

  try {
    const login = await loginWithCode(code, 'snsapi_login')
    await markWechatLoginSuccess(state, {
      userId: login.userId,
      isNewUser: login.isNewUser,
    })
    return NextResponse.redirect(`${appUrl}/login?wechat=ok`, { status: 302 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[wechat/callback] loginWithCode 失败：', msg)
    await markWechatLoginError(state, msg)
    return NextResponse.redirect(`${appUrl}/login?wechat=error&reason=${encodeURIComponent(msg)}`, {
      status: 302,
    })
  }
}
