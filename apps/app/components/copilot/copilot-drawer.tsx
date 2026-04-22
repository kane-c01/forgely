'use client'

import { useEffect, useRef, useState, type FormEvent } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Drawer, DrawerHeader } from '@/components/ui/drawer'
import { Icon } from '@/components/ui/icons'
import { Textarea } from '@/components/ui/input'
import { cn } from '@/lib/cn'
import { relativeTime } from '@/lib/format'
import { useT } from '@/lib/i18n'

import type { CopilotPageContext } from './types'
import { useCopilot } from './copilot-provider'
import { ToolCallCard } from './tool-call-card'

const SUGGESTIONS_BY_CONTEXT: Record<CopilotPageContext['kind'], string[]> = {
  // ── 用户后台(中文优先) ────────────────────────────────────
  dashboard: ['本月销售怎么样?', '现在需要我处理什么?', '推荐一款值得主推的商品。'],
  'product-list': ['找出滞销商品。', '帮全店建议定价。', '把所有草稿商品的文案批量重写。'],
  product: ['为 SEO 重写标题。', '建议定价。', '为这款商品生成 3 张生活方式图。'],
  'order-list': ['显示待发货订单。', '找出申请退款的订单。', '本周对比上周。'],
  order: ['退款。', '给客户发一封发货通知邮件。', '把这个订单标记为退货。'],
  'customer-list': [
    '我的 Top 5 客户是谁?',
    '60 天没下单的客户。',
    '给 LTV 超过 ¥1500 的全部打 VIP 标签。',
  ],
  customer: ['发一封感谢邮件。', '标记为 VIP。', '预测客户生命周期价值。'],
  media: ['为首页生成一段 hero 视频。', '找出可以删除的未用素材。', '把 Logo 转成白色版。'],
  'brand-kit': ['把配色改暖一些。', '推荐一款搭配标题的正文字体。', '生成 3 款 Logo 变体。'],
  editor: ['让 Hero 区更大胆。', '在 Footer 前加一个用户评价区块。', '收紧移动端的间距。'],
  compliance: [
    '运行一次合规扫描。',
    '把所有「绝对化用语」替换成合规版本。',
    '提取本页的合规高风险点。',
  ],
  seo: ['给本页生成 SEO 元描述。', '抓取 5 个长尾关键词。', '提交 sitemap 到 Bing。'],
  global: ['本月销售怎么样?', '重写 Hero 标题。', '生成一张上线优惠码。'],

  // ── 超级管理员(zh-CN,W7 视角) ────────────────────────────
  'super-overview': ['本月 MRR 多少?', '最近 24h 的 critical 告警', 'AI 成本占比是多少?'],
  'super-users': ['找用户:邮箱含 "@example.com"', '禁用 user_7a8f', '给 u_123 加 1000 积分'],
  'super-user': ['封禁 7 天', '加 500 积分', '查看最近 30 天行为日志'],
  'super-finance': ['导出本月对账', '本季度 MRR 走势', '找出未对账的 Stripe 事件'],
  'super-audit': [
    '最近 50 条 critical 审计',
    '今天哪些 admin 用了 "Login as"?',
    '过去 24h 的封禁记录',
  ],
  'super-team': ['邀请新成员', '给 alex@forgely.com 改成 ADMIN', '查看未启用 2FA 的成员'],
  'super-marketing': ['发一条全平台公告', '给所有 7 天未活跃用户发邮件', '生成一段春季活动文案'],
  'super-plugins': ['列出全部待审插件', '批准 plg_yto_logistics', '拒绝匿名客服机器人并说明原因'],
  'super-health': [
    '现在哪些组件状态异常?',
    '重新拉一遍 Sentry / PostHog',
    '给我看 Postgres 当前连接数',
  ],
  'super-ai-ops': ['本周 AI 成本占营收多少?', 'Kling 触发限流的原因', '哪些用户消耗 AI 最多?'],
  'super-sites': ['列出所有冻结站点', '冻结 site_xxx', '强制重新生成 site_aurea'],
  'super-content': ['草稿文章列表', '中英双语覆盖率', '帮我起草一篇关于 ICP 备案的帮助文章'],
  'super-analytics': ['本月漏斗转化率', '微信渠道签约率', '过去 4 周 D7 留存走势'],
  'super-support': ['列出待认领的 P1 工单', '把 tkt_1842 分给我', '平均首次响应时间'],
  'super-settings': ['关闭注册并通知所有管理员', '轮换 DeepSeek Key', 'ICP 备案当前状态'],
}

