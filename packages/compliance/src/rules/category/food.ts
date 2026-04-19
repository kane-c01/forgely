/**
 * 品类规则：食品 (Food)
 *
 * 重点：misleading "all natural" / "organic" / "low fat" 等需有依据。
 */

import type { Rule } from '../../types.js'
import { findKeywords, toFinding } from '../../utils/pattern.js'

export const foodOrganicNotCertified: Rule = {
  id: 'category.food.organic-uncertified',
  name: 'Food: "organic" claim without certification',
  region: 'US-FDA',
  defaultSeverity: 'warning',
  description: '"Organic" 在美国受 USDA 监管，未取得认证不应使用。',
  appliesTo: { categories: ['food'], contentTypes: ['product-description', 'product-claim', 'hero-headline'] },
  check(item, _ctx) {
    const hits = findKeywords(item.text, ['organic'])
    if (hits.length === 0) return []
    const certified = /(usda organic|certified organic|usda-certified|ecocert|organic certificate)/i.test(item.text)
    if (certified) return []
    return hits.slice(0, 1).map((m) =>
      toFinding({
        rule: { id: this.id, name: this.name, region: this.region, defaultSeverity: this.defaultSeverity },
        item,
        match: m,
        suggestion: '若无 USDA Organic 认证，请改为 "naturally sourced ingredients" 或 "made with organic [specific ingredient]"。',
        autoFixable: false,
      }),
    )
  },
}

export const foodAllergenWarning: Rule = {
  id: 'category.food.allergen-warning-missing',
  name: 'Food: top-9 allergen mentioned without "contains" disclosure',
  region: 'US-FDA',
  defaultSeverity: 'warning',
  description: 'FALCPA / FASTER Act 要求标注九大过敏原。',
  appliesTo: { categories: ['food'], contentTypes: ['product-description'] },
  check(item, _ctx) {
    const allergens = ['peanut', 'tree nut', 'milk', 'egg', 'wheat', 'soy', 'fish', 'shellfish', 'sesame']
    const hits = findKeywords(item.text, allergens)
    if (hits.length === 0) return []
    const hasContains = /(contains:|allergens?:|may contain|allergen warning)/i.test(item.text)
    if (hasContains) return []
    return [
      toFinding({
        rule: { id: this.id, name: this.name, region: this.region, defaultSeverity: this.defaultSeverity },
        item,
        match: hits[0]!,
        suggestion: '在描述末尾加入："Contains: [allergens]. May contain traces of: [...]."',
        autoFixable: true,
      }),
    ]
  },
}

export const foodRules: Rule[] = [foodOrganicNotCertified, foodAllergenWarning]
