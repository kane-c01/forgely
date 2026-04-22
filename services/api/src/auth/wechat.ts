/**
 * 微信开放平台 OAuth — 网站扫码登录 + 公众号 / 小程序 / App 通用。
 *
 * 实现按 docs/PIVOT-CN.md §2，对接：
 *   - 网站应用（open.weixin.qq.com）：Authorization Code 流程
 *   - 公众号 / 小程序：snsapi_login / snsapi_userinfo
 *
 * 不依赖 next-auth，在 services/api 层直接实现，配合
 * `services/api/src/auth/sessions.ts` 的 createSession() 完成会话签发。
 *
 * ENV 变量（写到 .env，不入库）：
 *   WECHAT_OPEN_APP_ID         生产模式：开放平台 AppID
 *   WECHAT_OPEN_APP_SECRET     生产模式：开放平台 Secret
 *   WECHAT_REDIRECT_URI        e.g. https://app.forgely.cn/api/auth/wechat/callback
 *
 * 没配任何一个 → 自动降级成 **dev mock mode**：
 *   buildAuthorizeUrl() 返回内部 mock URL，loginWithCode() 返回稳定 mock 用户。
 *
 * @owner W6 — docs/SPRINT-3-DISPATCH.md
 */
import { prisma } from '../db.js'
import { ForgelyError } from '../errors.js'

const QR_AUTH_URL = 'https://open.weixin.qq.com/connect/qrconnect'
const ACCESS_TOKEN_URL = 'https://api.weixin.qq.com/sns/oauth2/access_token'
const USERINFO_URL = 'https://api.weixin.qq.com/sns/userinfo'
const REFRESH_URL = 'https://api.weixin.qq.com/sns/oauth2/refresh_token'

export type WechatScope = 'snsapi_login' | 'snsapi_userinfo' | 'snsapi_base'

interface WechatEnv {
  appId: string
  appSecret: string
  redirectUri: string
}

function getEnv(): WechatEnv | null {
  const appId = process.env.WECHAT_OPEN_APP_ID ?? process.env.WECHAT_APP_ID
  const appSecret = process.env.WECHAT_OPEN_APP_SECRET ?? process.env.WECHAT_APP_SECRET
  const redirectUri =
    process.env.WECHAT_REDIRECT_URI ??
    (process.env.NEXT_PUBLIC_APP_URL
      ? `${process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '')}/api/auth/wechat/callback`
      : undefined)
  if (!appId || !appSecret || !redirectUri) return null
  return { appId, appSecret, redirectUri }
}

/** 生产环境是否已配齐微信开放平台凭证 —— 未配 → mock mode。 */
export function isWechatConfigured(): boolean {
  return getEnv() !== null
}

/**
 * 生成扫码登录授权 URL。
 *
 * 未配微信 env → 返回内部 mock URL（前端会直接轮询 claim 拿 mock user）。
 */
export function buildAuthorizeUrl(opts: {
  state: string
  scope?: WechatScope
  /** 可选，自定义 redirect_uri（例如不同租户 callback）。 */
  redirectUri?: string
}): { url: string; mock: boolean } {
  const env = getEnv()
  if (!env) {
    return {
      url: `internal://wechat-mock?state=${encodeURIComponent(opts.state)}`,
      mock: true,
    }
  }
  const params = new URLSearchParams({
    appid: env.appId,
    redirect_uri: opts.redirectUri ?? env.redirectUri,
    response_type: 'code',
    scope: opts.scope ?? 'snsapi_login',
    state: opts.state,
  })
  return {
    url: `${QR_AUTH_URL}?${params.toString()}#wechat_redirect`,
    mock: false,
  }
}

export interface AccessTokenResponse {
  access_token: string
  expires_in: number
  refresh_token: string
  openid: string
  scope: string
  unionid?: string
  errcode?: number
  errmsg?: string
}

export interface UserInfoResponse {
  openid: string
  nickname: string
  sex: number
  province: string
  city: string
  country: string
  headimgurl: string
  privilege: string[]
  unionid?: string
  errcode?: number
  errmsg?: string
}

/** 用 code 换取 access_token + openid + unionid。 */
export async function exchangeCodeForToken(code: string): Promise<AccessTokenResponse> {
  const env = getEnv()
  if (!env) {
    throw new ForgelyError('WECHAT_NOT_CONFIGURED', '微信开放平台凭证未配置', 500)
  }
  const url = `${ACCESS_TOKEN_URL}?appid=${env.appId}&secret=${env.appSecret}&code=${encodeURIComponent(
    code,
  )}&grant_type=authorization_code`
  const json = (await fetch(url).then((r) => r.json())) as AccessTokenResponse
  if (json.errcode) {
    throw new ForgelyError(
      'WECHAT_TOKEN_EXCHANGE_FAILED',
      `微信换 token 失败：${json.errmsg ?? json.errcode}`,
      400,
      { errcode: json.errcode },
    )
  }
  return json
}

/** 拉取用户基本信息（需要 snsapi_userinfo 授权）。 */
export async function fetchUserInfo(
  accessToken: string,
  openid: string,
): Promise<UserInfoResponse> {
  const url = `${USERINFO_URL}?access_token=${accessToken}&openid=${openid}&lang=zh_CN`
  const json = (await fetch(url).then((r) => r.json())) as UserInfoResponse
  if (json.errcode) {
    throw new ForgelyError(
      'WECHAT_USERINFO_FAILED',
      `微信拉取用户信息失败：${json.errmsg ?? json.errcode}`,
      400,
      { errcode: json.errcode },
    )
  }
  return json
}

