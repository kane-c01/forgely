/**
 * 品类规则：儿童产品（与 cpsia / coppa 互补，覆盖通用场景）
 *
 * cpsia.ts 已经处理了：年龄段披露 + 小零件警告
 * 本文件补充：磁铁警告、铅含量、安全认证缺失、心理影响等。
 */

import type { Rule } from '../../types.js'
import { findKeywords, toFinding } from '../../utils/pattern.js'

export const childrenMagnetWarning: Rule = {
  id: 'category.children.magnet-hazard',
  name: 'Children: magnetic toy without ingestion warning',
  region: 'GLOBAL',
  defaultSeverity: 'critical',
  description: '含磁铁的儿童产品必须警示误吞风险（高强度磁铁吞入会致命）。',
  appliesTo: { categories: ['children'], contentTypes: ['product-description'] },
  check(item, _ctx) {
    const mentionsMagnet = /(magnet|magnetic toy|magnetic block|neodymium)/i.test(item.text)
    if (!mentionsMagnet) return []
    const hasWarning = /(do not swallow|magnet ingestion|swallowed magnets|magnets? .{0,30}swallow|magnets? .{0,30}ingest)/i.test(item.text)
    if (hasWarning) return []
    return [
      toFinding({
        rule: { id: this.id, name: this.name, region: this.region, defaultSeverity: this.defaultSeverity },
        item,
        match: { match: 'magnet', index: 0, excerpt: item.text.slice(0, 200) },
        suggestion:
          '加入："WARNING: Contains small, powerful magnets. Swallowed magnets can stick together across intestines causing serious injury or death. Seek immediate medical attention if magnets are swallowed."',
        autoFixable: true,
      }),
    ]
  },
}

export const childrenSafetyCertification: Rule = {
  id: 'category.children.safety-certification',
  name: 'Children: safety certification claim should be verifiable',
  region: 'GLOBAL',
  defaultSeverity: 'warning',
  description: '"ASTM-tested / CPSIA-certified" 等需可验证。',
  appliesTo: { categories: ['children'], contentTypes: ['product-description', 'product-claim'] },
  check(item, _ctx) {
    const claims = ['astm certified', 'cpsia certified', 'safest toy', 'medically tested']
    return findKeywords(item.text, claims).map((m) =>
      toFinding({
        rule: { id: this.id, name: this.name, region: this.region, defaultSeverity: this.defaultSeverity },
        item,
        match: m,
        suggestion: '附上证书编号或权威机构链接（"ASTM F963-17 tested by [Lab Name]"）。',
        autoFixable: false,
      }),
    )
  },
}

export const childrenRules: Rule[] = [childrenMagnetWarning, childrenSafetyCertification]
