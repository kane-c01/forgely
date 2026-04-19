/**
 * 🇪🇺 GDPR — General Data Protection Regulation
 *
 * 检查站点文本中暗示了"数据收集 / cookie"但缺少 GDPR 必备语句的情况。
 */

import type { Rule } from '../../types.js'
import { toFinding } from '../../utils/pattern.js'

const reference = 'https://gdpr.eu/'

/** 提到 cookie / tracking 但缺少 consent 提示 */
export const gdprCookieConsentMissing: Rule = {
  id: 'eu-gdpr.cookie.consent-missing',
  name: 'GDPR: cookie / tracking mentioned without explicit consent language',
  region: 'EU-GDPR',
  reference,
  defaultSeverity: 'warning',
  description:
    '页面文案中提到 cookie / tracking / analytics 时，应同时提示用户可拒绝（GDPR Art. 7）。',
  appliesTo: {
    contentTypes: ['page-copy', 'faq', 'meta-description'],
  },
  check(item, _ctx) {
    const mentionsTracking = /(cookie|tracking|analytics|fingerprint(ing)?|retargeting)/i.test(item.text)
    if (!mentionsTracking) return []
    const hasConsent = /(consent|opt[- ]out|opt[- ]in|preferences|reject)/i.test(item.text)
    if (hasConsent) return []
    return [
      toFinding({
        rule: { id: this.id, name: this.name, region: this.region, defaultSeverity: this.defaultSeverity, reference: this.reference },
        item,
        match: { match: item.text.slice(0, 80), index: 0, excerpt: item.text.slice(0, 200) },
        suggestion: '补充："You can manage cookie preferences at any time and reject non-essential trackers."',
        autoFixable: false,
      }),
    ]
  },
}

/** 收集邮箱时缺少法律基础说明 */
export const gdprNewsletterLawfulBasis: Rule = {
  id: 'eu-gdpr.newsletter.lawful-basis-missing',
  name: 'GDPR: newsletter signup without legal basis disclosure',
  region: 'EU-GDPR',
  reference,
  defaultSeverity: 'warning',
  description:
    '邮箱订阅必须附带处理目的与退订方式声明（GDPR Art. 13）。',
  appliesTo: {
    contentTypes: ['cta', 'page-copy'],
  },
  check(item, _ctx) {
    const isSignup = /(subscribe|join.*newsletter|enter your email|sign up|signup)/i.test(item.text)
    if (!isSignup) return []
    const hasBasis = /(unsubscribe|opt[- ]out|privacy policy|gdpr|legal basis|processing purpose)/i.test(item.text)
    if (hasBasis) return []
    return [
      toFinding({
        rule: { id: this.id, name: this.name, region: this.region, defaultSeverity: this.defaultSeverity, reference: this.reference },
        item,
        match: { match: item.text.slice(0, 80), index: 0, excerpt: item.text.slice(0, 200) },
        suggestion:
          '在邮箱字段附近追加："By subscribing, you agree to our Privacy Policy. You can unsubscribe at any time."',
        autoFixable: true,
      }),
    ]
  },
}

export const gdprRules: Rule[] = [gdprCookieConsentMissing, gdprNewsletterLawfulBasis]
