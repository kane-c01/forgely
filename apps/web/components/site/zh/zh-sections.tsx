/**
 * Chinese-locale page sections for `/zh`.
 * Pure presentational, no client interactivity (Pricing/Faq stay
 * SSR-only here for simplicity — the English `/` keeps the richer
 * interactive widgets).
 */

import Link from 'next/link'
import { Aperture, ArrowDownRight, Check, Cpu, Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { buttonClasses } from '@/components/ui/button'
import { cn } from '@/lib/cn'

function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'left',
  id,
}: {
  eyebrow: string
  title: React.ReactNode
  description?: React.ReactNode
  align?: 'left' | 'center'
  id?: string
}) {
  return (
    <div
      className={cn(
        'flex max-w-3xl flex-col gap-4',
        align === 'center' ? 'mx-auto items-center text-center' : 'items-start',
      )}
    >
      <span className="text-caption text-forge-orange font-mono uppercase tracking-[0.22em]">
        {eyebrow}
      </span>
      <h2 id={id} className="font-display text-h1 text-text-primary font-light">
        {title}
      </h2>
      {description ? <p className="text-body-lg text-text-secondary">{description}</p> : null}
    </div>
  )
}

/* ───── How it works (5 steps) ───── */
const STEPS = [
  {
    n: '01',
    title: '粘贴一条链接，或描述一个想法',
    body: '支持 Shopify、WooCommerce、Etsy、Amazon、Aliexpress、1688、天猫等。Forgely 会抓取商品、截图、文案与价格，全部自动结构化。',
    duration: '约 10 秒',
  },
  {
    n: '02',
    title: 'Forgely 当起导演',
    body: 'Analyzer / Director / Planner / Copywriter / Artist / Compliance 多 Agent 协作，挑选 Visual DNA 与 Product Moment，写出"分镜本"。',
    duration: '约 30 秒',
  },
  {
    n: '03',
    title: '电影级素材并行锻造',
    body: 'Hero Loop、价值主张微视频 × 3、Brand Story、产品特写 —— 由 Kling、Flux、Ideogram 并行生成，自动重试与降级。',
    duration: '2-4 分钟',
  },
  {
    n: '04',
    title: '合规 + SEO + 商城并联',
    body: '自动扫描 FTC / GDPR / FDA 红线，生成 Schema.org / sitemap / llms.txt，同时挂上 Medusa v2 商城。',
    duration: '约 30 秒',
  },
  {
    n: '05',
    title: '5 分钟内上线',
    body: '部署到 Cloudflare Pages，自动签发 SSL，绑定子域或自定义域。后续可视化编辑器或与 AI Copilot 对话即可改任何东西。',
    duration: '永久在线',
  },
]

