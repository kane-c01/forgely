/**
 * 微信开放平台 OAuth — 网站扫码登录 + 公众号 / 小程序 / App 通用。
 *
 * 实现按 docs/PIVOT-CN.md §2，对接：
 *   - 网站应用（open.weixin.qq.com）：Authorization Code 流程
 *   - 公众号 / 小程序：snsapi_login / snsapi_userinfo
 *
 * 不依赖 next-auth，在 services/api 层直接实现，配合
 * `services/api/src/auth/sessions.ts` 的 issueSession() 完成会话签发。
 *
 * ENV 变量（写到 .env，不入库）：
 *   WECHAT_APP_ID
 *   WECHAT_APP_SECRET
 *   WECHAT_REDIRECT_URI    e.g. https://app.forgely.cn/api/auth/wechat/callback
 *
 * @owner W1 — CN pivot (docs/PIVOT-CN.md)
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

/**
 * 真实模式需要的三个 ENV 任一缺失即走 dev mock：
 *   WECHAT_APP_ID / WECHAT_APP_SECRET / WECHAT_REDIRECT_URI
 *
 * Mock mode 下：
 *   - buildAuthorizeUrl 返回指向本地 `/api/auth/wechat/mock-success` 的 URL，
 *     前端显示占位 QR 图，5s 后自动轮询该 URL 完成"扫码成功"。
 *   - exchangeCodeForToken / fetchUserInfo / loginWithCode 接收任何以 `mock_`
 *     开头的 code 并构造确定性 unionId / openid / nickname，不打真 API。
 */
export const isWechatDevMock = (): boolean => {
  return (
    !process.env.WECHAT_APP_ID || !process.env.WECHAT_APP_SECRET || !process.env.WECHAT_REDIRECT_URI
  )
}

function readEnv(): WechatEnv {
  const appId = process.env.WECHAT_APP_ID
  const appSecret = process.env.WECHAT_APP_SECRET
  const redirectUri = process.env.WECHAT_REDIRECT_URI
  if (!appId || !appSecret || !redirectUri) {
    throw new ForgelyError(
      'WECHAT_NOT_CONFIGURED',
      '微信登录未配置：缺少 WECHAT_APP_ID / WECHAT_APP_SECRET / WECHAT_REDIRECT_URI 环境变量。',
      500,
    )
  }
  return { appId, appSecret, redirectUri }
}

/** Dev-mock: mint a deterministic "scanned" payload for a given state token. */
export const mintMockWechatCode = (state: string): string => `mock_${state}`

const MOCK_CODE_PREFIX = 'mock_'

const mockPayloadFromCode = (
  code: string,
): { token: AccessTokenResponse; profile: UserInfoResponse } => {
  const state = code.slice(MOCK_CODE_PREFIX.length) || 'anonymous'
  const unionId = `mock_union_${state}`.slice(0, 28)
  const openId = `mock_open_${state}`.slice(0, 28)
  const token: AccessTokenResponse = {
    access_token: `mock_access_${state}`,
    expires_in: 7200,
    refresh_token: `mock_refresh_${state}`,
    openid: openId,
    scope: 'snsapi_login',
    unionid: unionId,
  }
  const profile: UserInfoResponse = {
    openid: openId,
    nickname: `微信测试用户${state.slice(-4)}`,
    sex: 1,
    province: 'Shanghai',
    city: 'Shanghai',
    country: 'CN',
    headimgurl: 'https://forgely.cn/avatars/wx-mock.png',
    privilege: [],
    unionid: unionId,
  }
  return { token, profile }
}

/**
 * 生成扫码登录授权 URL。
 *
 * @param state 客户端生成的 CSRF token，回调时校验。
 * @param scope 默认 `snsapi_login`（网站扫码）。
 */
export function buildAuthorizeUrl(opts: {
  state: string
  scope?: WechatScope
  /** 可选，自定义 redirect_uri（例如不同租户 callback）。 */
  redirectUri?: string
}): string {
  if (isWechatDevMock()) {
    const base =
      opts.redirectUri ??
      process.env.WECHAT_REDIRECT_URI ??
      `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3001'}/api/auth/wechat/callback`
    // 指向本地的 mock 成功 URL — 前端 5s 轮询此 URL 视为"扫码成功"。
    const mockUrl = new URL(
      `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3001'}/api/auth/wechat/mock-success`,
    )
    mockUrl.searchParams.set('state', opts.state)
    mockUrl.searchParams.set('redirect', base)
    return mockUrl.toString()
  }
  const env = readEnv()
  const params = new URLSearchParams({
    appid: env.appId,
    redirect_uri: encodeURIComponent(opts.redirectUri ?? env.redirectUri),
    response_type: 'code',
    scope: opts.scope ?? 'snsapi_login',
    state: opts.state,
  })
  return `${QR_AUTH_URL}?${params.toString()}#wechat_redirect`
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
  if (isWechatDevMock() || code.startsWith(MOCK_CODE_PREFIX)) {
    return mockPayloadFromCode(code.startsWith(MOCK_CODE_PREFIX) ? code : `${MOCK_CODE_PREFIX}auto`)
      .token
  }
  const env = readEnv()
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
  if (isWechatDevMock() || accessToken.startsWith('mock_access_')) {
    const state = accessToken.replace(/^mock_access_/, '') || 'auto'
    return mockPayloadFromCode(`${MOCK_CODE_PREFIX}${state}`).profile
  }
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
  const env = readEnv()
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
 * 调用方拿到 `userId` 后，调用 `issueSession({ userId, ... })` 签发 JWT / cookie。
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

  // 1. 已绑定 → 直接返回
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

  // 2. 没绑过 → 新建 User + WechatAccount（事务保证原子）
  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        // 微信用户暂无 email，用伪邮箱占位（用户后续可绑定真邮箱）
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