export function CopilotDrawer() {
  const { open, setOpen, messages, pending, context, send, confirmTool, cancelTool, clear } =
    useCopilot()
  const t = useT()
  const [text, setText] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, open, pending])

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return
    void send(text)
    setText('')
  }

  return (
    <Drawer
      open={open}
      onClose={() => setOpen(false)}
      side="right"
      width="440px"
      ariaLabel={t.copilotUi.copilotLabel}
    >
      <DrawerHeader>
        <div className="flex items-center gap-2.5">
          <span className="bg-forge-orange/15 text-forge-amber grid h-8 w-8 place-items-center rounded-md">
            <Icon.Sparkle size={16} />
          </span>
          <div className="flex flex-col">
            <span className="font-heading text-body text-text-primary">{t.copilotUi.title}</span>
            <span className="text-caption text-text-muted font-mono">ctx · {context.kind}</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={clear}
            className="text-caption text-text-muted hover:text-text-primary rounded-md px-2 py-1 font-mono uppercase tracking-[0.12em]"
            aria-label={t.copilotUi.clearConversation}
          >
            <Icon.Trash size={14} />
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="text-text-muted hover:text-text-primary rounded-md px-2 py-1"
            aria-label={t.copilotUi.close}
          >
            <Icon.Close size={16} />
          </button>
        </div>
      </DrawerHeader>

      <div className="flex h-[calc(100vh-56px)] flex-col">
        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          {messages.map((m) => (
            <div
              key={m.id}
              className={cn('flex flex-col gap-2', m.role === 'user' ? 'items-end' : 'items-start')}
            >
              <div
                className={cn(
                  'text-small max-w-[90%] rounded-2xl px-3.5 py-2.5 leading-relaxed',
                  m.role === 'user'
                    ? 'bg-forge-orange/15 text-forge-amber border-forge-orange/30 border'
                    : 'bg-bg-elevated text-text-primary border-border-subtle border',
                )}
              >
                {renderMarkdown(m.text)}
              </div>
              {m.toolCalls?.length ? (
                <div className="flex w-full flex-col gap-2">
                  {m.toolCalls.map((c) => (
                    <ToolCallCard
                      key={c.id}
                      call={c}
                      onConfirm={() => confirmTool(m.id, c.id)}
                      onCancel={() => cancelTool(m.id, c.id)}
                    />
                  ))}
                </div>
              ) : null}
              <span className="text-text-subtle font-mono text-[10px] uppercase tracking-[0.12em]">
                {relativeTime(m.createdAt)}
              </span>
            </div>
          ))}
          {pending ? (
            <div className="flex items-start">
              <div className="border-border-subtle bg-bg-elevated flex items-center gap-1.5 rounded-2xl border px-3.5 py-2.5">
                <span className="bg-forge-amber h-1.5 w-1.5 animate-pulse rounded-full" />
                <span className="bg-forge-amber h-1.5 w-1.5 animate-pulse rounded-full [animation-delay:120ms]" />
                <span className="bg-forge-amber h-1.5 w-1.5 animate-pulse rounded-full [animation-delay:240ms]" />
              </div>
            </div>
          ) : null}
        </div>

        <div className="border-border-subtle border-t px-5 py-3">
          <div className="mb-2 flex flex-wrap gap-1.5">
            {SUGGESTIONS_BY_CONTEXT[context.kind].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => void send(s)}
                disabled={pending}
                className="border-border-subtle bg-bg-deep text-caption text-text-secondary hover:border-forge-orange/40 hover:text-forge-amber rounded-full border px-2.5 py-1 transition-colors disabled:opacity-40"
              >
                {s}
              </button>
            ))}
          </div>
          <form onSubmit={onSubmit} className="flex items-end gap-2">
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={t.copilotUi.placeholder}
              className="min-h-[44px] flex-1 resize-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  if (!pending && text.trim()) {
                    void send(text)
                    setText('')
                  }
                }
              }}
            />
            <Button type="submit" size="md" disabled={pending || !text.trim()}>
              <Icon.Send size={14} />
            </Button>
          </form>
          <div className="text-text-muted mt-2 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.12em]">
            <span>{t.copilotUi.sendHint}</span>
            <Badge tone="outline">{t.copilotUi.modelBadge}</Badge>
          </div>
        </div>
      </div>
    </Drawer>
  )
}

/**
 * Tiny inline markdown renderer for **bold** only — keeps Copilot
 * messages safe and zero-dep.
 */
function renderMarkdown(text: string) {
  const parts: Array<string | { bold: string }> = []
  let last = 0
  const re = /\*\*(.+?)\*\*/g
  let m: RegExpExecArray | null
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(text.slice(last, m.index))
    parts.push({ bold: m[1]! })
    last = m.index + m[0].length
  }
  if (last < text.length) parts.push(text.slice(last))
  return parts.map((p, i) =>
    typeof p === 'string' ? (
      <span key={i} className="whitespace-pre-wrap">
        {p}
      </span>
    ) : (
      <strong key={i} className="text-forge-amber font-semibold">
        {p.bold}
      </strong>
    ),
  )
}
