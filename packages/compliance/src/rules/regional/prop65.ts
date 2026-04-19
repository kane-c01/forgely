/**
 * 🇺🇸 California Proposition 65
 *
 * 含化学物质（如 BPA、Lead、Phthalates）的产品销往加州必须显著警告。
 */

import type { Rule } from '../../types.js'
import { findKeywords, toFinding } from '../../utils/pattern.js'

const reference = 'https://oehha.ca.gov/proposition-65'

const PROP65_CHEMICALS = [
  'lead', 'cadmium', 'mercury', 'bpa', 'bisphenol-a', 'phthalate', 'phthalates',
  'arsenic', 'formaldehyde', 'acrylamide', 'ddt',
] as const

/** 检测到 Prop65 化学物质但缺少警告 */
export const prop65MissingWarning: Rule = {
  id: 'us-ca-prop65.warning.missing',
  name: 'California Prop 65: chemical detected without required warning',
  region: 'US-CA-PROP65',
  reference,
  defaultSeverity: 'critical',
  description: '产品成分中含 Prop 65 物质必须显著标注警告。',
  appliesTo: {
    categories: ['cosmetics', 'children', 'food', 'electronics', 'general'],
    contentTypes: ['product-description', 'product-claim'],
  },
  check(item, _ctx) {
    const hits = findKeywords(item.text, PROP65_CHEMICALS as unknown as string[])
    if (hits.length === 0) return []
    const hasWarning = /prop(osition)?\s?65|known to the state of california/i.test(item.text)
    if (hasWarning) return []
    return hits.slice(0, 1).map((m) =>
      toFinding({
        rule: { id: this.id, name: this.name, region: this.region, defaultSeverity: this.defaultSeverity, reference: this.reference },
        item,
        match: m,
        suggestion:
          '加上 Prop 65 警告："WARNING: This product can expose you to chemicals including [chemical], which is known to the State of California to cause [cancer / birth defects]. For more information go to www.P65Warnings.ca.gov."',
        autoFixable: true,
      }),
    )
  },
}

export const prop65Rules: Rule[] = [prop65MissingWarning]
