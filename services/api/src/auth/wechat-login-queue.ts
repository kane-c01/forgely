/**
 * 微信扫码登录的 state → code/session 映射队列。
 *
 * 流程：
 *   1. 前端生成 `state`，调后端 `wechatStart` → register(state)
 *   2. 用户扫码 → 微信回跳 `/api/auth/wechat/callback?code=...&state=...`
 *      → loginWithCode(code) → markSuccess(state, userId)
 *   3. 前端每 2s 轮询 `wechatPoll(state)` → 命中 success 即 createSession + Set-Cookie
 *
 * 存储：
 *   - 生产：Redis (`forgely:wechat:login:{state}`，TTL 300s)
 *   - 开发：无 REDIS_URL → 进程内 Map + setTimeout 清理
 *
 * @owner W6 — docs/SPRINT-3-DISPATCH.md
 */
import IORedis, { type Redis as IORedisInstance } from 'ioredis'

const NAMESPACE = 'forgely:wechat:login:'
const TTL_SECONDS = 300

export type WechatLoginStatus = 'waiting' | 'success' | 'expired' | 'error'

export interface WechatLoginRecord {
  state: string
  status: WechatLoginStatus
  userId?: string
  isNewUser?: boolean
  /** dev mock 模式下标记 —— 前端可提示 */
  mock?: boolean
  /** 错误信息（status=error 时） */
  error?: string
  createdAt: number
  expiresAt: number
}

/** ─────────── Redis backend ─────────── */

let _redis: IORedisInstance | null = null
let _redisChecked = false

function getRedis(): IORedisInstance | null {
  if (_redisChecked) return _redis
  _redisChecked = true
  const url = process.env.REDIS_URL
  if (!url) return null
  try {
    _redis = new IORedis(url, {
      maxRetriesPerRequest: 2,
      enableReadyCheck: false,
      lazyConnect: true,
    })
    _redis.connect().catch((err) => {
      console.warn('[wechat-login-queue] redis 连接失败，降级到内存：', err.message)
      _redis = null
    })
    return _redis
  } catch (err) {
    console.warn('[wechat-login-queue] redis 初始化失败，降级到内存：', (err as Error).message)
    _redis = null
    return null
  }
}

/** ─────────── Memory fallback ─────────── */

const memory = new Map<string, WechatLoginRecord>()
const timers = new Map<string, NodeJS.Timeout>()

function rememberInMemory(state: string, record: WechatLoginRecord): void {
  memory.set(state, record)
  const existing = timers.get(state)
  if (existing) clearTimeout(existing)
  const ttl = Math.max(1000, record.expiresAt - Date.now())
  timers.set(
    state,
    setTimeout(() => {
      memory.delete(state)
      timers.delete(state)
    }, ttl),
  )
}

/** ─────────── Public API ─────────── */

const key = (state: string) => `${NAMESPACE}${state}`

/** 注册一个新的微信扫码登录请求，初始状态 waiting。 */
export async function registerLogin(
  state: string,
  opts: { mock?: boolean } = {},
): Promise<WechatLoginRecord> {
  const now = Date.now()
  const record: WechatLoginRecord = {
    state,
    status: 'waiting',
    mock: opts.mock,
    createdAt: now,
    expiresAt: now + TTL_SECONDS * 1000,
  }
  const redis = getRedis()
  if (redis) {
    await redis.set(key(state), JSON.stringify(record), 'EX', TTL_SECONDS).catch(() => {
      rememberInMemory(state, record)
    })
  } else {
    rememberInMemory(state, record)
  }
  return record
}

/** 标记扫码成功（wechatCallback 调用）。 */
export async function markSuccess(
  state: string,
  payload: { userId: string; isNewUser: boolean },
): Promise<WechatLoginRecord | null> {
  const existing = await pollLogin(state)
  if (!existing) return null
  const record: WechatLoginRecord = {
    ...existing,
    status: 'success',
    userId: payload.userId,
    isNewUser: payload.isNewUser,
  }
  const redis = getRedis()
  const remainingSeconds = Math.max(5, Math.floor((record.expiresAt - Date.now()) / 1000))
  if (redis) {
    await redis.set(key(state), JSON.stringify(record), 'EX', remainingSeconds).catch(() => {
      rememberInMemory(state, record)
    })
  } else {
    rememberInMemory(state, record)
  }
  return record
}

/** 标记失败（回调收到错误）。 */
export async function markError(state: string, error: string): Promise<void> {
  const existing = await pollLogin(state)
  if (!existing) return
  const record: WechatLoginRecord = { ...existing, status: 'error', error }
  const redis = getRedis()
  if (redis) {
    await redis
      .set(key(state), JSON.stringify(record), 'EX', 60)
      .catch(() => rememberInMemory(state, record))
  } else {
    rememberInMemory(state, record)
  }
}

/** 查询当前状态。未找到或过期返回 null。 */
export async function pollLogin(state: string): Promise<WechatLoginRecord | null> {
  const redis = getRedis()
  if (redis) {
    try {
      const raw = await redis.get(key(state))
      if (!raw) return memory.get(state) ?? null
      return JSON.parse(raw) as WechatLoginRecord
    } catch (err) {
      void err
      return memory.get(state) ?? null
    }
  }
  return memory.get(state) ?? null
}

/** 消费（登录成功后清掉记录）。 */
export async function consume(state: string): Promise<void> {
  const redis = getRedis()
  if (redis) {
    await redis.del(key(state)).catch(() => undefined)
  }
  memory.delete(state)
  const timer = timers.get(state)
  if (timer) clearTimeout(timer)
  timers.delete(state)
}
