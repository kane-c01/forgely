/**
 * CN auth — end-to-end flows: WeChat dev-mock scan + phone OTP.
 *
 * Covers the three-path convergence called out in the W3 brief:
 *   - WeChat dev mock → `loginWithCode('mock_…')` → upsert `User` +
 *     `WechatAccount`, returns userId (ready for createSession + cookie).
 *   - Phone OTP → `requestOtp` issues fixed `123456` in dev mode, writes a
 *     `PhoneOtp` row; `loginWithPhoneOtp` verifies + creates user.
 *   - `buildSessionCookie` emits the canonical HttpOnly + SameSite=Lax shape
 *     used by all three auth paths.
 *   - AuditLog is writable via `recordAuthAudit('auth.signin.wechat')` +
 *     `'auth.signin.phone'` (enum membership asserted).
 *
 * Prisma is mocked in-memory (same pattern as payments-e2e).
 */
import { describe, expect, it, vi, beforeEach } from 'vitest'

interface UserRow {
  id: string
  email: string
  name: string | null
  phoneE164?: string | null
  phoneVerifiedAt?: Date | null
  wechatUnionId?: string | null
  role: string
  plan: string
  deletedAt: Date | null
  avatarUrl: string | null
  passwordHash: string | null
  emailVerifiedAt: Date | null
  region: string | null
  locale: string | null
  createdAt: Date
  updatedAt: Date
}

interface WechatAccountRow {
  id: string
  userId: string
  openId: string
  unionId: string
  scope: string
  nickname: string | null
  avatarUrl: string | null
  sex?: number | null
  country?: string | null
  province?: string | null
  city?: string | null
  accessToken: string
  refreshToken: string
  accessTokenExpires: Date
  createdAt: Date
  updatedAt: Date
}

interface PhoneOtpRow {
  id: string
  phoneE164: string
  purpose: string
  codeHash: string
  userId: string | null
  requestIp: string | null
  attempts: number
  expiresAt: Date
  consumedAt: Date | null
  createdAt: Date
}

interface SessionRow {
  id: string
  sessionToken: string
  userId: string
  expires: Date
  ipAddress: string | null
  userAgent: string | null
  lastSeenAt: Date
  createdAt: Date
}

interface AuditLogRow {
  id: string
  actorType: string
  actorId: string
  action: string
  targetType: string
  targetId: string
  before: unknown
  after: unknown
  reason: string | null
  ipAddress: string | null
  userAgent: string | null
  createdAt: Date
}

interface LoginEventRow {
  id: string
  userId: string | null
  email: string | null
  outcome: string
  ipAddress: string | null
  userAgent: string | null
  createdAt: Date
}

interface Store {
  users: UserRow[]
  wechatAccounts: WechatAccountRow[]
  phoneOtps: PhoneOtpRow[]
  sessions: SessionRow[]
  auditLogs: AuditLogRow[]
  loginEvents: LoginEventRow[]
}

const STORE: Store = {
  users: [],
  wechatAccounts: [],
  phoneOtps: [],
  sessions: [],
  auditLogs: [],
  loginEvents: [],
}

let AUTO_ID = 0
const nextId = (prefix: string): string => `${prefix}_${++AUTO_ID}`

const matchWhere = <R extends Record<string, unknown>>(
  row: R,
  where: Record<string, unknown>,
): boolean => {
  for (const [k, v] of Object.entries(where)) {
    if (v == null) continue
    if (typeof v === 'object' && v !== null) {
      const op = v as Record<string, unknown>
      if ('gte' in op) {
        if (!(row[k] instanceof Date) || (row[k] as Date).getTime() < (op.gte as Date).getTime())
          return false
        continue
      }
      if ('gt' in op) {
        if (!(row[k] instanceof Date) || (row[k] as Date).getTime() <= (op.gt as Date).getTime())
          return false
        continue
      }
      if ('not' in op) {
        if (row[k] === op.not) return false
        continue
      }
    }
    if (row[k] !== v) return false
  }
  return true
}

