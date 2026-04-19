/**
 * 🇨🇳《中华人民共和国个人信息保护法》(PIPL)
 *
 * 自 2021-11-01 施行。任何收集中国用户个人信息的产品都需:
 * - 取得明示同意
 * - 公开收集 / 使用规则
 * - 提供撤回同意 / 删除途径
 * - 跨境传输需单独同意
 */

import type { Rule } from '../../types.js'
import { toFinding } from '../../utils/pattern.js'

const reference = 'http://www.npc.gov.cn/npc/c30834/202108/a8c4e3672c74491a80b53a172bb753fe.shtml'

/** 注册 / 收集邮箱时缺少 PIPL 必备同意 */
export const piplConsentMissing: Rule = {
  id: 'cn-pipl.consent-missing',
  name: 'PIPL §13/14: 收集个人信息缺少明示同意',
  region: 'CN-PIPL',
  reference,
  defaultSeverity: 'critical',
  description: '收集邮箱 / 手机号 / 微信信息的表单必须紧邻"我已阅读并同意《隐私政策》"勾选项。',
  appliesTo: { contentTypes: ['cta', 'page-copy'] },
  check(item, _ctx) {
    const isSignup = /(注册|创建账号|手机号|邮箱地址|订阅|微信扫码)/i.test(item.text)
    if (!isSignup) return []
    const hasConsent = /(隐私政策|用户协议|个人信息处理|已阅读并同意|授权同意)/i.test(item.text)
    if (hasConsent) return []
    return [
      toFinding({
        rule: {
          id: this.id,
          name: this.name,
          region: this.region,
          defaultSeverity: this.defaultSeverity,
          reference: this.reference,
        },
        item,
        match: { match: item.text.slice(0, 60), index: 0, excerpt: item.text.slice(0, 200) },
        suggestion:
          '在表单提交按钮旁加入勾选项："☐ 我已阅读并同意《Forgely 用户协议》和《隐私政策》"，未勾选则按钮置灰。',
        autoFixable: false,
      }),
    ]
  },
}

/** 提到 cookie / 跟踪但缺少 PIPL 提示 */
export const piplCookieBannerMissing: Rule = {
  id: 'cn-pipl.cookie-banner-missing',
  name: 'PIPL: Cookie / 自动化分析说明缺失',
  region: 'CN-PIPL',
  reference,
  defaultSeverity: 'warning',
  description: '使用 cookie / 埋点分析时必须告知，并提供拒绝选项（PIPL §44）。',
  appliesTo: { contentTypes: ['page-copy', 'faq'] },
  check(item, _ctx) {
    const hasTracking = /(cookie|埋点|自动化分析|用户行为分析|百度统计|友盟|sentry)/i.test(
      item.text,
    )
    if (!hasTracking) return []
    const hasOptOut = /(拒绝|关闭|管理偏好|cookie 偏好|opt[- ]?out)/i.test(item.text)
    if (hasOptOut) return []
    return [
      toFinding({
        rule: {
          id: this.id,
          name: this.name,
          region: this.region,
          defaultSeverity: this.defaultSeverity,
          reference: this.reference,
        },
        item,
        match: { match: item.text.slice(0, 60), index: 0, excerpt: item.text.slice(0, 200) },
        suggestion:
          '加入 Cookie banner：「我们使用 Cookie 改善服务体验，您可以在「Cookie 偏好」中拒绝非必要 Cookie。」',
        autoFixable: false,
      }),
    ]
  },
}

/** 跨境数据传输未获单独同意 */
export const piplCrossBorderTransfer: Rule = {
  id: 'cn-pipl.cross-border-consent-missing',
  name: 'PIPL §38/39: 跨境数据传输需单独同意',
  region: 'CN-PIPL',
  reference,
  defaultSeverity: 'critical',
  description: '将中国用户数据传输到境外服务器（含 OpenAI / Anthropic / Vercel 等）需单独同意。',
  appliesTo: { contentTypes: ['page-copy', 'faq'] },
  check(item, _ctx) {
    const hasOverseas =
      /(海外服务器|境外|aws|gcp|azure|cloudflare|openai|anthropic|claude|chatgpt)/i.test(item.text)
    if (!hasOverseas) return []
    const hasSeparateConsent = /(跨境.{0,10}同意|单独授权|境外传输.{0,15}同意)/i.test(item.text)
    if (hasSeparateConsent) return []
    return [
      toFinding({
        rule: {
          id: this.id,
          name: this.name,
          region: this.region,
          defaultSeverity: this.defaultSeverity,
          reference: this.reference,
        },
        item,
        match: { match: item.text.slice(0, 60), index: 0, excerpt: item.text.slice(0, 200) },
        suggestion:
          '加入单独同意项："☐ 我同意 Forgely 将我的输入内容传输至境外的 AI 服务商（Anthropic / OpenAI）以提供生成服务。"',
        autoFixable: false,
      }),
    ]
  },
}

export const piplRules: Rule[] = [
  piplConsentMissing,
  piplCookieBannerMissing,
  piplCrossBorderTransfer,
]
