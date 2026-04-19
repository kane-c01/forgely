import type { Messages } from './index'

export const zhCN: Messages = {
  meta: {
    title: 'AI 时代的品牌操作系统',
    description:
      'Forgely 把任意商品链接变成一个电影级、可发货的品牌独立站 —— 由 AI 设计、由我们托管，5 分钟即可上线开卖。',
  },
  nav: {
    primary: [
      { id: 'how', label: '工作流程', href: '#how-it-works' },
      { id: 'pricing', label: '价格', href: '#pricing' },
      { id: 'showcase', label: '案例', href: '#showcase' },
      { id: 'faq', label: '常见问题', href: '#faq' },
    ],
    signIn: '登录',
    cta: '开始锻造',
    skipToContent: '跳到正文',
    openMenu: '打开菜单',
    closeMenu: '关闭菜单',
  },
  hero: {
    badge: '内测中 · 正在锻造',
    title: ['AI 时代的', '品牌操作系统。'] as const,
    subtitle:
      '从一条链接开始，锻造电影级品牌独立站。Forgely 把任何商品链接变成完整的网店 —— AI 负责设计、文案、视频、3D，我们负责托管，5 分钟即可上线开卖。',
    storePlaceholder: '粘贴你的店铺链接（可选）',
    emailPlaceholder: 'you@brand.com',
    submit: '开始锻造',
    submitting: '提交中…',
    helper: '无需信用卡。内测期间完全免费，我们绝不出售你的邮箱。',
    socialProof: '2,000+ 品牌已在内测候补名单中',
    seeHow: '看它如何运作',
    submittedTitle: '你已加入名单。',
    submittedBody: '我们正在分批邀请品牌。请留意你的收件箱 —— 锻造电影级独立站的座位即将送达。',
    submittedEyebrow: '欢迎来到锻炉',
  },
  socialProof: {
    eyebrow: 'Forgely 上正在锻造的品牌 · 内测预览',
    placeholders: [
      'TOYBLOOM',
      'KYOTO·MUJO',
      'NORTH·LINEN',
      'EMBER & ASH',
      'ATELIER 03',
      'LUMA WELLNESS',
      'ROOT & RYE',
      'PRIMA·NOVA',
      'STILL HOURS',
      'CASA VERDE',
    ] as const,
  },
  finalCta: {
    titleA: '你的品牌',
    titleB: '只差一条链接。',
    body: '粘贴一个商品链接，或描述你的想法。Forgely 会还给你一个电影级、可备货、可销售的品牌独立站 —— 通常不到 5 分钟。',
  },
  footer: {
    slogan: 'AI 时代的品牌操作系统。',
    rights: '版权所有。',
    bottomA: '为认真出货的品牌而生 · 默认深色模式。',
    bottomB: 'v0.1 · MVP · forgely.com',
    sections: {
      product: '产品',
      company: '公司',
      resources: '资源',
      legal: '法律',
    },
  },
}