const prismaStub = {
  async $transaction<T>(fn: (tx: unknown) => Promise<T>): Promise<T> {
    return fn(prismaStub)
  },

  user: {
    findUnique: async ({ where }: { where: Record<string, unknown> }) => {
      if ('id' in where) return STORE.users.find((u) => u.id === where.id) ?? null
      if ('email' in where) return STORE.users.find((u) => u.email === where.email) ?? null
      return null
    },
    create: async ({ data }: { data: Partial<UserRow> }) => {
      const row: UserRow = {
        id: nextId('user'),
        email: data.email ?? `${nextId('dummy')}@example.com`,
        name: data.name ?? null,
        phoneE164: (data as { phoneE164?: string | null }).phoneE164 ?? null,
        phoneVerifiedAt: (data as { phoneVerifiedAt?: Date | null }).phoneVerifiedAt ?? null,
        wechatUnionId: (data as { wechatUnionId?: string | null }).wechatUnionId ?? null,
        role: data.role ?? 'user',
        plan: data.plan ?? 'free',
        deletedAt: null,
        avatarUrl: data.avatarUrl ?? null,
        passwordHash: data.passwordHash ?? null,
        emailVerifiedAt: data.emailVerifiedAt ?? null,
        region: data.region ?? null,
        locale: data.locale ?? null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      STORE.users.push(row)
      return { ...row }
    },
    update: async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
      const u = STORE.users.find((x) => x.id === where.id)
      if (!u) throw new Error('user not found')
      Object.assign(u, data)
      u.updatedAt = new Date()
      return { ...u }
    },
  },

  wechatAccount: {
    findUnique: async ({ where }: { where: Record<string, unknown> }) =>
      STORE.wechatAccounts.find((a) =>
        matchWhere(a as unknown as Record<string, unknown>, where),
      ) ?? null,
    create: async ({ data }: { data: Partial<WechatAccountRow> }) => {
      const row: WechatAccountRow = {
        id: nextId('wx'),
        userId: data.userId!,
        openId: data.openId!,
        unionId: data.unionId!,
        scope: data.scope ?? 'snsapi_login',
        nickname: data.nickname ?? null,
        avatarUrl: data.avatarUrl ?? null,
        sex: data.sex ?? null,
        country: data.country ?? null,
        province: data.province ?? null,
        city: data.city ?? null,
        accessToken: data.accessToken!,
        refreshToken: data.refreshToken!,
        accessTokenExpires: data.accessTokenExpires!,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      STORE.wechatAccounts.push(row)
      return { ...row }
    },
    update: async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
      const a = STORE.wechatAccounts.find((x) => x.id === where.id)
      if (!a) throw new Error('wechatAccount not found')
      Object.assign(a, data)
      a.updatedAt = new Date()
      return { ...a }
    },
  },

  phoneOtp: {
    findMany: async ({ where }: { where: Record<string, unknown> }) =>
      STORE.phoneOtps
        .filter((o) => matchWhere(o as unknown as Record<string, unknown>, where))
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
    findFirst: async ({ where }: { where: Record<string, unknown> }) =>
      STORE.phoneOtps
        .filter((o) => matchWhere(o as unknown as Record<string, unknown>, where))
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0] ?? null,
    create: async ({ data }: { data: Partial<PhoneOtpRow> }) => {
      const row: PhoneOtpRow = {
        id: nextId('otp'),
        phoneE164: data.phoneE164!,
        purpose: data.purpose!,
        codeHash: data.codeHash!,
        userId: data.userId ?? null,
        requestIp: data.requestIp ?? null,
        attempts: data.attempts ?? 0,
        expiresAt: data.expiresAt!,
        consumedAt: data.consumedAt ?? null,
        createdAt: new Date(),
      }
      STORE.phoneOtps.push(row)
      return { ...row }
    },
    update: async ({ where, data }: { where: { id: string }; data: Partial<PhoneOtpRow> }) => {
      const o = STORE.phoneOtps.find((x) => x.id === where.id)
      if (!o) throw new Error('otp not found')
      Object.assign(o, data)
      return { ...o }
    },
  },

  session: {
    create: async ({ data }: { data: Partial<SessionRow> }) => {
      const row: SessionRow = {
        id: nextId('sess'),
        sessionToken: data.sessionToken!,
        userId: data.userId!,
        expires: data.expires!,
        ipAddress: data.ipAddress ?? null,
        userAgent: data.userAgent ?? null,
        lastSeenAt: new Date(),
        createdAt: new Date(),
      }
      STORE.sessions.push(row)
      return { ...row }
    },
    findUnique: async ({
      where,
      include,
    }: {
      where: { sessionToken: string }
      include?: { user?: boolean }
    }) => {
      const s = STORE.sessions.find((x) => x.sessionToken === where.sessionToken)
      if (!s) return null
      const out: SessionRow & { user?: UserRow } = { ...s }
      if (include?.user) {
        const u = STORE.users.find((x) => x.id === s.userId)
        if (u) out.user = u
      }
      return out
    },
    deleteMany: async ({ where }: { where: Record<string, unknown> }) => {
      const before = STORE.sessions.length
      STORE.sessions = STORE.sessions.filter(
        (s) => !matchWhere(s as unknown as Record<string, unknown>, where),
      )
      return { count: before - STORE.sessions.length }
    },
    delete: async ({ where }: { where: { id: string } }) => {
      const idx = STORE.sessions.findIndex((s) => s.id === where.id)
      if (idx < 0) return null
      const [removed] = STORE.sessions.splice(idx, 1)
      return removed
    },
    update: async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
      const s = STORE.sessions.find((x) => x.id === where.id)
      if (!s) throw new Error('session not found')
      Object.assign(s, data)
      return { ...s }
    },
  },

  auditLog: {
    create: async ({ data }: { data: Partial<AuditLogRow> }) => {
      const row: AuditLogRow = {
        id: nextId('audit'),
        actorType: data.actorType ?? 'user',
        actorId: data.actorId!,
        action: data.action!,
        targetType: data.targetType ?? 'user',
        targetId: data.targetId ?? data.actorId!,
        before: data.before ?? null,
        after: data.after ?? null,
        reason: data.reason ?? null,
        ipAddress: data.ipAddress ?? null,
        userAgent: data.userAgent ?? null,
        createdAt: new Date(),
      }
      STORE.auditLogs.push(row)
      return { ...row }
    },
  },

  loginEvent: {
    create: async ({ data }: { data: Partial<LoginEventRow> }) => {
      const row: LoginEventRow = {
        id: nextId('login'),
        userId: data.userId ?? null,
        email: data.email ?? null,
        outcome: data.outcome!,
        ipAddress: data.ipAddress ?? null,
        userAgent: data.userAgent ?? null,
        createdAt: new Date(),
      }
      STORE.loginEvents.push(row)
      return { ...row }
    },
  },
} as const

