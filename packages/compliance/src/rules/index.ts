/**
 * 规则注册表
 *
 * 把所有 rule modules 收拢成一个全集 + 按 region/category 索引。
 */

import type { ProductCategory, Region, Rule } from '../types.js'
import { asaRules } from './regional/asa.js'
import { caslRules } from './regional/casl.js'
import { ceRules } from './regional/ce.js'
import { coppaRules } from './regional/coppa.js'
import { cpsiaRules } from './regional/cpsia.js'
import { dsaRules } from './regional/dsa.js'
import { fdaRules } from './regional/fda.js'
import { ftcRules } from './regional/ftc.js'
import { gdprRules } from './regional/gdpr.js'
import { prop65Rules } from './regional/prop65.js'
import { alcoholRules } from './category/alcohol.js'
import { cbdRules } from './category/cbd.js'
import { childrenRules } from './category/children.js'
import { cosmeticsRules } from './category/cosmetics.js'
import { electronicsRules } from './category/electronics.js'
import { foodRules } from './category/food.js'
import { medicalRules } from './category/medical.js'
import { supplementsRules } from './category/supplements.js'
import { generalRules } from './general.js'

/** 全部内置规则 */
export const ALL_RULES: Rule[] = [
  ...ftcRules,
  ...fdaRules,
  ...coppaRules,
  ...cpsiaRules,
  ...prop65Rules,
  ...gdprRules,
  ...dsaRules,
  ...ceRules,
  ...asaRules,
  ...caslRules,
  ...supplementsRules,
  ...cosmeticsRules,
  ...foodRules,
  ...alcoholRules,
  ...cbdRules,
  ...childrenRules,
  ...medicalRules,
  ...electronicsRules,
  ...generalRules,
]

const RULES_BY_ID: ReadonlyMap<string, Rule> = new Map(ALL_RULES.map((r) => [r.id, r]))

export function getRuleById(id: string): Rule | undefined {
  return RULES_BY_ID.get(id)
}

/** 按地域筛选规则（GLOBAL 总是包含） */
export function getRulesByRegion(regions: readonly Region[]): Rule[] {
  return ALL_RULES.filter((r) => r.region === 'GLOBAL' || regions.includes(r.region))
}

/** 按品类筛选规则 */
export function getRulesByCategory(category: ProductCategory): Rule[] {
  return ALL_RULES.filter(
    (r) => !r.appliesTo.categories || r.appliesTo.categories.length === 0 || r.appliesTo.categories.includes(category),
  )
}

/** 同时按 region + category 筛选（最常用） */
export function selectRules(args: { regions: readonly Region[]; category: ProductCategory }): Rule[] {
  return ALL_RULES.filter((r) => {
    const regionOk = r.region === 'GLOBAL' || args.regions.includes(r.region)
    const categoryOk =
      !r.appliesTo.categories || r.appliesTo.categories.length === 0 || r.appliesTo.categories.includes(args.category)
    return regionOk && categoryOk
  })
}
