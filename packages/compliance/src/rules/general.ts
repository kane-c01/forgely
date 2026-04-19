/**
 * 通用违规规则 (适用所有品类 / 所有地域)
 *
 * MASTER.md 15.2 通用违规清单：夸大、无依据、不可履行承诺、竞品贬损。
 */

import type { Rule } from '../types.js'
import { findKeywords, findRegex, toFinding } from '../utils/pattern.js'

/** 100% / no side effect 类夸大 */
export const generalExaggeration: Rule = {
  id: 'general.exaggeration.absolute',
  name: 'General: absolute / unverifiable superlatives',
  region: 'GLOBAL',
  defaultSeverity: 'warning',
  description: '"100% guaranteed", "no side effects", "completely safe" 等绝对化宣称。',
  appliesTo: {
    contentTypes: ['product-description', 'product-claim', 'hero-headline', 'page-copy', 'meta-description'],
  },
  check(item, _ctx) {
    const phrases = [
      '100% safe', '100% effective', '100% guaranteed', 'no side effects', 'zero side effects',
      'completely safe', 'absolutely safe', 'works for everyone', 'guaranteed to work',
    ]
    return findKeywords(item.text, phrases).map((m) =>
      toFinding({
        rule: { id: this.id, name: this.name, region: this.region, defaultSeverity: this.defaultSeverity },
        item,
        match: m,
        suggestion:
          '替换为可验证表述："formulated for sensitive skin", "loved by 95% of testers in our study (n=200)"。',
        autoFixable: false,
      }),
    )
  },
}

/** 无依据的"医生推荐 / 科学证明" */
export const generalUnverifiedAuthority: Rule = {
  id: 'general.unverified.authority-claim',
  name: 'General: unverified authority / endorsement claim',
  region: 'GLOBAL',
  defaultSeverity: 'warning',
  description: '"doctor recommended", "scientifically proven", "clinically proven" 必须有可链接的依据。',
  appliesTo: {
    contentTypes: ['product-description', 'product-claim', 'hero-headline', 'page-copy'],
  },
  check(item, _ctx) {
    const phrases = ['doctor recommended', 'scientifically proven', 'clinically proven', 'experts agree', 'dermatologist tested']
    return findKeywords(item.text, phrases).map((m) =>
      toFinding({
        rule: { id: this.id, name: this.name, region: this.region, defaultSeverity: this.defaultSeverity },
        item,
        match: m,
        suggestion: '附上参考链接（"in a 2024 study by [University] (link)"）或换成不暗示权威的措辞。',
        autoFixable: false,
      }),
    )
  },
}

/** 不可履行承诺 */
export const generalUnfulfillablePromise: Rule = {
  id: 'general.promise.unfulfillable',
  name: 'General: unfulfillable promises',
  region: 'GLOBAL',
  defaultSeverity: 'warning',
  description: '"lifetime warranty", "permanent results", "instant cure" 在缺乏支持时风险极高。',
  appliesTo: {
    contentTypes: ['product-description', 'product-claim', 'hero-headline', 'page-copy'],
  },
  check(item, _ctx) {
    const phrases = ['lifetime warranty', 'lifetime guarantee', 'permanent results', 'instant cure', 'overnight cure']
    return findKeywords(item.text, phrases).map((m) =>
      toFinding({
        rule: { id: this.id, name: this.name, region: this.region, defaultSeverity: this.defaultSeverity },
        item,
        match: m,
        suggestion: '改为有时间界定的承诺：例如 "10-year warranty"、"long-lasting results"。',
        autoFixable: false,
      }),
    )
  },
}

/** 竞品贬损（直接点名） */
export const generalDisparagement: Rule = {
  id: 'general.disparagement.competitor',
  name: 'General: explicit competitor disparagement',
  region: 'GLOBAL',
  defaultSeverity: 'warning',
  description: '直接点名竞品并贬损。',
  appliesTo: {
    contentTypes: ['product-description', 'product-claim', 'hero-headline', 'page-copy', 'blog'],
  },
  check(item, _ctx) {
    const re = /\b(unlike|better than|kicks?(?:'s)? ass\b|destroys?|crushes?)\s+(?:the\s+)?[a-z][a-z0-9'\- ]{1,30}?(?:'s)?\s+(?:product|brand|version|alternative)\b/gi
    return findRegex(item.text, [re]).map((m) =>
      toFinding({
        rule: { id: this.id, name: this.name, region: this.region, defaultSeverity: this.defaultSeverity },
        item,
        match: m,
        suggestion: '改为正向差异化（"crafted for performance and reliability"）；不要直接点名竞品。',
        autoFixable: false,
      }),
    )
  },
}

export const generalRules: Rule[] = [
  generalExaggeration,
  generalUnverifiedAuthority,
  generalUnfulfillablePromise,
  generalDisparagement,
]
