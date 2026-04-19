/**
 * 品类规则：医疗器械（FDA 21 CFR + EU MDR）
 *
 * 即便消费者级别（II 类以下：体温计、血氧仪、TENS 仪），仍需明示分类 + 注册号。
 */

import type { Rule } from '../../types.js'
import { findKeywords, toFinding } from '../../utils/pattern.js'

export const medicalUnclassified: Rule = {
  id: 'category.medical-device.classification-missing',
  name: 'Medical device: missing FDA / CE classification',
  region: 'US-FDA',
  defaultSeverity: 'warning',
  description: '医疗器械产品页应披露 FDA Class（I / II / III）或 EU MDR Class（I / IIa / IIb / III）。',
  appliesTo: { categories: ['medical-device'], contentTypes: ['product-description'] },
  check(item, _ctx) {
    const hasClass = /(fda class\s?(i{1,3}|1|2|3)|class\s?(i{1,3}|1|2|3)\s?(medical device|mdr)|510\(k\)|fda registered|de novo|pma)/i.test(
      item.text,
    )
    if (hasClass) return []
    return [
      toFinding({
        rule: { id: this.id, name: this.name, region: this.region, defaultSeverity: this.defaultSeverity },
        item,
        match: { match: item.text.slice(0, 60), index: 0, excerpt: item.text.slice(0, 200) },
        suggestion: '在描述中加入分类与注册信息（"FDA Class II medical device · 510(k) cleared K123456"）。',
        autoFixable: false,
      }),
    ]
  },
}

export const medicalDiagnosticClaim: Rule = {
  id: 'category.medical-device.diagnostic-claim-overreach',
  name: 'Medical device: diagnostic claim beyond cleared indication',
  region: 'US-FDA',
  defaultSeverity: 'critical',
  description: '消费级医疗器械不得宣称诊断、监测或治疗超出 FDA-cleared 适应症。',
  appliesTo: { categories: ['medical-device'], contentTypes: ['product-description', 'product-claim'] },
  check(item, _ctx) {
    const phrases = ['diagnoses', 'detects cancer', 'predicts heart attack', 'cures sleep apnea', 'replaces your doctor']
    return findKeywords(item.text, phrases).map((m) =>
      toFinding({
        rule: { id: this.id, name: this.name, region: this.region, defaultSeverity: this.defaultSeverity },
        item,
        match: m,
        suggestion: '改为"helps you track [metric]" / "designed to support general wellness"，并标明 not a substitute for professional medical advice。',
        autoFixable: false,
      }),
    )
  },
}

export const medicalRules: Rule[] = [medicalUnclassified, medicalDiagnosticClaim]
