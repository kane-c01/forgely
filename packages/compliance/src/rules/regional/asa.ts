/**
 * 🇬🇧 ASA — Advertising Standards Authority (UK)
 *
 * CAP Code 主要：substantiation、misleading、environmental claims。
 */

import type { Rule } from '../../types.js'
import { findKeywords, toFinding } from '../../utils/pattern.js'

const reference = 'https://www.asa.org.uk/codes-and-rulings/advertising-codes.html'

/** 模糊环保宣称 */
export const asaGreenwashing: Rule = {
  id: 'uk-asa.green-claim.unspecified',
  name: 'ASA: vague environmental claim ("eco-friendly", "green") without proof',
  region: 'UK-ASA',
  reference,
  defaultSeverity: 'warning',
  description: '"eco-friendly", "sustainable", "green" 等宣称必须有可验证的具体说明。',
  appliesTo: {
    contentTypes: ['hero-headline', 'product-description', 'product-claim', 'page-copy', 'meta-description'],
  },
  check(item, _ctx) {
    const phrases = ['eco-friendly', 'eco friendly', 'sustainable', 'green', 'planet-friendly', 'carbon neutral']
    return findKeywords(item.text, phrases).map((m) =>
      toFinding({
        rule: { id: this.id, name: this.name, region: this.region, defaultSeverity: this.defaultSeverity, reference: this.reference },
        item,
        match: m,
        suggestion:
          '提供具体说明（"made from 60% recycled plastic", "carbon neutral certified by ClimatePartner"）或删除模糊词汇。',
        autoFixable: false,
      }),
    )
  },
}

export const asaRules: Rule[] = [asaGreenwashing]
