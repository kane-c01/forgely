/**
 * 品类规则：酒类 (Alcohol)
 *
 * 重点：21+ / 18+ 警告、不得面向未成年。
 */

import type { Rule } from '../../types.js'
import { findKeywords, toFinding } from '../../utils/pattern.js'

export const alcoholAgeWarning: Rule = {
  id: 'category.alcohol.age-warning-missing',
  name: 'Alcohol: missing age-of-majority warning',
  region: 'GLOBAL',
  defaultSeverity: 'critical',
  description: '酒类页面必须显示年龄限制（US: 21+, EU: 18+）+ "Drink Responsibly"。',
  appliesTo: { categories: ['alcohol'], contentTypes: ['product-description', 'page-copy', 'hero-headline'] },
  check(item, _ctx) {
    const hasAge = /(21\+|18\+|drink responsibly|of legal drinking age|minimum age)/i.test(item.text)
    if (hasAge) return []
    return [
      toFinding({
        rule: { id: this.id, name: this.name, region: this.region, defaultSeverity: this.defaultSeverity },
        item,
        match: { match: item.text.slice(0, 60), index: 0, excerpt: item.text.slice(0, 200) },
        suggestion:
          '加入："Must be 21+ to purchase. Please drink responsibly."（EU 站点改为 "18+"）。',
        autoFixable: true,
      }),
    ]
  },
}

export const alcoholHealthClaim: Rule = {
  id: 'category.alcohol.health-claim',
  name: 'Alcohol: prohibited health benefit claim',
  region: 'US-FTC',
  defaultSeverity: 'critical',
  description: 'TTB 与 FTC 禁止酒类宣称健康益处。',
  appliesTo: { categories: ['alcohol'], contentTypes: ['product-description', 'product-claim', 'page-copy'] },
  check(item, _ctx) {
    const claims = ['heart healthy', 'good for your heart', 'lowers cholesterol', 'antioxidant rich wine', 'health benefits of']
    return findKeywords(item.text, claims).map((m) =>
      toFinding({
        rule: { id: this.id, name: this.name, region: this.region, defaultSeverity: this.defaultSeverity },
        item,
        match: m,
        suggestion: '删除健康益处宣称；可改写为风味或工艺描述（"crafted with care", "smooth finish"）。',
        autoFixable: false,
      }),
    )
  },
}

export const alcoholRules: Rule[] = [alcoholAgeWarning, alcoholHealthClaim]
