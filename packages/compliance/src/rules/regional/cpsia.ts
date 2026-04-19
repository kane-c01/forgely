/**
 * 🇺🇸 CPSIA — Consumer Product Safety Improvement Act
 *
 * 12 岁以下儿童产品必须标注追踪信息 + 适用年龄。
 */

import type { Rule } from '../../types.js'
import { toFinding } from '../../utils/pattern.js'

const reference = 'https://www.cpsc.gov/Business--Manufacturing/Business-Education/Business-Guidance/CPSIA'

/** 儿童产品缺少 age range */
export const cpsiaMissingAgeLabel: Rule = {
  id: 'us-cpsia.children.missing-age-label',
  name: 'CPSIA: children product missing age range disclosure',
  region: 'US-CPSIA',
  reference,
  defaultSeverity: 'critical',
  description: '12 岁以下儿童产品必须在描述中标注适用年龄段（如 "Ages 3+"）。',
  appliesTo: {
    categories: ['children'],
    contentTypes: ['product-description', 'product-title'],
  },
  check(item, _ctx) {
    const hasAge = /(ages?\s?\d+\+|ages?\s?\d+\s?-\s?\d+|\bfor (toddlers|babies|preschoolers))/i.test(item.text)
    if (hasAge) return []
    return [
      toFinding({
        rule: { id: this.id, name: this.name, region: this.region, defaultSeverity: this.defaultSeverity, reference: this.reference },
        item,
        match: { match: item.text.slice(0, 60), index: 0, excerpt: item.text.slice(0, 200) },
        suggestion: '在描述前部添加适用年龄："Ages 3+ · Recommended for ages 3-7"。',
        autoFixable: false,
      }),
    ]
  },
}

/** 儿童产品缺少安全警告 */
export const cpsiaMissingSafetyWarning: Rule = {
  id: 'us-cpsia.children.missing-safety-warning',
  name: 'CPSIA: children product should include safety warning',
  region: 'US-CPSIA',
  reference,
  defaultSeverity: 'warning',
  description: '含小零件的儿童产品必须警示窒息风险（CHOKING HAZARD）。',
  appliesTo: {
    categories: ['children'],
    contentTypes: ['product-description'],
  },
  check(item, _ctx) {
    const mentionsSmallParts = /(small parts?|small pieces?|tiny pieces?|loose pieces?)/i.test(item.text)
    if (!mentionsSmallParts) return []
    const hasWarning = /(choking hazard|choke|not for children under 3)/i.test(item.text)
    if (hasWarning) return []
    return [
      toFinding({
        rule: { id: this.id, name: this.name, region: this.region, defaultSeverity: this.defaultSeverity, reference: this.reference },
        item,
        match: { match: 'small parts', index: 0, excerpt: item.text.slice(0, 200) },
        suggestion: '追加警告："WARNING: CHOKING HAZARD — Small parts. Not for children under 3 years."',
        autoFixable: true,
      }),
    ]
  },
}

export const cpsiaRules: Rule[] = [cpsiaMissingAgeLabel, cpsiaMissingSafetyWarning]
