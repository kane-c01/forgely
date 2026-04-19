/**
 * 🇨🇳《中华人民共和国消费者权益保护法》
 *
 * 自 1994 施行，2013 修订引入"7 天无理由退货"、"网络交易消费者权益"等条款。
 *
 * 重点检查：
 * - 7 天无理由退货说明
 * - 经营者真实身份信息
 * - 公平交易（不强制搭售）
 * - 个人信息保护承诺
 */

import type { Rule } from '../../types.js'
import { findKeywords, toFinding } from '../../utils/pattern.js'

const reference = 'http://www.npc.gov.cn/zgrdw/npc/xinwen/2013-10/26/content_1811502.htm'

/** §25: 7 天无理由 */
export const cnConsumerSevenDayReturn: Rule = {
  id: 'cn-consumer.seven-day-no-reason-return',
  name: '消费者权益保护法 §25: 7 天无理由退货说明缺失',
  region: 'CN-CONSUMER',
  reference,
  defaultSeverity: 'warning',
  description: '网络销售商品须明示 7 天无理由退货政策（定制 / 鲜活 / 数字化等除外）。',
  appliesTo: { contentTypes: ['product-description', 'page-copy'] },
  check(item, _ctx) {
    const isProduct = /(立即购买|加入购物车|限时.{0,5}抢购|商品详情|售后)/i.test(item.text)
    if (!isProduct) return []
    const hasPolicy = /(7\s?天无理由|七天无理由|无理由退货|7 days no[- ]reason)/i.test(item.text)
    if (hasPolicy) return []
    return [
      toFinding({
        rule: {
          id: this.id,
          name: this.name,
          region: this.region,
          defaultSeverity: this.defaultSeverity,
          reference: this.reference,
        },
        item,
        match: { match: item.text.slice(0, 60), index: 0, excerpt: item.text.slice(0, 200) },
        suggestion: '加入：「支持 7 天无理由退货（定制 / 鲜活易腐 / 数字化商品 / 报刊除外）」。',
        autoFixable: true,
      }),
    ]
  },
}

/** §28: 强制搭售 */
export const cnConsumerForcedBundling: Rule = {
  id: 'cn-consumer.forced-bundling',
  name: '消费者权益保护法 §28: 禁止强制搭售',
  region: 'CN-CONSUMER',
  reference,
  defaultSeverity: 'critical',
  description: '不得用「默认勾选」「必须购买」等方式强制搭售。',
  appliesTo: { contentTypes: ['cta', 'page-copy'] },
  check(item, _ctx) {
    const phrases = ['默认勾选', '必须购买', '强制搭售', '默认开通', '默认订阅', '默认续费']
    return findKeywords(item.text, phrases, { wordBoundary: false }).map((m) =>
      toFinding({
        rule: {
          id: this.id,
          name: this.name,
          region: this.region,
          defaultSeverity: this.defaultSeverity,
          reference: this.reference,
        },
        item,
        match: m,
        suggestion: '关闭默认勾选，改为用户主动选择，并显著提示价格 / 周期。',
        autoFixable: false,
      }),
    )
  },
}

/** §29: 个人信息收集说明 */
export const cnConsumerPrivacyDisclosure: Rule = {
  id: 'cn-consumer.privacy-disclosure-missing',
  name: '消费者权益保护法 §29: 收集个人信息须明示',
  region: 'CN-CONSUMER',
  reference,
  defaultSeverity: 'warning',
  description: '收集个人信息须明示目的、方式、范围，并经消费者同意。',
  appliesTo: { contentTypes: ['cta', 'page-copy'] },
  check(item, _ctx) {
    const collects = /(手机号|身份证|联系方式|地址.{0,5}信息|实名)/i.test(item.text)
    if (!collects) return []
    const hasDisclosure =
      /(收集.{0,10}目的|使用.{0,10}范围|授权.{0,10}使用|《隐私政策》|个人信息处理说明)/i.test(
        item.text,
      )
    if (hasDisclosure) return []
    return [
      toFinding({
        rule: {
          id: this.id,
          name: this.name,
          region: this.region,
          defaultSeverity: this.defaultSeverity,
          reference: this.reference,
        },
        item,
        match: { match: item.text.slice(0, 60), index: 0, excerpt: item.text.slice(0, 200) },
        suggestion:
          '在收集字段下方加入说明："我们仅在订单履约和售后服务范围内使用您的联系方式，详见《隐私政策》。"',
        autoFixable: true,
      }),
    ]
  },
}

export const cnConsumerProtectionRules: Rule[] = [
  cnConsumerSevenDayReturn,
  cnConsumerForcedBundling,
  cnConsumerPrivacyDisclosure,
]
