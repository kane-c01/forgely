/**
 * 🇪🇺 CE Marking
 *
 * 电子产品 / 玩具 / 个护设备销往 EU 必须在描述中提到 CE 合规。
 */

import type { Rule } from '../../types.js'
import { toFinding } from '../../utils/pattern.js'

const reference = 'https://ec.europa.eu/growth/single-market/ce-marking_en'

export const ceMarkMissing: Rule = {
  id: 'eu-ce.mark.missing',
  name: 'CE Marking: regulated category should mention CE conformity',
  region: 'EU-CE',
  reference,
  defaultSeverity: 'warning',
  description: '玩具、电子设备、医疗器械、个护类销 EU 应在描述中明示 CE 标志。',
  appliesTo: {
    categories: ['children', 'electronics', 'medical-device', 'cosmetics'],
    contentTypes: ['product-description'],
  },
  check(item, _ctx) {
    const hasCE = /\bce\b\s?(marking|mark|certified|compliant|approved)?/i.test(item.text)
    if (hasCE) return []
    return [
      toFinding({
        rule: { id: this.id, name: this.name, region: this.region, defaultSeverity: this.defaultSeverity, reference: this.reference },
        item,
        match: { match: item.text.slice(0, 80), index: 0, excerpt: item.text.slice(0, 200) },
        suggestion: '在描述中追加："CE marked · Compliant with applicable EU directives."',
        autoFixable: false,
      }),
    ]
  },
}

export const ceRules: Rule[] = [ceMarkMissing]
