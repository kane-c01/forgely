/**
 * 🇺🇸 FTC — Federal Trade Commission Act § 5
 * 不公平或欺骗性广告 + Endorsement Guides
 */

import type { Rule } from '../../types.js'
import { findKeywords, toFinding } from '../../utils/pattern.js'

const meta = {
  region: 'US-FTC' as const,
  reference: 'https://www.ftc.gov/business-guidance/advertising-marketing',
}

/** 未经背书披露的"专家推荐 / 名人推荐" */
export const ftcEndorsementDisclosure: Rule = {
  id: 'us-ftc.endorsement.no-disclosure',
  name: 'FTC Endorsement: missing material connection disclosure',
  region: meta.region,
  reference: meta.reference,
  defaultSeverity: 'critical',
  description:
    '出现"sponsored / partner / influencer"等表述时必须明确披露物质关系，否则违反 FTC Endorsement Guides。',
  appliesTo: { contentTypes: ['product-description', 'page-copy', 'blog', 'hero-headline'] },
  check(item, _ctx) {
    const triggers = ['as seen on', 'recommended by influencers', 'celebrities love', 'sponsored content']
    const matches = findKeywords(item.text, triggers)
    return matches.map((m) =>
      toFinding({
        rule: { id: this.id, name: this.name, region: this.region, defaultSeverity: this.defaultSeverity, reference: this.reference },
        item,
        match: m,
        suggestion:
          '在该段落附近添加显著披露："Disclosure: this is a paid partnership / sponsored content."',
        autoFixable: false,
        reason: 'Endorsement Guides 16 CFR § 255 要求显著、清晰披露',
      }),
    )
  },
}

/** "免费 / free" 但带条件 */
export const ftcFreeWithConditions: Rule = {
  id: 'us-ftc.deceptive.free-with-conditions',
  name: 'FTC Deceptive: "FREE" used with hidden conditions',
  region: meta.region,
  reference: 'https://www.ftc.gov/legal-library/browse/rules/use-word-free-and-similar-representations',
  defaultSeverity: 'warning',
  description:
    '使用"FREE"必须紧邻披露所有条件（购买义务、运费、订阅）。',
  appliesTo: { contentTypes: ['hero-headline', 'cta', 'product-description', 'page-copy'] },
  check(item, _ctx) {
    const matches = findKeywords(item.text, ['free shipping', 'get it free', 'free trial', 'free gift'])
    if (matches.length === 0) return []
    const hasDisclosure = /(\$|usd|terms apply|conditions|with purchase|when you|after \d+ days)/i.test(item.text)
    if (hasDisclosure) return []
    return matches.map((m) =>
      toFinding({
        rule: { id: this.id, name: this.name, region: this.region, defaultSeverity: this.defaultSeverity, reference: this.reference },
        item,
        match: m,
        suggestion: '紧随 "FREE" 之后披露所有适用条件（如 "Free shipping on orders over $50"）。',
        autoFixable: false,
      }),
    )
  },
}

/** 缺乏证据的对比性宣称 */
export const ftcUnsubstantiatedClaim: Rule = {
  id: 'us-ftc.substantiation.unsupported-superlative',
  name: 'FTC Substantiation: superlative or comparative claim without proof',
  region: meta.region,
  reference: meta.reference,
  defaultSeverity: 'warning',
  description: '"#1", "best", "top-rated"等宣称必须有可验证的支撑数据。',
  appliesTo: { contentTypes: ['product-claim', 'product-description', 'hero-headline', 'page-copy', 'meta-description'] },
  check(item, _ctx) {
    const phrases = ['#1 best', 'world\'s best', 'best in the world', 'highest rated', 'top rated', 'no.1']
    return findKeywords(item.text, phrases).map((m) =>
      toFinding({
        rule: { id: this.id, name: this.name, region: this.region, defaultSeverity: this.defaultSeverity, reference: this.reference },
        item,
        match: m,
        suggestion:
          '添加可验证支撑（如 "Voted #1 by [source, year]"），或改为不可验证范围之外的措辞（"loved by 50,000+ customers"）。',
        autoFixable: false,
      }),
    )
  },
}

/** Made in USA 滥用 */
export const ftcMadeInUsa: Rule = {
  id: 'us-ftc.origin.made-in-usa',
  name: 'FTC Made in USA Standard',
  region: meta.region,
  reference: 'https://www.ftc.gov/business-guidance/resources/complying-made-usa-standard',
  defaultSeverity: 'critical',
  description:
    '"Made in USA"要求所有或几乎所有部件、加工均在美国境内完成；否则需限定"Assembled in USA"。',
  appliesTo: { contentTypes: ['product-description', 'product-claim', 'page-copy'] },
  check(item, _ctx) {
    return findKeywords(item.text, ['made in usa', 'made in america', '100% american made']).map((m) =>
      toFinding({
        rule: { id: this.id, name: this.name, region: this.region, defaultSeverity: this.defaultSeverity, reference: this.reference },
        item,
        match: m,
        suggestion:
          '若并非"all or virtually all"美国制造，请改写为 "Assembled in USA from imported parts" 或 "Designed in USA"。',
        autoFixable: false,
      }),
    )
  },
}

export const ftcRules: Rule[] = [
  ftcEndorsementDisclosure,
  ftcFreeWithConditions,
  ftcUnsubstantiatedClaim,
  ftcMadeInUsa,
]
