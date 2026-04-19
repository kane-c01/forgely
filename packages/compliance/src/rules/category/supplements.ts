/**
 * 品类规则：保健品 (Dietary Supplements)
 *
 * 与 FDA 规则互补：本文件聚焦"建议性"提醒（剂量、变更、孕妇/儿童禁忌等）。
 */

import type { Rule } from '../../types.js'
import { findKeywords, toFinding } from '../../utils/pattern.js'

export const supplementsConsultDoctorMissing: Rule = {
  id: 'category.supplements.consult-doctor',
  name: 'Supplements: should advise consulting a healthcare provider',
  region: 'GLOBAL',
  defaultSeverity: 'warning',
  description: '保健品建议加上"如孕期/服药/有基础病请咨询医生"。',
  appliesTo: { categories: ['supplements', 'cbd'], contentTypes: ['product-description'] },
  check(item, _ctx) {
    const hasAdvice = /(consult.{0,15}(doctor|physician|healthcare|provider)|pregnant.{0,30}consult|under medical supervision)/i.test(
      item.text,
    )
    if (hasAdvice) return []
    return [
      toFinding({
        rule: { id: this.id, name: this.name, region: this.region, defaultSeverity: this.defaultSeverity },
        item,
        match: { match: item.text.slice(0, 60), index: 0, excerpt: item.text.slice(0, 200) },
        suggestion:
          '加入："Consult your healthcare provider before use, especially if pregnant, nursing, or taking medication."',
        autoFixable: true,
      }),
    ]
  },
}

export const supplementsBannedSubstances: Rule = {
  id: 'category.supplements.banned-substance',
  name: 'Supplements: contains substance flagged by FDA tainted-product list',
  region: 'US-FDA',
  defaultSeverity: 'critical',
  description: '检测到 FDA "Tainted Products"清单中的成分。',
  appliesTo: { categories: ['supplements'], contentTypes: ['product-description', 'product-claim'] },
  check(item, _ctx) {
    const banned = ['ephedra', 'sibutramine', 'dmaa', 'dnp', 'yohimbine hcl', 'phenolphthalein']
    return findKeywords(item.text, banned).map((m) =>
      toFinding({
        rule: { id: this.id, name: this.name, region: this.region, defaultSeverity: this.defaultSeverity },
        item,
        match: m,
        suggestion: `成分 "${m.match}" 在美国可能被禁。请核实并替换或下架该 SKU。`,
        autoFixable: false,
      }),
    )
  },
}

export const supplementsRules: Rule[] = [supplementsConsultDoctorMissing, supplementsBannedSubstances]
