/**
 * 完成中国区登录 —— 统一处理 session 签发 + audit log + 首登送积分。
 *
 * 微信 / 手机 OTP / 邮箱密码 三种入口都通过这里走完最后一步，
 * 确保 cookie、审计、onboarding、积分赠送逻辑一致。
 *
 * @owner W6 — docs/SPRINT-3-DISPATCH.md
 */
import type { User } from '@prisma/client'

import { prisma } from '../db.js'
import { creditWallet, getOrCreateWallet } from '../credits/wallet.js'

import { recordAudit, recordLoginEvent } from './audit.js'
import { createSession, type CreatedSession } from './sessions.js'

/** 首次 onboarding 完成赠送的积分。docs/SPRINT-3-DISPATCH.md §6。 */
export const ONBOARDING_GIFT_CREDITS = 100

export type CnLoginProvider = 'wechat' | 'phone' | 'email'

export interface CompleteLoginOptions {
  user: User
  provider: CnLoginProvider
  isNewUser: boolean
  ipAddress?: string | null
  userAgent?: string | null
  /** 任意 provider 侧元数据，用于 LoginEvent.metadata 字段（暂时 stringify 到 userAgent 备注）。 */
  metadata?: Record<string, unknown>
}

export interface CompleteLoginResult {
  session: CreatedSession
  /** true → 用户首次登录，route handler 应 redirect `/onboarding`。 */
  needsOnboarding: boolean
  /** 便于 route handler 直接使用。 */
  redirectTo: '/onboarding' | '/dashboard'
}

/**
 * 签发 session + 记审计 + 发积分（如果是新用户）。
 *
 * @throws 只会在 DB 连接失败等基础层面抛错；LoginEvent / credits 写入失败会
 *         吞掉错误（登录成功优先）。
 */
export async function completeLogin(options: CompleteLoginOptions): Promise<CompleteLoginResult> {
  const session = await createSession(options.user, {
    ipAddress: options.ipAddress ?? undefined,
    userAgent: options.userAgent ?? undefined,
  })

  void recordLoginEvent({
    userId: options.user.id,
    email: options.user.email,
    outcome: 'success',
    ipAddress: options.ipAddress ?? null,
    userAgent: options.userAgent ?? buildProviderMarker(options),
  })

  void recordAudit({
    actorType: 'user',
    actorId: options.user.id,
    action: 'auth.login',
    targetType: 'user',
    targetId: options.user.id,
    ipAddress: options.ipAddress ?? null,
    userAgent: options.userAgent ?? null,
    after: {
      provider: options.provider,
      isNewUser: options.isNewUser,
      ...(options.metadata ?? {}),
    },
  })

  // 积分在 onboarding 完成时发放（completeOnboarding），而非登录时。
  // 这样防止刷新登录套刷积分。

  const needsOnboarding = options.user.onboardedAt === null
  return {
    session,
    needsOnboarding,
    redirectTo: needsOnboarding ? '/onboarding' : '/dashboard',
  }
}

export interface CompleteOnboardingInput {
  userId: string
  companyName: string
  businessCategory: string
  targetMarkets: string[]
  ipAddress?: string | null
  userAgent?: string | null
}

export interface CompleteOnboardingResult {
  onboardedAt: Date
  /** 如果是首次完成 onboarding 则返回赠送的积分数量，否则 0。 */
  creditsGranted: number
}

/**
 * 完成 onboarding —— 写公司信息 + onboardedAt + 首次完成时发 100 积分（幂等）。
 */
export async function completeOnboarding(
  input: CompleteOnboardingInput,
): Promise<CompleteOnboardingResult> {
  const existing = await prisma.user.findUnique({
    where: { id: input.userId },
    select: { onboardedAt: true },
  })
  if (!existing) {
    throw new Error('USER_NOT_FOUND')
  }

  const now = new Date()
  const wasFirstTime = existing.onboardedAt === null

  await prisma.user.update({
    where: { id: input.userId },
    data: {
      onboardedAt: existing.onboardedAt ?? now,
      companyName: input.companyName,
      businessCategory: input.businessCategory,
      targetMarkets: input.targetMarkets,
    },
  })

  let creditsGranted = 0
  if (wasFirstTime) {
    creditsGranted = await grantOnboardingCreditsSafely(input.userId)
  }

  void recordAudit({
    actorType: 'user',
    actorId: input.userId,
    action: 'auth.onboarded',
    targetType: 'user',
    targetId: input.userId,
    ipAddress: input.ipAddress ?? null,
    userAgent: input.userAgent ?? null,
    after: {
      companyName: input.companyName,
      businessCategory: input.businessCategory,
      targetMarkets: input.targetMarkets,
      firstTime: wasFirstTime,
      creditsGranted,
    },
  })

  return { onboardedAt: existing.onboardedAt ?? now, creditsGranted }
}

/** onboarding 完成后赠送 100 积分 —— 幂等（已有 onboarding gift 则跳过）。 */
async function grantOnboardingCreditsSafely(userId: string): Promise<number> {
  try {
    await getOrCreateWallet(userId)
    const existing = await prisma.creditTransaction.findFirst({
      where: {
        userId,
        type: 'gift',
        description: { startsWith: '新用户 onboarding' },
      },
      select: { id: true },
    })
    if (existing) return 0
    await creditWallet({
      userId,
      amount: ONBOARDING_GIFT_CREDITS,
      type: 'gift',
      description: ' 新用户 onboarding 奖励（100 积分）'.trim(),
      metadata: { reason: 'onboarding_bonus' },
    })
    return ONBOARDING_GIFT_CREDITS
  } catch (err) {
    console.warn('[cn-login-complete] onboarding 积分赠送失败：', (err as Error).message)
    return 0
  }
}

function buildProviderMarker(options: CompleteLoginOptions): string {
  return `provider=${options.provider}${options.isNewUser ? '; new_user=1' : ''}`
}
