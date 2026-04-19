/**
 * 品类规则：CBD
 *
 * CBD 在美国各州法规差异巨大；联邦层面 < 0.3% THC 合法，但禁止任何健康宣称。
 */

import type { Rule } from '../../types.js'
import { findKeywords, toFinding } from '../../utils/pattern.js'

export const cbdHealthClaim: Rule = {
  id: 'category.cbd.health-claim',
  name: 'CBD: prohibited therapeutic claim',
  region: 'US-FDA',
  defaultSeverity: 'critical',
  description: 'CBD 不得宣称治疗、缓解或预防任何疾病。',
  appliesTo: { categories: ['cbd'], contentTypes: ['product-description', 'product-claim', 'page-copy', 'faq', 'blog'] },
  check(item, _ctx) {
    const claims = [
      'cures anxiety', 'treats pain', 'reduces inflammation', 'cure for', 'relieves arthritis',
      'lowers blood pressure', 'helps with depression',
    ]
    return findKeywords(item.text, claims).map((m) =>
      toFinding({
        rule: { id: this.id, name: this.name, region: this.region, defaultSeverity: this.defaultSeverity },
        item,
        match: m,
        suggestion: '改为体验性描述："may support a sense of calm", "promotes everyday wellness"。',
        autoFixable: false,
      }),
    )
  },
}

export const cbdThcDisclosure: Rule = {
  id: 'category.cbd.thc-disclosure-missing',
  name: 'CBD: must disclose THC content',
  region: 'US-FDA',
  defaultSeverity: 'warning',
  description: 'CBD 产品必须披露 THC 含量（< 0.3% 联邦合法）。',
  appliesTo: { categories: ['cbd'], contentTypes: ['product-description'] },
  check(item, _ctx) {
    const hasDisclosure = /(\b<\s?0\.3%\s?thc|thc content|0\.3 percent thc|delta-?9 thc|thc free)/i.test(item.text)
    if (hasDisclosure) return []
    return [
      toFinding({
        rule: { id: this.id, name: this.name, region: this.region, defaultSeverity: this.defaultSeverity },
        item,
        match: { match: item.text.slice(0, 60), index: 0, excerpt: item.text.slice(0, 200) },
        suggestion:
          '披露 THC 含量："Contains <0.3% Delta-9 THC by dry weight." 或 "THC-free, broad-spectrum CBD."',
        autoFixable: true,
      }),
    ]
  },
}

export const cbdRules: Rule[] = [cbdHealthClaim, cbdThcDisclosure]
