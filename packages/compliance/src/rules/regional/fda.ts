/**
 * 🇺🇸 FDA — Food and Drug Administration
 *
 * 涵盖膳食补充剂（DSHEA）+ 化妆品（FD&C Act）+ 医疗器械（21 CFR）
 */

import type { Rule } from '../../types.js'
import { findKeywords, findRegex, toFinding } from '../../utils/pattern.js'

const reference = 'https://www.fda.gov/food/dietary-supplements'

/** 保健品宣称疾病治疗 */
export const fdaTreatCurePrevent: Rule = {
  id: 'us-fda.health-claim.treat-cure-prevent',
  name: 'FDA: supplement claims to "treat / cure / prevent" disease',
  region: 'US-FDA',
  reference,
  defaultSeverity: 'critical',
  description:
    '保健品/食品宣称可"treat/cure/prevent/diagnose"任何疾病违反 FD&C Act §201(g)，会被认定为未批准的药品。',
  appliesTo: {
    categories: ['supplements', 'food', 'cosmetics', 'cbd'],
    contentTypes: ['product-claim', 'product-description', 'page-copy', 'hero-headline', 'faq', 'blog'],
  },
  check(item, _ctx) {
    const verbs = ['treat', 'cure', 'prevent', 'heal', 'remedy', 'diagnose', 'mitigate']
    const diseases = [
      'cancer', 'diabetes', 'alzheimer', 'covid', 'flu', 'depression', 'anxiety',
      'arthritis', 'heart disease', 'high blood pressure', 'hypertension', 'asthma',
    ]
    const findings: ReturnType<Rule['check']> = []
    for (const v of verbs) {
      for (const d of diseases) {
        const re = new RegExp(`\\b${v}s?\\b[^.]{0,80}?\\b${d}\\b`, 'gi')
        for (const m of findRegex(item.text, [re])) {
          findings.push(
            toFinding({
              rule: { id: this.id, name: this.name, region: this.region, defaultSeverity: this.defaultSeverity, reference: this.reference },
              item,
              match: m,
              suggestion: `改为结构-功能性表述（"supports a healthy immune response"），并附 FDA 免责声明。`,
              autoFixable: false,
              reason: `检测到 "${v}…${d}" 的疾病宣称`,
            }),
          )
        }
      }
    }
    return findings
  },
}

/** 缺少 FDA Disclaimer */
export const fdaMissingDisclaimer: Rule = {
  id: 'us-fda.disclaimer.missing',
  name: 'FDA Disclaimer required for dietary supplement claims',
  region: 'US-FDA',
  reference: 'https://www.fda.gov/food/dietary-supplements/structure-function-claims',
  defaultSeverity: 'critical',
  description:
    '所有 structure/function 宣称必须随附法定 FDA Disclaimer。',
  appliesTo: {
    categories: ['supplements', 'cbd'],
    contentTypes: ['product-description', 'product-claim'],
  },
  check(item, _ctx) {
    const hasClaim = /(supports?|promotes?|maintains?|helps?)\b/i.test(item.text)
    if (!hasClaim) return []
    const hasDisclaimer = /these statements have not been evaluated by the (food and drug administration|fda)/i.test(
      item.text,
    )
    if (hasDisclaimer) return []
    return [
      toFinding({
        rule: { id: this.id, name: this.name, region: this.region, defaultSeverity: this.defaultSeverity, reference: this.reference },
        item,
        match: { match: item.text.slice(0, 60), index: 0, excerpt: item.text.slice(0, 200) },
        suggestion:
          '在产品描述末尾追加："*These statements have not been evaluated by the Food and Drug Administration. This product is not intended to diagnose, treat, cure, or prevent any disease."',
        autoFixable: true,
      }),
    ]
  },
}

/** 化妆品声称"医美"功能 */
export const fdaCosmeticDrugClaims: Rule = {
  id: 'us-fda.cosmetic.drug-claim',
  name: 'FDA Cosmetics: avoid drug-level claims',
  region: 'US-FDA',
  reference: 'https://www.fda.gov/cosmetics/cosmetics-laws-regulations/it-cosmetic-drug-or-both-or-it-soap',
  defaultSeverity: 'critical',
  description:
    '化妆品若宣称"removes wrinkles / reverses aging / regenerates skin"会被归为药品，需 FDA 批准。',
  appliesTo: {
    categories: ['cosmetics'],
    contentTypes: ['product-description', 'product-claim', 'hero-headline'],
  },
  check(item, _ctx) {
    const drugClaims = [
      'reverses aging', 'removes wrinkles', 'regenerates skin', 'cures acne',
      'eliminates cellulite', 'permanent hair removal', 'lightens skin permanently',
    ]
    return findKeywords(item.text, drugClaims).map((m) =>
      toFinding({
        rule: { id: this.id, name: this.name, region: this.region, defaultSeverity: this.defaultSeverity, reference: this.reference },
        item,
        match: m,
        suggestion: '改为外观性宣称："the appearance of fine lines is reduced", "skin looks more youthful"。',
        autoFixable: false,
      }),
    )
  },
}

export const fdaRules: Rule[] = [fdaTreatCurePrevent, fdaMissingDisclaimer, fdaCosmeticDrugClaims]
