'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

import { useCopilotContext } from '@/components/copilot/copilot-provider'
import { AnswerInput, type AnswerPayload } from '@/components/generate/answer-input'
import { PageHeader } from '@/components/shell/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icons'
import { cn } from '@/lib/cn'
import {
  firstTurn,
  nextStageAfter,
  turnFor,
  type ConversationStage,
  type MockTurn,
} from '@/lib/conversation-mock'
import { trpc } from '@/lib/trpc'

interface ChatMessage {
  id: string
  role: 'assistant' | 'user'
  text: string
  reasoning?: string
  createdAt: string
}

let nextId = 1
const id = (prefix = 'm') => `${prefix}_${nextId++}`

export default function GeneratePage() {
  useCopilotContext({ kind: 'global' })
  const router = useRouter()

  const [conversationId, setConversationId] = useState<string | null>(null)
  const [stage, setStage] = useState<ConversationStage>('choosing_path')
  const [turn, setTurn] = useState<MockTurn>(() => firstTurn())
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: id(),
      role: 'assistant',
      text: firstTurn().message,
      reasoning: firstTurn().reasoning,
      createdAt: new Date().toISOString(),
    },
  ])
  const [pending, setPending] = useState(false)
  const [source, setSource] = useState<'trpc' | 'mock' | 'unknown'>('unknown')
  const scrollRef = useRef<HTMLDivElement>(null)

  // Persistence: try the real tRPC; on failure stay in pure-mock mode.
  const startMutation = trpc.conversation.start.useMutation()
  const submitMutation = trpc.conversation.submitAnswer.useMutation()
  const commitMutation = trpc.conversation.commit.useMutation()

  useEffect(() => {
    let cancelled = false
    startMutation
      .mutateAsync({})
      .then((res) => {
        if (cancelled) return
        setConversationId(res.conversationId)
        setSource('trpc')
        setStage(res.turn.stage as ConversationStage)
        setTurn({
          stage: res.turn.stage as ConversationStage,
          message: res.turn.message,
          reasoning: res.turn.reasoning,
          // Trust the server's `expects` shape — ours mirrors theirs.
          expects: res.turn.expects as MockTurn['expects'],
        })
        setMessages([
          {
            id: id(),
            role: 'assistant',
            text: res.turn.message,
            reasoning: res.turn.reasoning,
            createdAt: new Date().toISOString(),
          },
        ])
      })
      .catch(() => {
        if (cancelled) return
        setSource('mock')
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Auto-scroll on new messages
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    })
  }, [messages, pending])

  const submitAnswer = async (payload: AnswerPayload) => {
    if (pending) return
    setPending(true)
    setMessages((m) => [
      ...m,
      { id: id(), role: 'user', text: payload.rawText, createdAt: new Date().toISOString() },
    ])

    try {
      if (conversationId && source === 'trpc') {
        const answer = (() => {
          switch (payload.kind) {
            case 'choice':
              return { kind: 'choice' as const, choice: payload.choice ?? '' }
            case 'url':
              return { kind: 'url' as const, url: payload.url ?? '' }
            case 'text':
              return { kind: 'text' as const, text: payload.text ?? '' }
            case 'tags':
              return { kind: 'tags' as const, tags: payload.tags ?? [] }
            case 'product':
              return { kind: 'product' as const, productId: payload.productId ?? '' }
            case 'confirm':
              return { kind: 'confirm' as const, confirmed: !!payload.confirmed }
          }
        })()
        const res = await submitMutation.mutateAsync({
          conversationId,
          // Cast to the server's union — shapes are 1:1 by design.
          // eslint-disable-next-line @typescript-eslint/no-explicit-any -- cross-package union narrowing
          answer: answer as any,
          rawText: payload.rawText,
        })
        const next = res.nextTurn
        setStage(next.stage as ConversationStage)
        setTurn({
          stage: next.stage as ConversationStage,
          message: next.message,
          reasoning: next.reasoning,
          expects: next.expects as MockTurn['expects'],
        })
        setMessages((m) => [
          ...m,
          {
            id: id(),
            role: 'assistant',
            text: next.message,
            reasoning: next.reasoning,
            createdAt: new Date().toISOString(),
          },
        ])
      } else {
        // Pure-mock fallback
        await new Promise((r) => setTimeout(r, 600))
        const nextStage = nextStageAfter(stage, {
          kind: payload.kind,
          choice: payload.choice,
        })
        setStage(nextStage)
        const nextTurn = turnFor(nextStage)
        if (nextTurn) {
          setTurn(nextTurn)
          setMessages((m) => [
            ...m,
            {
              id: id(),
              role: 'assistant',
              text: nextTurn.message,
              reasoning: nextTurn.reasoning,
              createdAt: new Date().toISOString(),
            },
          ])
        }
      }
    } catch (err) {
      setMessages((m) => [
        ...m,
        {
          id: id(),
          role: 'assistant',
          text: `Hmm — that didn't go through (${
            err instanceof Error ? err.message : String(err)
          }). Try again?`,
          createdAt: new Date().toISOString(),
        },
      ])
    } finally {
      setPending(false)
    }
  }

  const onCommit = async () => {
    if (pending) return
    setPending(true)
    try {
      if (conversationId && source === 'trpc') {
        const subdomain = `forge-${Math.random().toString(36).slice(2, 8)}`
        const res = await commitMutation.mutateAsync({
          conversationId,
          siteId: subdomain,
          subdomain,
          brandName: 'My Brand',
        })
        router.push(`/sites/${(res as { siteId?: string }).siteId ?? subdomain}/generating`)
      } else {
        // Mock — pretend we kicked off, jump to generating page on the
        // default mock site so the user can see the next step.
        router.push('/sites/qiao-coffee/generating')
      }
    } catch (err) {
      setMessages((m) => [
        ...m,
        {
          id: id(),
          role: 'assistant',
          text: `Couldn't kick off generation — ${
            err instanceof Error ? err.message : String(err)
          }. Try once more?`,
          createdAt: new Date().toISOString(),
        },
      ])
      setPending(false)
    }
  }

  const isReady = stage === 'review_plan' || stage === 'ready'

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <PageHeader
        eyebrow="Forge"
        title="Forge a new site"
        description="Tell me about your brand. I'll ask a handful of questions, then dispatch the 12-step pipeline."
        meta={
          <>
            <Badge
              tone={source === 'trpc' ? 'success' : source === 'mock' ? 'outline' : 'neutral'}
              dot
            >
              {source === 'trpc' ? 'live' : source === 'mock' ? 'demo mode' : 'starting…'}
            </Badge>
            <span>·</span>
            <span>stage</span>
            <span className="text-text-secondary">{stage}</span>
          </>
        }
      />

      <div
        ref={scrollRef}
        className="border-border-subtle bg-bg-surface flex max-h-[60vh] flex-col gap-3 overflow-y-auto rounded-lg border p-5"
      >
        {messages.map((m) => (
          <Message key={m.id} message={m} />
        ))}
        {pending ? (
          <div className="flex items-start gap-2">
            <span className="bg-forge-orange/15 text-forge-amber grid h-7 w-7 place-items-center rounded-full">
              <Icon.Sparkle size={12} />
            </span>
            <div className="bg-bg-elevated flex items-center gap-1.5 rounded-2xl px-3.5 py-3">
              <span className="bg-forge-amber h-1.5 w-1.5 animate-pulse rounded-full" />
              <span className="bg-forge-amber h-1.5 w-1.5 animate-pulse rounded-full [animation-delay:120ms]" />
              <span className="bg-forge-amber h-1.5 w-1.5 animate-pulse rounded-full [animation-delay:240ms]" />
            </div>
          </div>
        ) : null}
      </div>

      <div className="border-border-subtle bg-bg-deep rounded-lg border p-5">
        <p className="text-caption text-text-muted mb-3 inline-flex items-center gap-1.5 font-mono uppercase tracking-[0.18em]">
          <Icon.ChevronRight size={12} /> Your reply
        </p>
        {isReady && turn.expects.kind === 'confirm' ? (
          <div className="flex flex-wrap items-center gap-3">
            <Button size="lg" disabled={pending} onClick={onCommit}>
              <Icon.Sparkle size={14} /> Confirm and forge
            </Button>
            <Button size="lg" variant="ghost" disabled={pending}>
              Tweak something first
            </Button>
          </div>
        ) : (
          <AnswerInput expects={turn.expects} pending={pending} onSubmit={submitAnswer} />
        )}
      </div>
    </div>
  )
}

