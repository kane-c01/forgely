/**
 * 🇪🇺 DSA — Digital Services Act
 *
 * 商家身份识别 + 价格、运费、退货政策的明确披露。
 */

import type { Rule } from '../../types.js'
import { toFinding } from '../../utils/pattern.js'

const reference = 'https://commission.europa.eu/strategy-and-policy/priorities-2019-2024/europe-fit-digital-age/digital-services-act_en'

/** 商家信息缺失（trader info） */
export const dsaTraderInfoMissing: Rule = {
  id: 'eu-dsa.trader-info.missing',
  name: 'DSA: trader identity information appears to be missing',
  region: 'EU-DSA',
  reference,
  defaultSeverity: 'warning',
  description:
    '面向 EU 消费者的商品页应清晰展示卖家公司名、地址、联系方式（DSA Art. 30）。',
  appliesTo: {
    contentTypes: ['page-copy', 'product-description'],
  },
  check(item, _ctx) {
    const isPolicyPage = /(about us|contact|imprint|impressum|legal notice)/i.test(item.text)
    if (!isPolicyPage) return []
    const hasIdentity = /(registered (in|at)|company (no|number|registration)|vat|tax id|address:)/i.test(
      item.text,
    )
    if (hasIdentity) return []
    return [
      toFinding({
        rule: { id: this.id, name: this.name, region: this.region, defaultSeverity: this.defaultSeverity, reference: this.reference },
        item,
        match: { match: item.text.slice(0, 80), index: 0, excerpt: item.text.slice(0, 200) },
        suggestion: '加入完整商家信息：legal name, address, registration number, VAT, contact email & phone。',
        autoFixable: false,
      }),
    ]
  },
}

export const dsaRules: Rule[] = [dsaTraderInfoMissing]
