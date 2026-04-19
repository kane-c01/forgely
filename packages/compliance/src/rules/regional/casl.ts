/**
 * 🇨🇦 CASL — Canadian Anti-Spam Legislation
 *
 * 营销邮件必须含: 发件人身份、退订机制、明确同意。
 */

import type { Rule } from '../../types.js'
import { toFinding } from '../../utils/pattern.js'

const reference = 'https://crtc.gc.ca/eng/internet/anti.htm'

export const caslOptInLanguage: Rule = {
  id: 'ca-casl.optin.language-missing',
  name: 'CASL: marketing signup must include sender identity & unsubscribe',
  region: 'CA-CASL',
  reference,
  defaultSeverity: 'warning',
  description: '面向加拿大用户的邮件订阅 CTA 必须显示发送者公司名 + 退订选项。',
  appliesTo: { contentTypes: ['cta', 'page-copy'] },
  check(item, _ctx) {
    const isSignup = /(subscribe|join|sign up|signup).{0,80}(newsletter|email|updates)/i.test(item.text)
    if (!isSignup) return []
    const hasUnsub = /(unsubscribe|opt[- ]out|no more emails)/i.test(item.text)
    if (hasUnsub) return []
    return [
      toFinding({
        rule: { id: this.id, name: this.name, region: this.region, defaultSeverity: this.defaultSeverity, reference: this.reference },
        item,
        match: { match: item.text.slice(0, 80), index: 0, excerpt: item.text.slice(0, 200) },
        suggestion:
          '在订阅 CTA 附近追加："You can unsubscribe at any time. Sent by [Brand Name], [Address]."',
        autoFixable: true,
      }),
    ]
  },
}

export const caslRules: Rule[] = [caslOptInLanguage]