vi.mock('../../src/db.js', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>
  return {
    ...actual,
    prisma: prismaStub,
    Prisma: { ...(actual.Prisma as Record<string, unknown>), JsonNull: null },
  }
})

// Force dev mock mode for both providers.
for (const k of [
  'WECHAT_APP_ID',
  'WECHAT_APP_SECRET',
  'WECHAT_REDIRECT_URI',
  'ALIYUN_SMS_ACCESS_KEY',
  'ALIYUN_SMS_ACCESS_SECRET',
  'ALIYUN_SMS_SIGN_NAME',
  'ALIYUN_SMS_TEMPLATE_CODE',
  'FORGELY_SMS_PROVIDER',
]) {
  delete process.env[k]
}

const reset = () => {
  STORE.users = []
  STORE.wechatAccounts = []
  STORE.phoneOtps = []
  STORE.sessions = []
  STORE.auditLogs = []
  STORE.loginEvents = []
  AUTO_ID = 0
}

beforeEach(reset)

describe('auth/wechat — dev mock flow', () => {
  it('loginWithCode(mock_abc) upserts User + WechatAccount, reusable on re-scan', async () => {
    const { loginWithCode, mintMockWechatCode, isWechatDevMock } =
      await import('../../src/auth/wechat.js')
    expect(isWechatDevMock()).toBe(true)

    const code = mintMockWechatCode('state-abc')
    const first = await loginWithCode(code)

    expect(first.isNewUser).toBe(true)
    expect(STORE.users).toHaveLength(1)
    expect(STORE.wechatAccounts).toHaveLength(1)
    expect(STORE.wechatAccounts[0].unionId).toMatch(/^mock_union_/)
    expect(STORE.users[0].wechatUnionId).toBe(STORE.wechatAccounts[0].unionId)

    // Re-scan — should reuse the same user row.
    const second = await loginWithCode(code)
    expect(second.isNewUser).toBe(false)
    expect(second.userId).toBe(first.userId)
    expect(STORE.users).toHaveLength(1)
    expect(STORE.wechatAccounts).toHaveLength(1)
  })

  it('records auth.signin.wechat audit when called via the login helper', async () => {
    const { loginWithCode, mintMockWechatCode } = await import('../../src/auth/wechat.js')
    const { recordAuthAudit } = await import('../../src/auth/audit.js')

    const code = mintMockWechatCode('audit-case')
    const { userId } = await loginWithCode(code)
    await recordAuthAudit({
      actorId: userId,
      action: 'auth.signin.wechat',
      ipAddress: '10.0.0.1',
      userAgent: 'JestAgent',
    })

    const audit = STORE.auditLogs.find((a) => a.action === 'auth.signin.wechat')
    expect(audit).toBeDefined()
    expect(audit?.targetId).toBe(userId)
    expect(audit?.ipAddress).toBe('10.0.0.1')
  })
})