/** 刷新过期的 access_token。 */
export async function refreshAccessToken(refreshToken: string): Promise<AccessTokenResponse> {
  const env = getEnv()
  if (!env) {
    throw new ForgelyError('WECHAT_NOT_CONFIGURED', '微信开放平台凭证未配置', 500)
  }
  const url = `${REFRESH_URL}?appid=${env.appId}&grant_type=refresh_token&refresh_token=${encodeURIComponent(
    refreshToken,
  )}`
  const json = (await fetch(url).then((r) => r.json())) as AccessTokenResponse
  if (json.errcode) {
    throw new ForgelyError(
      'WECHAT_REFRESH_FAILED',
      `微信刷新 token 失败：${json.errmsg ?? json.errcode}`,
      400,
      { errcode: json.errcode },
    )
  }
  return json
}

export interface WechatLoginResult {
  /** 通过 unionId 找到的现有用户，或新建的用户。 */
  userId: string
  /** 是否是新注册用户（首次微信登录）。 */
  isNewUser: boolean
  wechatAccountId: string
}

/**
 * 完整的微信登录流程：code → token → userinfo → upsert User + WechatAccount。
 *
 * 调用方拿到 `userId` 后，调用 `createSession({ user, ... })` 签发 JWT / cookie。
 */
export async function loginWithCode(
  code: string,
  scope: WechatScope = 'snsapi_login',
): Promise<WechatLoginResult> {
  const token = await exchangeCodeForToken(code)
  const profile =
    scope === 'snsapi_base' ? null : await fetchUserInfo(token.access_token, token.openid)
  const unionId = token.unionid ?? profile?.unionid
  if (!unionId) {
    throw new ForgelyError(
      'WECHAT_UNIONID_MISSING',
      '该微信账号没有 UnionId — 请确认开放平台已绑定。',
      400,
    )
  }

  const existingAccount = await prisma.wechatAccount.findUnique({
    where: { unionId },
    select: { id: true, userId: true },
  })
  if (existingAccount) {
    await prisma.wechatAccount.update({
      where: { id: existingAccount.id },
      data: {
        accessToken: token.access_token,
        refreshToken: token.refresh_token,
        accessTokenExpires: new Date(Date.now() + token.expires_in * 1000),
        nickname: profile?.nickname,
        avatarUrl: profile?.headimgurl,
      },
    })
    return { userId: existingAccount.userId, isNewUser: false, wechatAccountId: existingAccount.id }
  }

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email: `wx_${unionId.slice(0, 12).toLowerCase()}@wechat.forgely.cn`,
        name: profile?.nickname ?? '微信用户',
        avatarUrl: profile?.headimgurl ?? null,
        region: 'cn',
        locale: 'zh-CN',
        wechatUnionId: unionId,
        emailVerifiedAt: null,
      },
      select: { id: true },
    })
    const account = await tx.wechatAccount.create({
      data: {
        userId: user.id,
        openId: token.openid,
        unionId,
        scope,
        nickname: profile?.nickname,
        avatarUrl: profile?.headimgurl,
        sex: profile?.sex,
        country: profile?.country,
        province: profile?.province,
        city: profile?.city,
        accessToken: token.access_token,
        refreshToken: token.refresh_token,
        accessTokenExpires: new Date(Date.now() + token.expires_in * 1000),
      },
      select: { id: true },
    })
    return { userId: user.id, wechatAccountId: account.id }
  })

  return { ...result, isNewUser: true }
}

/**
 * **dev mock**：没配微信开放平台时，用一个稳定的假 UnionId 模拟登录。
 *
 * 复用同一个 mock UnionId → 同一个 User，便于重复开发测试。
 */
export async function loginWithMock(state: string): Promise<WechatLoginResult> {
  if (isWechatConfigured()) {
    throw new ForgelyError('WECHAT_MOCK_DISALLOWED', '生产环境不允许使用 mock 登录', 500)
  }
  const unionId = `mock_unionid_${(state.slice(0, 8) || 'dev').toLowerCase()}`
  const openId = `mock_openid_${(state.slice(0, 12) || 'dev').toLowerCase()}`

  const existing = await prisma.wechatAccount.findUnique({
    where: { unionId },
    select: { id: true, userId: true },
  })
  if (existing) {
    return { userId: existing.userId, isNewUser: false, wechatAccountId: existing.id }
  }

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email: `mock_${unionId}@wechat.forgely.dev`,
        name: '微信测试用户',
        avatarUrl: null,
        region: 'cn',
        locale: 'zh-CN',
        wechatUnionId: unionId,
        emailVerifiedAt: null,
      },
      select: { id: true },
    })
    const account = await tx.wechatAccount.create({
      data: {
        userId: user.id,
        openId,
        unionId,
        scope: 'snsapi_login',
        nickname: '微信测试用户',
        country: 'CN',
        province: 'Shanghai',
        city: 'Shanghai',
      },
      select: { id: true },
    })
    return { userId: user.id, wechatAccountId: account.id }
  })
  return { ...result, isNewUser: true }
}
