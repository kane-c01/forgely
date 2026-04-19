/**
 * 🇨🇳《中华人民共和国广告法》
 *
 * 自 2015-09-01 施行 (2018/2021 修订)。最常踩坑的是 §9：
 * 不得使用「国家级、最高级、最佳」等绝对化用语。
 *
 * 同时禁止：
 * - 与药品 / 医疗 / 保健功效混淆的食品宣称
 * - 虚假比较 / 数据
 * - 未经核实的"专家、学术机构"代言
 */

import type { Rule } from '../../types.js'
import { findKeywords, findRegex, toFinding } from '../../utils/pattern.js'

const reference = 'http://www.npc.gov.cn/wxzl/gongbao/2015-08/15/content_1942993.htm'

/** §9: 绝对化用语 */
export const cnAdAbsoluteTerms: Rule = {
  id: 'cn-advertising.absolute-terms',
  name: '广告法 §9: 禁止绝对化用语',
  region: 'CN-ADVERTISING',
  reference,
  defaultSeverity: 'critical',
  description:
    '广告法禁止使用「国家级、最高级、最佳、第一、领导品牌、领先、独家、唯一」等绝对化用语。',
  appliesTo: {
    contentTypes: [
      'hero-headline',
      'product-claim',
      'product-description',
      'page-copy',
      'meta-description',
      'meta-title',
    ],
  },
  check(item, _ctx) {
    const banned = [
      '国家级',
      '世界级',
      '最高级',
      '最佳',
      '最高',
      '最新',
      '最先进',
      '最赚钱',
      '第一品牌',
      '行业第一',
      '全国第一',
      '世界第一',
      '领导品牌',
      '领先品牌',
      '领先地位',
      '行业领导者',
      '唯一',
      '独家',
      '独有',
      '顶级',
      '顶尖',
      '极品',
      '极致',
      '终极',
      '全网最低',
      '史上最低',
      '永久免费',
    ]
    return findKeywords(item.text, banned, { wordBoundary: false }).map((m) =>
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
        suggestion: `删除「${m.match}」或替换为可量化的描述（"5,000+ 用户选择" / "2024 年新品" / "原创设计"）。`,
        autoFixable: false,
      }),
    )
  },
}

/** §16/17: 食品禁止宣称医疗效果 */
export const cnAdFoodMedicalClaim: Rule = {
  id: 'cn-advertising.food-medical-claim',
  name: '广告法 §17: 食品 / 普通商品禁止医疗用语',
  region: 'CN-ADVERTISING',
  reference,
  defaultSeverity: 'critical',
  description: '非药品 / 非医疗器械不得宣称疗效（治疗 / 治愈 / 根治 / 见效）。',
  appliesTo: {
    contentTypes: ['product-description', 'product-claim', 'hero-headline', 'page-copy'],
  },
  check(item, _ctx) {
    const re =
      /(治疗|治愈|根治|药到病除|药效|疗效|医治|包治|立竿见影).{0,40}(疾病|高血压|糖尿病|癌症|心脏病|失眠|抑郁|焦虑)/g
    return findRegex(item.text, [re]).map((m) =>
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
        suggestion: '改为体验性描述（"日常调理" / "传统配方" / "天然成分"），并删除疾病关联。',
        autoFixable: false,
      }),
    )
  },
}

/** §28: 虚假宣传——含夸大数据 */
export const cnAdFakeData: Rule = {
  id: 'cn-advertising.fake-data',
  name: '广告法 §28: 数据 / 来源未注明出处',
  region: 'CN-ADVERTISING',
  reference,
  defaultSeverity: 'warning',
  description: '使用统计数据、调查结论必须注明可验证的来源。',
  appliesTo: { contentTypes: ['hero-headline', 'product-claim', 'page-copy', 'blog'] },
  check(item, _ctx) {
    const claimsData =
      /(\d{2,}%\s?(用户|消费者|客户).{0,15}(选择|推荐|喜爱|认可)|(权威|专业|科学|临床).{0,5}(认证|验证|证实|实验))/g
    const matches = findRegex(item.text, [claimsData])
    if (matches.length === 0) return []
    const hasSource = /(数据来源|引自|参考|《[^》]+》|\d{4}\s?年.{0,10}(报告|白皮书|调查))/i.test(
      item.text,
    )
    if (hasSource) return []
    return matches.slice(0, 1).map((m) =>
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
        suggestion:
          '注明数据来源（"数据来源：XX 研究院 2024 年用户体验报告"）或换成不可量化的措辞。',
        autoFixable: false,
      }),
    )
  },
}

export const cnAdvertisingLawRules: Rule[] = [cnAdAbsoluteTerms, cnAdFoodMedicalClaim, cnAdFakeData]