export function ZhHowItWorks() {
  return (
    <section id="how-it-works" className="border-border-subtle border-b py-24 lg:py-32">
      <div className="container-page flex flex-col gap-14">
        <SectionHeading
          id="zh-how-title"
          eyebrow="工作流程"
          title="一条链接，一个完整品牌。"
          description="五个安静的步骤，没有仪式感。你仍是创意总监，Forgely 替你管整支制作组。"
        />
        <ol className="border-border-strong bg-border-subtle grid gap-px overflow-hidden rounded-2xl border md:grid-cols-2 lg:grid-cols-5">
          {STEPS.map((s) => (
            <li key={s.n} className="bg-bg-deep flex flex-col gap-4 p-6 lg:p-7">
              <div className="flex items-baseline justify-between">
                <span className="text-caption text-forge-orange font-mono uppercase tracking-[0.22em]">
                  第 {s.n} 步
                </span>
                <span className="text-caption text-text-muted font-mono uppercase tracking-[0.18em]">
                  {s.duration}
                </span>
              </div>
              <h3 className="font-display text-h3 text-text-primary font-light">{s.title}</h3>
              <p className="text-small text-text-secondary">{s.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

/* ───── Value Props ───── */
const VALUES = [
  {
    icon: <Aperture className="h-5 w-5" />,
    title: '自上而下的电影级一致性',
    body: 'Hero、价值主张、Brand Story、产品特写 —— 6 段共享同一套 Visual DNA。像 Aesop、Recess、Terminal 那样的整体感，几分钟就有。',
    meta: '10 套视觉 DNA · 10 种 Product Moment',
  },
  {
    icon: <Cpu className="h-5 w-5" />,
    title: '不是 Landing Page，是真商城',
    body: '从第 1 天开始挂 Medusa v2：商品、购物车、结账、订单、库存与 Stripe。需要时还能导出整套源码。',
    meta: 'Stripe · PayPal · NOWPayments',
  },
  {
    icon: <Sparkles className="h-5 w-5" />,
    title: '常驻后台、能干活的 AI Copilot',
    body: '它是一位会用 20+ 工具的 Agent —— 改文案、换 Hero 视频、上一个折扣、重画一段，听懂就动手。',
    meta: '20+ 后台工具 · 长期记忆',
  },
]

export function ZhValueProps() {
  return (
    <section className="border-border-subtle border-b py-24 lg:py-32">
      <div className="container-page flex flex-col gap-16">
        <SectionHeading
          id="zh-values-title"
          eyebrow="为什么选 Forgely"
          title={
            <>
              三个 <em className="font-display text-forge-orange italic">不公平</em> 的优势
            </>
          }
          description="品牌网站不止于好看的图。Forgely 把外观、声音、结构与商城一起设计，并陪你持续出货。"
        />
        <div className="border-border-strong bg-border-subtle grid grid-cols-1 gap-px overflow-hidden rounded-2xl border md:grid-cols-3">
          {VALUES.map((v) => (
            <article key={v.title} className="bg-bg-deep relative flex flex-col gap-6 p-8 lg:p-10">
              <span
                aria-hidden="true"
                className="border-forge-orange/40 bg-forge-orange/10 text-forge-orange grid h-11 w-11 place-items-center rounded-md border"
              >
                {v.icon}
              </span>
              <div className="flex flex-col gap-3">
                <h3 className="font-display text-h2 text-text-primary font-light">{v.title}</h3>
                <p className="text-body text-text-secondary">{v.body}</p>
              </div>
              <div className="text-caption text-text-muted mt-auto pt-6 font-mono uppercase tracking-[0.18em]">
                {v.meta}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ───── Pricing ───── */
const PLANS = [
  {
    id: 'free',
    name: '免费版',
    tagline: '上手试一试。',
    price: '¥0',
    cadence: '永久免费',
    cta: { label: '免费开始', href: '#waitlist' },
    features: [
      '500 一次性积分',
      '1 个 .forgely.app 子域（带水印）',
      '6 段首页生成',
      '视频 Hero（不含 3D）',
      '受限版 AI Copilot',
    ],
    recommended: false,
  },
  {
    id: 'starter',
    name: '入门版',
    tagline: '一个独立品牌上线用。',
    price: '¥199',
    cadence: '/ 月（年付立减 25%）',
    cta: { label: '选入门版', href: '#waitlist' },
    features: ['1,500 积分 / 月', '3 个站点', '1 个自定义域名', '视频 Hero', 'AI Copilot 完整可用'],
    recommended: false,
  },
  {
    id: 'pro',
    name: '专业版',
    tagline: '成长期 DTC 品牌。',
    price: '¥699',
    cadence: '/ 月（年付立减 25%）',
    cta: { label: '选专业版', href: '#waitlist' },
    features: [
      '6,000 积分 / 月',
      '10 个站点',
      '5 个自定义域名',
      '视频 + 3D Hero',
      '每月 1 次代码导出',
      '生成优先级排队',
    ],
    recommended: true,
  },
  {
    id: 'agency',
    name: '代运营版',
    tagline: '同时跑很多品牌。',
    price: '¥1,999',
    cadence: '/ 月（年付立减 25%）',
    cta: { label: '选代运营版', href: '#waitlist' },
    features: [
      '25,000 积分 / 月',
      '50 个站点',
      '无限自定义域名',
      '白标 Copilot',
      '无限代码导出',
      '5 个团队席位 · 优先支持',
    ],
    recommended: false,
  },
]

export function ZhPricing() {
  return (
    <section id="pricing" className="border-border-subtle border-b py-24 lg:py-32">
      <div className="container-page flex flex-col gap-12">
        <SectionHeading
          id="zh-pricing-title"
          eyebrow="价格"
          title="为锻造付费，不为座位付费。"
          description="先免费用。订阅获得每月固定积分与功能；不够时随时充值，购买的积分永不过期。"
        />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          {PLANS.map((p) => (
            <article
              key={p.id}
              className={cn(
                'bg-bg-deep relative flex h-full flex-col gap-6 rounded-2xl border p-7 transition',
                p.recommended
                  ? 'border-forge-orange/60 shadow-glow-forge xl:scale-[1.03]'
                  : 'border-border-strong hover:border-border-strong/80',
              )}
            >
              {p.recommended ? (
                <Badge tone="forge" className="absolute -top-3 left-7">
                  最受欢迎
                </Badge>
              ) : null}
              <header className="flex flex-col gap-2">
                <h3 className="font-display text-h2 text-text-primary font-light">{p.name}</h3>
                <p className="text-small text-text-muted">{p.tagline}</p>
              </header>
              <div className="flex items-baseline gap-2">
                <span className="font-display text-display text-text-primary font-light tracking-tight">
                  {p.price}
                </span>
                <span className="text-small text-text-muted">{p.cadence}</span>
              </div>
              <Link
                href={p.cta.href}
                className={buttonClasses({
                  variant: p.recommended ? 'forge' : 'outline',
                  size: 'md',
                  className: 'w-full',
                })}
              >
                {p.cta.label}
              </Link>
              <ul className="text-small text-text-secondary mt-2 flex flex-col gap-3">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check
                      className="text-forge-orange mt-0.5 h-4 w-4 shrink-0"
                      aria-hidden="true"
                    />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
        <p className="text-caption text-text-muted text-center font-mono uppercase tracking-[0.2em]">
          人民币价格为英文版美元定价的实时换算参考 · 实际结算以 Stripe 上的美元金额为准。
        </p>
      </div>
    </section>
  )
}

/* ───── FAQ (server-rendered, all expanded) ───── */
const FAQS = [
  {
    q: 'Forgely 到底生成什么？',
    a: '一个完整、可托管的品牌独立站：6 段电影级首页（Hero loop、价值主张、Brand Story、产品特写、社会化证明、CTA）+ Medusa v2 商城（商品 / 购物车 / 结账 / 订单 / Stripe），后台还有 AI Copilot 可继续编辑。',
  },
  {
    q: '需要会设计或写代码吗？',
    a: '不需要。Forgely 自动挑选 Visual DNA、写文案、生成素材并部署。后续既可以可视化编辑，也可以直接和 AI Copilot 对话改任何东西。',
  },
  {
    q: '可以导入我现有的 Shopify / WooCommerce 店吗？',
    a: '可以。粘贴 URL，Forgely 会抓取商品、分类、文案与截图，标准化后让你选哪些保留、哪些替换、哪些重新生成。',
  },
  {
    q: '积分体系怎么算？',
    a: '每个套餐每月有固定积分。生成、改写、视频重生与 Copilot 操作会消耗积分 —— 完整首页约 900 积分。订阅赠送的积分当月作废，购买的积分永不过期。',
  },
  {
    q: '可以导出代码吗？',
    a: '可以。专业版每月送 1 次代码导出，代运营版无限次。导出的是完整的 Next.js 项目，含 SiteDSL 与 Medusa 配置 —— 你的数据、你的店、你的决定。',
  },
]

export function ZhFaq() {
  return (
    <section id="faq" className="border-border-subtle border-b py-24 lg:py-32">
      <div className="container-page grid gap-12 lg:grid-cols-[1fr_2fr] lg:gap-20">
        <SectionHeading
          id="zh-faq-title"
          eyebrow="常见问题"
          title="开门见山，常被问到的几件事。"
          description="还有问题？发邮件到 hello@forgely.com —— 是真人回复，不是聊天机器人。"
        />
        <ul className="divide-border-subtle border-border-subtle flex flex-col divide-y border-y">
          {FAQS.map((item) => (
            <li key={item.q} className="py-6">
              <h3 className="font-display text-h3 text-text-primary font-light">{item.q}</h3>
              <p className="text-body text-text-secondary mt-3">{item.a}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

/* ───── Final CTA ───── */
export function ZhFinalCta() {
  return (
    <section className="border-border-subtle relative isolate overflow-hidden border-b py-24 lg:py-32">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="bg-bg-void absolute inset-0" />
        <div
          className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-60 blur-3xl"
          style={{
            background:
              'radial-gradient(circle, rgba(255,107,26,0.55) 0%, rgba(199,74,10,0.18) 35%, transparent 70%)',
          }}
        />
        <div className="bg-grid-subtle absolute inset-0 opacity-40" />
      </div>
      <div className="container-page flex flex-col items-center gap-10 text-center">
        <h2 className="font-display text-display text-text-primary font-light leading-[0.95] tracking-tight">
          你的品牌
          <br />
          <span className="text-gradient-forge italic">只差一条链接。</span>
        </h2>
        <p className="text-body-lg text-text-secondary max-w-2xl">
          粘贴一个商品链接，或描述你的想法。Forgely 会还给你一个电影级、可备货、可销售的品牌独立站
          —— 通常不到 5 分钟。
        </p>
        <Link href="#waitlist" className={buttonClasses({ variant: 'forge', size: 'lg' })}>
          立即开始锻造
          <ArrowDownRight className="ml-1 h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </section>
  )
}
