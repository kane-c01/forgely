/**
 * Localised messages keyed by ForgelyErrorCode.
 *
 * Designed as a non-invasive layer on top of `errors.ts`: the
 * `ForgelyError.userMessage` field stays a single string (default English),
 * and this module supplies the bilingual map keyed on `code` so the API
 * response / UI can pick the right copy.
 *
 * Usage:
 *
 *   import { localizeError } from '@forgely/api'
 *   const msg = localizeError(err, 'zh-CN')
 *
 * @owner W3 (Sprint 3 — S3-7)
 */

import type { ForgelyError, ForgelyErrorCode } from '../errors.js'
import { isForgelyError } from '../errors.js'

export type SupportedLocale = 'en' | 'zh-CN'

export interface LocalizedMessage {
  en: string
  'zh-CN': string
}

/**
 * Built-in dictionary. Codes that aren't listed fall back to the
 * `ForgelyError.userMessage` field for English and a generic Chinese
 * translation. Add new entries here when introducing new error codes.
 */
export const ERROR_MESSAGES: Readonly<Partial<Record<ForgelyErrorCode, LocalizedMessage>>> = {
  UNAUTHORIZED: { en: 'You must be signed in.', 'zh-CN': '请先登录。' },
  FORBIDDEN: {
    en: 'You do not have access to this resource.',
    'zh-CN': '您没有访问此资源的权限。',
  },
  INVALID_CREDENTIALS: {
    en: 'Email or password is incorrect.',
    'zh-CN': '邮箱或密码不正确。',
  },
  EMAIL_TAKEN: {
    en: 'An account with that email already exists.',
    'zh-CN': '该邮箱已被注册。',
  },
  WEAK_PASSWORD: {
    en: 'Password is too weak. Use at least 10 chars with letters and numbers.',
    'zh-CN': '密码强度不足，请至少 10 位且包含字母和数字。',
  },
  ACCOUNT_LOCKED: {
    en: 'Account temporarily locked. Try again later.',
    'zh-CN': '账户已临时锁定，请稍后再试。',
  },
  EMAIL_NOT_VERIFIED: {
    en: 'Please verify your email before continuing.',
    'zh-CN': '请先验证您的邮箱。',
  },
  TOKEN_EXPIRED: {
    en: 'Session expired. Please sign in again.',
    'zh-CN': '会话已过期，请重新登录。',
  },
  TOKEN_INVALID: {
    en: 'Invalid authentication token.',
    'zh-CN': '无效的鉴权令牌。',
  },
  MFA_REQUIRED: {
    en: 'Two-factor authentication required.',
    'zh-CN': '需要二次验证（2FA）。',
  },

  INSUFFICIENT_CREDITS: {
    en: 'Not enough credits.',
    'zh-CN': '积分不足。',
  },
  CREDIT_OPERATION_TOO_LARGE: {
    en: 'Single operation exceeds the per-op credit cap.',
    'zh-CN': '单次操作超过积分上限。',
  },
  DAILY_CREDIT_LIMIT_EXCEEDED: {
    en: 'Daily credit limit reached.',
    'zh-CN': '已达到每日积分上限。',
  },
  RESERVATION_NOT_FOUND: {
    en: 'Credit reservation not found.',
    'zh-CN': '未找到积分预占记录。',
  },
  RESERVATION_ALREADY_RESOLVED: {
    en: 'Credit reservation already resolved.',
    'zh-CN': '该积分预占已结清。',
  },
  RESERVATION_EXPIRED: {
    en: 'Credit reservation expired.',
    'zh-CN': '积分预占已过期。',
  },

  STRIPE_NOT_CONFIGURED: {
    en: 'Stripe is not configured for this environment.',
    'zh-CN': '当前环境未配置 Stripe。',
  },
  STRIPE_CUSTOMER_REQUIRED: {
    en: 'A Stripe customer is required first.',
    'zh-CN': '需先创建 Stripe 客户。',
  },
  STRIPE_WEBHOOK_INVALID: {
    en: 'Invalid Stripe webhook signature.',
    'zh-CN': 'Stripe webhook 签名无效。',
  },
  STRIPE_UPSTREAM: {
    en: 'Stripe upstream error.',
    'zh-CN': 'Stripe 上游服务错误。',
  },
  PLAN_NOT_FOUND: { en: 'Plan not found.', 'zh-CN': '未找到该订阅计划。' },
  PACKAGE_NOT_FOUND: {
    en: 'Credits package not found.',
    'zh-CN': '未找到该积分包。',
  },

  WECHAT_PAY_NOT_CONFIGURED: {
    en: 'WeChat Pay is not configured.',
    'zh-CN': '当前环境未配置微信支付。',
  },
  WECHAT_PAY_SCENE_UNSUPPORTED: {
    en: 'Unsupported WeChat Pay scenario.',
    'zh-CN': '不支持的微信支付场景。',
  },
  WECHAT_PAY_OPENID_REQUIRED: {
    en: 'WeChat openid is required for JSAPI scenarios.',
    'zh-CN': 'JSAPI 场景需要 openid。',
  },
  WECHAT_PAY_CREATE_FAILED: {
    en: 'Could not create the WeChat Pay order.',
    'zh-CN': '微信支付下单失败。',
  },
  WECHAT_PAY_WEBHOOK_TODO: {
    en: 'WeChat Pay webhook is not yet implemented.',
    'zh-CN': '微信支付 webhook 尚未实现。',
  },

  ALIPAY_NOT_CONFIGURED: {
    en: 'Alipay is not configured.',
    'zh-CN': '当前环境未配置支付宝。',
  },
  ALIPAY_SCENE_UNSUPPORTED: {
    en: 'Unsupported Alipay scenario.',
    'zh-CN': '不支持的支付宝场景。',
  },
  ALIPAY_PRECREATE_FAILED: {
    en: 'Could not create the Alipay order.',
    'zh-CN': '支付宝下单失败。',
  },
  ALIPAY_WEBHOOK_INVALID: {
    en: 'Invalid Alipay webhook signature.',
    'zh-CN': '支付宝 webhook 签名无效。',
  },
  ALIPAY_REFUND_TODO: {
    en: 'Alipay refund flow is not yet implemented.',
    'zh-CN': '支付宝退款流程尚未实现。',
  },

  WECHAT_NOT_CONFIGURED: {
    en: 'WeChat OAuth is not configured.',
    'zh-CN': '当前环境未配置微信登录。',
  },
  WECHAT_TOKEN_EXCHANGE_FAILED: {
    en: 'WeChat token exchange failed.',
    'zh-CN': '微信令牌交换失败。',
  },
  WECHAT_USERINFO_FAILED: {
    en: 'Could not fetch the WeChat user profile.',
    'zh-CN': '获取微信用户信息失败。',
  },
  WECHAT_REFRESH_FAILED: {
    en: 'WeChat token refresh failed.',
    'zh-CN': '微信令牌刷新失败。',
  },
  WECHAT_UNIONID_MISSING: {
    en: 'WeChat unionid is missing from the response.',
    'zh-CN': '微信返回中缺少 unionid。',
  },

  SMS_NOT_CONFIGURED: {
    en: 'SMS provider is not configured.',
    'zh-CN': '当前环境未配置短信服务。',
  },
  INVALID_PHONE: { en: 'Phone number is invalid.', 'zh-CN': '手机号格式不正确。' },
  OTP_NOT_FOUND: { en: 'OTP code not found.', 'zh-CN': '未找到验证码。' },
  OTP_INVALID: { en: 'OTP code is invalid or expired.', 'zh-CN': '验证码无效或已过期。' },
  OTP_LOCKED: { en: 'Too many attempts. Try again later.', 'zh-CN': '尝试次数过多，请稍后再试。' },

  NOT_FOUND: { en: 'Not found.', 'zh-CN': '未找到。' },
  CONFLICT: { en: 'Conflict.', 'zh-CN': '冲突。' },
  RATE_LIMITED: { en: 'Too many requests.', 'zh-CN': '请求过于频繁。' },
  VALIDATION_ERROR: { en: 'Invalid input.', 'zh-CN': '输入有误。' },
  INTERNAL_ERROR: {
    en: 'Something went wrong on our side.',
    'zh-CN': '服务器开了个小差，请稍后再试。',
  },
}

/** Fallback if the dictionary doesn't have the requested code. */
export const FALLBACK_LOCALIZATION: LocalizedMessage = {
  en: 'Something went wrong.',
  'zh-CN': '出错了。',
}

/**
 * Resolve a locale-specific message for a `ForgelyError`. If the error's
 * `userMessage` already provides a richer English message (e.g. with
 * specific numbers like "need 50 have 10"), prefer it for `en`.
 */
export const localizeError = (
  err: ForgelyError | unknown,
  locale: SupportedLocale | string = 'en',
): string => {
  if (!isForgelyError(err)) {
    if (err instanceof Error) return err.message
    return String(err)
  }
  const dict = ERROR_MESSAGES[err.code] ?? FALLBACK_LOCALIZATION
  if (locale === 'en') {
    return err.userMessage || dict.en
  }
  if (locale === 'zh-CN') {
    return dict['zh-CN']
  }
  return dict.en
}

/** Convenience: get both locales at once for client-side caching. */
export const localizeAllLocales = (err: ForgelyError | unknown): LocalizedMessage => ({
  en: localizeError(err, 'en'),
  'zh-CN': localizeError(err, 'zh-CN'),
})
