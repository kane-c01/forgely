/**
 * 品类规则：化妆品 (Cosmetics)
 *
 * 重点：成分透明、不可宣称医疗功能（与 fda.cosmeticDrugClaims 互补，关注皮肤过敏免责）。
 */

import type { Rule } from '../../types.js'
import { findKeywords, toFinding } from '../../utils/pattern.js'

export const cosmeticsAllergyDisclosure: Rule = {
  id: 'category.cosmetics.allergy-test',
  name: 'Cosmetics: should advise patch test before first use',
  region: 'GLOBAL',
  defaultSeverity: 'warning',
  description: '化妆品应建议过敏 patch test。',
  appliesTo: { categories: ['cosmetics'], contentTypes: ['product-description'] },
  check(item, _ctx) {
    const hasPatch = /(patch test|allerg|sensitivity test|test on a small area)/i.test(item.text)
    if (hasPatch) return []
    return [
      toFinding({
        rule: { id: this.id, name: this.name, region: this.region, defaultSeverity: this.defaultSeverity },
        item,
        match: { match: item.text.slice(0, 60), index: 0, excerpt: item.text.slice(0, 200) },
        suggestion:
          '加入："Patch test before first use. Discontinue use if irritation occurs."',
        autoFixable: true,
      }),
    ]
  },
}

export const cosmeticsForbiddenIngredients: Rule = {
  id: 'category.cosmetics.eu-forbidden-ingredient',
  name: 'Cosmetics: ingredient banned in EU',
  region: 'EU-CE',
  defaultSeverity: 'critical',
  description: 'EU Cosmetics Regulation Annex II 禁用成分（节选）。',
  appliesTo: { categories: ['cosmetics'], contentTypes: ['product-description', 'product-claim'] },
  check(item, _ctx) {
    const banned = ['hydroquinone', 'tribromsalan', 'mercury', 'lead acetate', 'methylene chloride']
    return findKeywords(item.text, banned).map((m) =>
      toFinding({
        rule: { id: this.id, name: this.name, region: this.region, defaultSeverity: this.defaultSeverity },
        item,
        match: m,
        suggestion: `"${m.match}" 在 EU 化妆品中被禁，请核实成分表或仅在非 EU 站点上架。`,
        autoFixable: false,
      }),
    )
  },
}

export const cosmeticsRules: Rule[] = [cosmeticsAllergyDisclosure, cosmeticsForbiddenIngredients]