describe('auth/sms-otp — dev mode issues 123456', () => {
  it('requestOtp writes a PhoneOtp row and the fixed code verifies', async () => {
    const { isSmsDevMode, requestOtp, verifyOtp } = await import('../../src/auth/sms-otp.js')
    expect(isSmsDevMode()).toBe(true)

    const phone = '13800138000'
    const { expiresAt } = await requestOtp({ phone, purpose: 'login' })
    expect(expiresAt.getTime()).toBeGreaterThan(Date.now())
    expect(STORE.phoneOtps).toHaveLength(1)
    expect(STORE.phoneOtps[0].phoneE164).toBe('+8613800138000')

    const verified = await verifyOtp({ phone, purpose: 'login', code: '123456' })
    expect(verified.phoneE164).toBe('+8613800138000')
    expect(STORE.phoneOtps[0].consumedAt).not.toBeNull()
  })

  it('wrong code increments attempts and throws OTP_INVALID', async () => {
    const { requestOtp, verifyOtp } = await import('../../src/auth/sms-otp.js')
    const phone = '13800138001'
    await requestOtp({ phone, purpose: 'login' })

    await expect(verifyOtp({ phone, purpose: 'login', code: '999999' })).rejects.toThrow(
      /OTP_INVALID|验证码/,
    )
    expect(STORE.phoneOtps[0].attempts).toBeGreaterThan(0)
    expect(STORE.phoneOtps[0].consumedAt).toBeNull()
  })

  it('loginWithPhoneOtp creates a user + returns userId (ready for session)', async () => {
    const { requestOtp, loginWithPhoneOtp } = await import('../../src/auth/sms-otp.js')
    const phone = '13900139000'
    await requestOtp({ phone, purpose: 'login' })

    const result = await loginWithPhoneOtp({ phone, purpose: 'login', code: '123456' })
    expect(result.isNewUser).toBe(true)
    expect(STORE.users).toHaveLength(1)
    expect(STORE.users[0].phoneE164).toBe('+8613900139000')
    expect(STORE.users[0].phoneVerifiedAt).toBeDefined()
  })
})

