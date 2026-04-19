/**
 * 品类规则：电子产品
 *
 * - FCC Part 15 标识（无线电干扰）
 * - 锂电池运输警告 + 充电安全
 * - WEEE 标识（EU 电子废弃物）
 */

import type { Rule } from '../../types.js'
import { toFinding } from '../../utils/pattern.js'

export const electronicsFccDisclosure: Rule = {
  id: 'category.electronics.fcc-disclosure-missing',
  name: 'Electronics: missing FCC Part 15 disclosure',
  region: 'US-FTC',
  defaultSeverity: 'warning',
  description: '含无线模块（Wi-Fi / BT / RF）的电子产品在美国销售必须含 FCC Part 15 声明。',
  appliesTo: { categories: ['electronics'], contentTypes: ['product-description'] },
  check(item, _ctx) {
    const hasWireless = /(wi[- ]?fi|bluetooth|wireless|rf|nfc|zigbee|z[- ]wave)/i.test(item.text)
    if (!hasWireless) return []
    const hasFcc = /(fcc id|fcc part 15|fcc compliant|fcc declaration)/i.test(item.text)
    if (hasFcc) return []
    return [
      toFinding({
        rule: { id: this.id, name: this.name, region: this.region, defaultSeverity: this.defaultSeverity },
        item,
        match: { match: 'wireless', index: 0, excerpt: item.text.slice(0, 200) },
        suggestion:
          '在描述中加入："This device complies with Part 15 of the FCC Rules. FCC ID: [your-fcc-id]."',
        autoFixable: false,
      }),
    ]
  },
}

export const electronicsLithiumWarning: Rule = {
  id: 'category.electronics.lithium-battery-warning',
  name: 'Electronics: lithium battery shipping & safety warning missing',
  region: 'GLOBAL',
  defaultSeverity: 'warning',
  description: '含锂电池产品须警告短路 / 高温 / 错误充电风险。',
  appliesTo: { categories: ['electronics'], contentTypes: ['product-description'] },
  check(item, _ctx) {
    const hasLithium = /(li[- ]?ion|lithium|li[- ]?po|battery cell|rechargeable battery)/i.test(item.text)
    if (!hasLithium) return []
    const hasWarning = /(do not puncture|do not expose to fire|use only the supplied charger|safety warning.*battery)/i.test(
      item.text,
    )
    if (hasWarning) return []
    return [
      toFinding({
        rule: { id: this.id, name: this.name, region: this.region, defaultSeverity: this.defaultSeverity },
        item,
        match: { match: 'battery', index: 0, excerpt: item.text.slice(0, 200) },
        suggestion:
          '加入锂电池安全提醒："WARNING: Do not puncture, crush, or expose battery to fire or temperatures above 60°C / 140°F. Charge using only the supplied charger."',
        autoFixable: true,
      }),
    ]
  },
}

export const electronicsWeeeMissing: Rule = {
  id: 'category.electronics.weee-missing',
  name: 'Electronics: missing WEEE / e-waste disposal note (EU)',
  region: 'EU-CE',
  defaultSeverity: 'info',
  description: 'EU WEEE 指令建议在描述中说明分类回收。',
  appliesTo: { categories: ['electronics'], contentTypes: ['product-description'] },
  check(item, _ctx) {
    const hasWeee = /(weee|do not dispose with household|e[- ]waste recycling)/i.test(item.text)
    if (hasWeee) return []
    return [
      toFinding({
        rule: { id: this.id, name: this.name, region: this.region, defaultSeverity: this.defaultSeverity },
        item,
        match: { match: item.text.slice(0, 60), index: 0, excerpt: item.text.slice(0, 200) },
        suggestion: '加入："Do not dispose of with household waste. Recycle responsibly per local WEEE regulations."',
        autoFixable: true,
      }),
    ]
  },
}

export const electronicsRules: Rule[] = [electronicsFccDisclosure, electronicsLithiumWarning, electronicsWeeeMissing]
