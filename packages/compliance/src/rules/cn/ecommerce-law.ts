/**
 * 🇨🇳《中华人民共和国电子商务法》
 *
 * 自 2019-01-01 施行。Forgely 平台（forgely.cn / app.forgely.cn）作为电子商务
 * 经营者必须依法公示证照、标明真实信息、保障消费者权益。
 *
 * 本文件聚焦平台对外宣传内容（apps/web 中文版）的常见违规自检。
 */

import type { Rule } from '../../types.js'
import { toFinding } from '../../utils/pattern.js'

const reference = 'http://www.npc.gov.cn/npc/c30834/201808/e398b59e7e1c426c8c98edd8de4e80a8.shtml'

/** 缺少经营者营业执照 / ICP 备案信息 */
export const cnEcomBusinessLicenseMissing: Rule = {
  id: 'cn-ecommerce.business-license-missing',
  name: '电子商务法 §15: 经营者证照信息未公示',
  region: 'CN-ECOMMERCE',
  reference,
  defaultSeverity: 'critical',
  description: '平台首页 / 关于我们 / 页脚必须显著公示营业执照、ICP 备案号、经营许可证（如适用）。',
  appliesTo: { contentTypes: ['page-copy', 'product-description'] },
  check(item, _ctx) {
    const isPolicyArea = /(关于我们|联系我们|公司信息|资质|备案|页脚|footer|imprint)/i.test(
      item.text,
    )
    if (!isPolicyArea) return []
    const hasLicense =
      /(统一社会信用代码|营业执照|工商注册号|icp\s?备[\d-]+号|京icp|沪icp|粤icp|浙icp|闽icp|川icp)/i.test(
        item.text,
      )
    if (hasLicense) return []
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
          '页脚或关于页加入：「营业执照统一社会信用代码：91xxxxxxxxxxxxxxxx · ICP 备案号：京ICP备xxxxxxxx号-1 · 食品经营许可证（如适用）」。',
        autoFixable: false,
      }),
    ]
  },
}

/** 缺少七天无理由退货说明（与 consumer-protection 互补） */
export const cnEcomReturnPolicyMissing: Rule = {
  id: 'cn-ecommerce.return-policy-missing',
  name: '电子商务法 §49 + 消费者权益保护法: 退换货说明缺失',
  region: 'CN-ECOMMERCE',
  reference,
  defaultSeverity: 'warning',
  description: '商品页 / 售后页应明示退换货时限、条件、运费承担方。',
  appliesTo: { contentTypes: ['product-description', 'page-copy'] },
  check(item, _ctx) {
    const isCommercePage = /(购买|加入购物车|立即下单|商品详情|售后|退货)/i.test(item.text)
    if (!isCommercePage) return []
    const hasPolicy = /(7\s?天无理由退换|七天无理由|退换货政策|无理由退货|售后保障|售后须知)/i.test(
      item.text,
    )
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
        suggestion:
          '加入：「自签收次日起 7 天内可无理由退货（定制 / 易腐 / 拆封后影响二次销售的商品除外），来回运费由消费者承担。」',
        autoFixable: true,
      }),
    ]
  },
}

/** 平台规则未公示 */
export const cnEcomPlatformRulesMissing: Rule = {
  id: 'cn-ecommerce.platform-rules-missing',
  name: '电子商务法 §32: 平台规则、协议未公开',
  region: 'CN-ECOMMERCE',
  reference,
  defaultSeverity: 'warning',
  description: '平台必须显著公示用户协议、服务规则、争议处理流程。',
  appliesTo: { contentTypes: ['page-copy', 'cta'] },
  check(item, _ctx) {
    const mentionsLogin = /(注册|登录|开始使用|免费试用|创建账号)/i.test(item.text)
    if (!mentionsLogin) return []
    const hasTerms = /(用户协议|服务协议|平台规则|使用条款|terms of service)/i.test(item.text)
    if (hasTerms) return []
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
          '在注册按钮附近加入：「点击「注册」即表示同意《Forgely 用户协议》和《隐私政策》」。',
        autoFixable: true,
      }),
    ]
  },
}

export const cnEcommerceLawRules: Rule[] = [
  cnEcomBusinessLicenseMissing,
  cnEcomReturnPolicyMissing,
  cnEcomPlatformRulesMissing,
]
