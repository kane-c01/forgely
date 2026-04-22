/**
 * tRPC router — 中国市场登录入口（微信扫码 + 手机 OTP）。
 * 海外站继续走 W3 已有的 `router/auth.ts` (email + password + Google OAuth)。
 *
 * 注意：实际签发 session cookie 的工作发生在 Next.js Route Handler
 * (`apps/app/app/api/auth/**`) —— tRPC 层只负责返回 userId + 元数据。
 *
 * @owner W1 — CN pivot (docs/PIVOT-CN.md §2) + W6 扩展
 */
import { z } from 'zod'

import { router, publicProcedure } from './trpc.js'
import {
  buildAuthorizeUrl,
  isWechatConfigured,
  loginWithCode,
  refreshAccessToken,
} from '../auth/wechat.js'
import {
  bindPhoneToUser,
  loginWithPhoneOtp,
  normalisePhone,
  requestOtp,
  verifyOtp,
} from '../auth/sms-otp.js'

export const cnAuthRouter = router({
  /** 生成微信扫码授权 URL。 */
  wechatAuthorizeUrl: publicProcedure
    .input(
      z.object({
        state: z.string().min(8).max(128),
        scope: z.enum(['snsapi_login', 'snsapi_userinfo', 'snsapi_base']).optional(),
        redirectUri: z.string().url().optional(),
      }),
    )
    .query(({ input }) => {
      const { url, mock } = buildAuthorizeUrl(input)
      return { url, mock, configured: isWechatConfigured() }
    }),

  /** 微信回调 — code 换 token 换 user，返回 userId 给调用方签 session。 */
  wechatCallback: publicProcedure
    .input(
      z.object({
        code: z.string().min(8),
        scope: z.enum(['snsapi_login', 'snsapi_userinfo', 'snsapi_base']).optional(),
      }),
    )
    .mutation(({ input }) => loginWithCode(input.code, input.scope)),

  /** 刷新微信 access_token（一般不直接给前端，给后台脚本用）。 */
  wechatRefresh: publicProcedure
    .input(z.object({ refreshToken: z.string().min(8) }))
    .mutation(({ input }) => refreshAccessToken(input.refreshToken)),

  /** 发送一条短信 OTP。 */
  requestOtp: publicProcedure
    .input(
      z.object({
        phone: z.string().min(7).max(20),
        purpose: z.enum(['login', 'bind', 'verify', 'reset_password']),
      }),
    )
    .mutation(({ input, ctx }) =>
      requestOtp({
        phone: input.phone,
        purpose: input.purpose,
        userId: ctx.user?.id,
        requestIp: ctx.ipAddress ?? undefined,
      }),
    ),

  /** 校验 OTP 但不登录（绑定 / 验证场景）。 */
  verifyOtp: publicProcedure
    .input(
      z.object({
        phone: z.string(),
        code: z.string().length(6),
        purpose: z.enum(['login', 'bind', 'verify', 'reset_password']),
      }),
    )
    .mutation(({ input }) => verifyOtp(input)),

  /** 手机号 + OTP 一键登录。 */
  loginWithPhoneOtp: publicProcedure
    .input(z.object({ phone: z.string(), code: z.string().length(6) }))
    .mutation(({ input }) =>
      loginWithPhoneOtp({ phone: input.phone, code: input.code, purpose: 'login' }),
    ),

  /** 已登录用户绑定手机号。 */
  bindPhone: publicProcedure
    .input(z.object({ phone: z.string(), code: z.string().length(6) }))
    .mutation(({ input, ctx }) => {
      if (!ctx.user?.id) {
        throw new Error('UNAUTHORIZED')
      }
      return bindPhoneToUser({
        userId: ctx.user.id,
        phone: input.phone,
        code: input.code,
      })
    }),

  /** 工具：把任意输入手机号标准化成 E.164（前端做即时校验用）。 */
  normalisePhone: publicProcedure
    .input(z.object({ phone: z.string() }))
    .query(({ input }) => ({ phoneE164: normalisePhone(input.phone) })),
})

export type CnAuthRouter = typeof cnAuthRouter