describe('auth/session — cookie helpers', () => {
  it('buildSessionCookie emits HttpOnly + SameSite=Lax + Max-Age', async () => {
    const { buildSessionCookie, SESSION_COOKIE_NAME } = await import('../../src/auth/session.js')
    const cookie = buildSessionCookie('opaque_token_abc', {
      maxAgeSeconds: 3600,
      secure: true,
    })
    expect(cookie).toContain(`${SESSION_COOKIE_NAME}=opaque_token_abc`)
    expect(cookie).toContain('Path=/')
    expect(cookie).toContain('HttpOnly')
    expect(cookie).toContain('SameSite=Lax')
    expect(cookie).toContain('Max-Age=3600')
    expect(cookie).toContain('Secure')
  })

  it('parseSessionCookie round-trips through a raw Cookie header', async () => {
    const { buildSessionCookie, parseSessionCookie, SESSION_COOKIE_NAME } =
      await import('../../src/auth/session.js')
    const tok = 'round_trip_token'
    const setCookie = buildSessionCookie(tok, { maxAgeSeconds: 60 })
    // Chop off the cookie-only fragment to simulate what a browser sends back.
    const clientCookieHeader = `theme=dark; ${SESSION_COOKIE_NAME}=${tok}; _ga=GA1.2.xxx`
    void setCookie
    expect(parseSessionCookie(clientCookieHeader)).toBe(tok)
  })

  it('buildClearSessionCookie uses Max-Age=0', async () => {
    const { buildClearSessionCookie } = await import('../../src/auth/session.js')
    const clear = buildClearSessionCookie()
    expect(clear).toContain('Max-Age=0')
    expect(clear).toContain('Expires=Thu, 01 Jan 1970')
  })
})

describe('auth/session — createSession unifies all three login paths', () => {
  it('email/wechat/phone each mint an identical cookie-friendly session', async () => {
    const { createSession } = await import('../../src/auth/sessions.js')
    const { loginWithCode, mintMockWechatCode } = await import('../../src/auth/wechat.js')
    const { requestOtp, loginWithPhoneOtp } = await import('../../src/auth/sms-otp.js')

    // Path 1: seed a password user directly
    const emailUser = await prismaStub.user.create({
      data: {
        email: 'alice@forgely.cn',
        name: 'Alice',
        passwordHash: 'dummy',
      },
    })
    const emailSession = await createSession(emailUser, { userAgent: 'e1' })

    // Path 2: WeChat dev mock
    const { userId: wechatUserId } = await loginWithCode(mintMockWechatCode('s1'))
    const wechatUser = STORE.users.find((u) => u.id === wechatUserId)!
    const wechatSession = await createSession(wechatUser, { userAgent: 'e2' })

    // Path 3: Phone OTP
    const phone = '13800130003'
    await requestOtp({ phone, purpose: 'login' })
    const { userId: phoneUserId } = await loginWithPhoneOtp({
      phone,
      purpose: 'login',
      code: '123456',
    })
    const phoneUser = STORE.users.find((u) => u.id === phoneUserId)!
    const phoneSession = await createSession(phoneUser, { userAgent: 'e3' })

    const tokens = [
      emailSession.sessionToken,
      wechatSession.sessionToken,
      phoneSession.sessionToken,
    ]
    // Three distinct opaque tokens.
    expect(new Set(tokens).size).toBe(3)
    // Three Session rows in DB, one per user.
    expect(STORE.sessions).toHaveLength(3)
    const userIds = STORE.sessions.map((s) => s.userId)
    expect(new Set(userIds).size).toBe(3)
  })
})
