/**
 * 🇺🇸 COPPA — Children's Online Privacy Protection Act
 *
 * 13 岁以下儿童相关：禁止未经家长同意的数据收集；不得设定面向儿童的促销诱因。
 */

import type { Rule } from '../../types.js'
import { findKeywords, toFinding } from '../../utils/pattern.js'

const reference = 'https://www.ftc.gov/legal-library/browse/rules/childrens-online-privacy-protection-rule-coppa'

/** 面向儿童的注册诱导文案 */
export const coppaTargetingMinors: Rule = {
  id: 'us-coppa.targeting.minors-signup',
  name: 'COPPA: avoid soliciting personal info from children',
  region: 'US-COPPA',
  reference,
  defaultSeverity: 'critical',
  description: '不得在面向 13 岁以下儿童的页面上要求邮箱、地址、电话、生日等个人信息。',
  appliesTo: {
    categories: ['children'],
    contentTypes: ['cta', 'hero-headline', 'page-copy', 'product-description', 'faq'],
  },
  check(item, _ctx) {
    const triggers = [
      'sign up for kids', 'enter your child\'s email', 'kids club signup',
      'create a kid account', 'register your child',
    ]
    return findKeywords(item.text, triggers).map((m) =>
      toFinding({
        rule: { id: this.id, name: this.name, region: this.region, defaultSeverity: this.defaultSeverity, reference: this.reference },
        item,
        match: m,
        suggestion: '改为家长引导："Parents: sign up to receive kid-friendly updates", 并加 verifiable parental consent 流程。',
        autoFixable: false,
      }),
    )
  },
}

export const coppaRules: Rule[] = [coppaTargetingMinors]
