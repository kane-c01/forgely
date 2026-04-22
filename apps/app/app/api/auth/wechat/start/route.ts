/**
 * POST /api/auth/wechat/start — 启动微信扫码登录，返回 state + 授权 URL。
 *
 * 真环境：返回开放平台 qrconnect URL，前端用 iframe 或新窗口加载。
 * dev mock：返回占位 URL + mock:true，前端显示本地生成的二维码，
 *            立即把 state 标记为 success（100ms 延迟后），2s 后前端轮询到。
 *
 * @owner W6 — CN auth
 */
import { randomBytes } from 'node:crypto'

import { NextResponse } from 'next/server'

import {
  buildAuthorizeUrl,
  isWechatConfigured,
  loginWithMock,
  markWechatLoginSuccess,
  registerWechatLogin,
} from '@forgely/api/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** dev mock 的自动登录延迟 —— 让前端有机会先渲染 "扫码中" 状态。 */
const DEV_MOCK_AUTO_SUCCESS_MS = 2000

export async function POST(): Promise<Response> {
  const state = randomBytes(16).toString('hex')
  const { url, mock } = buildAuthorizeUrl({ state })

  await registerWechatLogin(state, { mock })

  if (mock) {
    setTimeout(() => {
      void (async () => {
        try {
          const login = await loginWithMock(state)
          await markWechatLoginSuccess(state, {
            userId: login.userId,
            isNewUser: login.isNewUser,
          })
        } catch (err) {
          console.warn('[wechat/start] mock 自动登录失败：', (err as Error).message)
        }
      })()
    }, DEV_MOCK_AUTO_SUCCESS_MS)
  }

  return NextResponse.json({
    ok: true,
    state,
    url,
    mock,
    configured: isWechatConfigured(),
    pollEverySeconds: 2,
    expiresIn: 300,
  })
}