function Message({ message }: { message: ChatMessage }) {
  const [showReasoning, setShowReasoning] = useState(false)
  const isUser = message.role === 'user'
  return (
    <div className={cn('flex flex-col gap-1', isUser ? 'items-end' : 'items-start')}>
      <div className={cn('flex max-w-[88%] gap-2', isUser ? 'flex-row-reverse' : 'flex-row')}>
        <span
          className={cn(
            'mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full',
            isUser ? 'bg-bg-elevated text-text-secondary' : 'bg-forge-orange/15 text-forge-amber',
          )}
        >
          {isUser ? <Icon.User size={12} /> : <Icon.Sparkle size={12} />}
        </span>
        <div
          className={cn(
            'text-body rounded-2xl px-3.5 py-2.5 leading-relaxed',
            isUser
              ? 'bg-forge-orange/15 text-forge-amber border-forge-orange/30 border'
              : 'bg-bg-elevated text-text-primary border-border-subtle border',
          )}
        >
          <p className="whitespace-pre-wrap">{message.text}</p>
          {message.reasoning ? (
            <button
              type="button"
              onClick={() => setShowReasoning((v) => !v)}
              className="text-caption text-text-muted hover:text-text-primary mt-2 inline-flex items-center gap-1 font-mono uppercase tracking-[0.12em]"
            >
              {showReasoning ? <Icon.ChevronDown size={10} /> : <Icon.ChevronRight size={10} />}
              {showReasoning ? 'Hide reasoning' : 'Show reasoning'}
            </button>
          ) : null}
          {showReasoning && message.reasoning ? (
            <p className="border-border-subtle bg-bg-deep text-caption text-text-secondary mt-2 rounded-md border px-2 py-1.5 font-mono">
              {message.reasoning}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  )
}
