'use client'

import { useEffect, useRef, useState, type FormEvent } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Drawer, DrawerHeader } from '@/components/ui/drawer'
import { Icon } from '@/components/ui/icons'
import { Textarea } from '@/components/ui/input'
import { cn } from '@/lib/cn'
import { relativeTime } from '@/lib/format'

import type { CopilotPageContext } from './types'
import { useCopilot } from './copilot-provider'
import { ToolCallCard } from './tool-call-card'

const SUGGESTIONS_BY_CONTEXT: Record<CopilotPageContext['kind'], string[]> = {
  dashboard: [
    'How are sales this month?',
    'What needs my attention right now?',
    'Suggest a product to promote.',
  ],
  'product-list': [
    'Find slow-moving products.',
    'Suggest pricing across catalog.',
    'Bulk rewrite all draft products.',
  ],
  product: [
    'Rewrite the title for SEO.',
    'Suggest pricing.',
    'Generate 3 lifestyle photos for this product.',
  ],
  'order-list': [
    'Show orders pending shipment.',
    'Find orders with refund requests.',
    'Compare this week to last week.',
  ],
  order: [
    'Issue a refund.',
    'Send a shipment-update email to the customer.',
    'Tag this order as a return.',
  ],
  'customer-list': [
    'Who are my top 5 customers?',
    'Find customers who haven’t ordered in 60 days.',
    'Tag everyone over $200 LTV as VIP.',
  ],
  customer: [
    'Send a thank-you email.',
    'Tag as VIP.',
    'Forecast lifetime value.',
  ],
  media: [
    'Generate a hero video for the homepage.',
    'Find unused assets I can delete.',
    'Re-render the logo in white.',
  ],
  'brand-kit': [
    'Make the palette warmer.',
    'Suggest a body font that pairs with the heading.',
    'Generate 3 logo variants.',
  ],
  editor: [
    'Make the hero more bold.',
    'Add a testimonials block before the footer.',
    'Tighten spacing on mobile.',
  ],
  global: [
    'How are sales this month?',
    'Rewrite my hero headline.',
    'Generate a launch discount code.',
  ],
}

export function CopilotDrawer() {
  const {
    open,
    setOpen,
    messages,
    pending,
    context,
    send,
    confirmTool,
    cancelTool,
    clear,
  } = useCopilot()
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
    <Drawer open={open} onClose={() => setOpen(false)} side="right" width="440px" ariaLabel="Copilot">
      <DrawerHeader>
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-md bg-forge-orange/15 text-forge-amber">
            <Icon.Sparkle size={16} />
          </span>
          <div className="flex flex-col">
            <span className="font-heading text-body text-text-primary">Forgely Copilot</span>
            <span className="font-mono text-caption text-text-muted">
              ctx · {context.kind}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={clear}
            className="rounded-md px-2 py-1 font-mono text-caption uppercase tracking-[0.12em] text-text-muted hover:text-text-primary"
            aria-label="Clear conversation"
          >
            <Icon.Trash size={14} />
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-md px-2 py-1 text-text-muted hover:text-text-primary"
            aria-label="Close"
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
              className={cn(
                'flex flex-col gap-2',
                m.role === 'user' ? 'items-end' : 'items-start',
              )}
            >
              <div
                className={cn(
                  'max-w-[90%] rounded-2xl px-3.5 py-2.5 text-small leading-relaxed',
                  m.role === 'user'
                    ? 'bg-forge-orange/15 text-forge-amber border border-forge-orange/30'
                    : 'bg-bg-elevated text-text-primary border border-border-subtle',
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
              <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-subtle">
                {relativeTime(m.createdAt)}
              </span>
            </div>
          ))}
          {pending ? (
            <div className="flex items-start">
              <div className="flex items-center gap-1.5 rounded-2xl border border-border-subtle bg-bg-elevated px-3.5 py-2.5">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-forge-amber" />
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-forge-amber [animation-delay:120ms]" />
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-forge-amber [animation-delay:240ms]" />
              </div>
            </div>
          ) : null}
        </div>

        <div className="border-t border-border-subtle px-5 py-3">
          <div className="mb-2 flex flex-wrap gap-1.5">
            {SUGGESTIONS_BY_CONTEXT[context.kind].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => void send(s)}
                disabled={pending}
                className="rounded-full border border-border-subtle bg-bg-deep px-2.5 py-1 text-caption text-text-secondary transition-colors hover:border-forge-orange/40 hover:text-forge-amber disabled:opacity-40"
              >
                {s}
              </button>
            ))}
          </div>
          <form onSubmit={onSubmit} className="flex items-end gap-2">
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Ask Copilot anything…"
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
          <div className="mt-2 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.12em] text-text-muted">
            <span>Enter ↵ send · Shift+Enter newline · ⌘J toggle</span>
            <Badge tone="outline">mock</Badge>
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
      <strong key={i} className="font-semibold text-forge-amber">
        {p.bold}
      </strong>
    ),
  )
}
