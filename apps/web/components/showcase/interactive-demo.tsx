'use client'

import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { ArrowUp, Loader2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/cn'
import { siteConfig } from '@/lib/site'

interface DemoTurn {
  role: 'user' | 'assistant'
  content: string
  /** Streaming-display speed in ms-per-character; lower = faster. */
  pace?: number
}

interface DemoScript {
  id: string
  title: string
  prompt: string
  reply: DemoTurn[]
}

const SCRIPTS: DemoScript[] = [
  {
    id: 'shopify-link',
    title: 'Paste a Shopify link',
    prompt: 'Give Forgely a real link.',
    reply: [
      {
        role: 'user',
        content: 'https://toybloom.myshopify.com',
      },
      {
        role: 'assistant',
        content:
          'Reading toybloom.myshopify.com — 12 wooden toys, $24-$89, current visual quality 4/10 (generic Shopify theme).',
      },
      {
        role: 'assistant',
        content:
          'Reading the brand voice — "warm, calm, Scandinavian home". References match Grimm\'s and Oeuf NYC.',
      },
      {
        role: 'assistant',
        content:
          'Recommending Visual DNA: Nordic Minimal · Hero Moment: M04 Breathing Still. Confidence 87%.',
        pace: 12,
      },
    ],
  },
  {
    id: 'idea-only',
    title: 'Just describe an idea',
    prompt: 'No store yet — just an idea.',
    reply: [
      {
        role: 'user',
        content:
          'Premium Japanese ceramic mugs. Audience: design-conscious 30-40, prefers slow rituals.',
      },
      {
        role: 'assistant',
        content:
          'Imagining 3 hero candidates with Flux 1.1 Pro — choosing the matte sand-glaze cup.',
      },
      {
        role: 'assistant',
        content:
          'Visual DNA: Kyoto Ceramic · Hero Moment: M04 Breathing Still with M05 Droplet Ripple variant.',
      },
      {
        role: 'assistant',
        content:
          'Drafting copy: "Slow mornings deserve weight in your hand." — confirm or rephrase?',
        pace: 12,
      },
    ],
  },
  {
    id: 'ask-copilot',
    title: 'Talk to the live Copilot',
    prompt: 'Already shipped — ask the Copilot to act.',
    reply: [
      {
        role: 'user',
        content:
          'Make the hero feel warmer and rerun it. Add a 15% discount for first-time visitors.',
      },
      {
        role: 'assistant',
        content:
          'Re-grading the hero loop to a softer 3000K — regenerating 8s loop on Kling (≈ 90s).',
      },
      {
        role: 'assistant',
        content:
          'Creating discount FIRST15 (15% off, single use, expires in 14 days) — preview before publish?',
      },
      {
        role: 'assistant',
        content:
          'Estimated cost: 150 credits hero + 10 Copilot + 2 discount = 162 credits. Confirm?',
        pace: 12,
      },
    ],
  },
]

/**
 * Interactive demo — a faux chat that types out a scripted Forgely
 * conversation. Three different scripts the visitor can click between.
 *
 * It is intentionally NOT wired up to a live LLM:
 *   - keeps the marketing site free of API keys / billing surface
 *   - guarantees the demo always works regardless of model availability
 *   - the actual Copilot lives in app.forgely.com (sign-in required)
 *
 * Behaviour
 *   - Click a script chip → reset and start streaming that conversation
 *   - Each character lands on its own animation frame (prefers-reduced-motion
 *     skips straight to the final transcript)
 *   - "Send" button replays the active script
 */
export function InteractiveDemo({ className }: { className?: string }) {
  const [activeId, setActiveId] = useState<string>(SCRIPTS[0]!.id)
  const [streamingTurnIndex, setStreamingTurnIndex] = useState(0)
  const [partialText, setPartialText] = useState('')
  const [done, setDone] = useState(false)
  const [reduced, setReduced] = useState(false)
  const transcriptRef = useRef<HTMLDivElement>(null)
  const formId = useId()

  const script = useMemo(() => SCRIPTS.find((s) => s.id === activeId) ?? SCRIPTS[0]!, [activeId])

  useEffect(() => {
    if (typeof window === 'undefined') return
    setReduced(window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  }, [])

  useEffect(() => {
    setStreamingTurnIndex(0)
    setPartialText('')
    setDone(false)
  }, [activeId])

  useEffect(() => {
    if (done) return

    const turn = script.reply[streamingTurnIndex]
    if (!turn) {
      setDone(true)
      return
    }

    if (reduced) {
      setPartialText(turn.content)
      const t = setTimeout(() => {
        setStreamingTurnIndex((i) => i + 1)
        setPartialText('')
      }, 200)
      return () => clearTimeout(t)
    }

    if (turn.role === 'user') {
      setPartialText(turn.content)
      const t = setTimeout(() => {
        setStreamingTurnIndex((i) => i + 1)
        setPartialText('')
      }, 600)
      return () => clearTimeout(t)
    }

    const pace = turn.pace ?? 18
    let i = 0
    const interval = window.setInterval(() => {
      i += 1
      setPartialText(turn.content.slice(0, i))
      if (i >= turn.content.length) {
        window.clearInterval(interval)
        setTimeout(() => {
          setStreamingTurnIndex((idx) => idx + 1)
          setPartialText('')
        }, 320)
      }
    }, pace)

    return () => window.clearInterval(interval)
  }, [script, streamingTurnIndex, reduced, done])

  useEffect(() => {
    const el = transcriptRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [streamingTurnIndex, partialText])

  const completedTurns = script.reply.slice(0, streamingTurnIndex)
  const currentTurn = script.reply[streamingTurnIndex]

  return (
    <section
      id="interactive-demo"
      aria-labelledby="interactive-demo-title"
      className={cn('border-border-subtle border-b py-24 lg:py-32', className)}
    >
      <div className="container-page flex flex-col gap-10">
        <div className="max-w-3xl">
          <span className="text-caption text-forge-orange font-mono uppercase tracking-[0.22em]">
            Interactive demo
          </span>
          <h2
            id="interactive-demo-title"
            className="font-display text-h1 text-text-primary mt-4 font-light"
          >
            Talk to a Forgely crew, no signup.
          </h2>
          <p className="text-body-lg text-text-secondary mt-4">
            Three short conversations show how Forgely turns a link, an idea or a Copilot request
            into a real action. Pick any script — the live Copilot lives in{' '}
            <span className="text-text-primary">{siteConfig.appHost}</span>.
          </p>
        </div>

        <div className="grid items-stretch gap-6 lg:grid-cols-[280px_1fr]">
          <ul className="flex flex-row gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
            {SCRIPTS.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => setActiveId(s.id)}
                  aria-pressed={activeId === s.id}
                  className={cn(
                    'flex w-full flex-col gap-1 rounded-xl border px-4 py-3 text-left transition',
                    activeId === s.id
                      ? 'border-forge-orange/60 bg-forge-orange/10 text-text-primary shadow-glow-forge'
                      : 'border-border-strong bg-bg-elevated text-text-secondary hover:border-forge-orange/40 hover:text-text-primary',
                  )}
                >
                  <span className="text-caption font-mono uppercase tracking-[0.18em]">
                    {s.title}
                  </span>
                  <span className="text-small">{s.prompt}</span>
                </button>
              </li>
            ))}
          </ul>

          <article
            aria-live="polite"
            className="border-border-strong bg-bg-deep relative flex min-h-[420px] flex-col overflow-hidden rounded-2xl border"
          >
            <header className="border-border-subtle bg-bg-elevated flex items-center justify-between border-b px-5 py-3">
              <span className="text-caption text-text-secondary inline-flex items-center gap-2 font-mono uppercase tracking-[0.22em]">
                <span
                  aria-hidden="true"
                  className="bg-forge-orange shadow-glow-forge h-2 w-2 rounded-full"
                />
                Forgely Copilot · demo
              </span>
              <Badge variant="forge">offline · scripted</Badge>
            </header>

            <div ref={transcriptRef} className="flex-1 space-y-4 overflow-y-auto p-5">
              {completedTurns.map((turn, i) => (
                <DemoBubble key={`${activeId}-done-${i}`} turn={turn} />
              ))}
              {!done && currentTurn ? (
                <DemoBubble turn={{ ...currentTurn, content: partialText || ' ' }} streaming />
              ) : null}
              {done ? (
                <div className="border-border-strong bg-bg-elevated/50 text-small text-text-secondary rounded-xl border border-dashed px-4 py-3">
                  <Sparkles
                    className="text-forge-orange mr-2 inline-block h-4 w-4"
                    aria-hidden="true"
                  />
                  This was a scripted preview. The real Copilot has tool access (orders, products,
                  theme, media, billing). Ready when you are.
                </div>
              ) : null}
            </div>

            <form
              id={formId}
              onSubmit={(e) => {
                e.preventDefault()
                setStreamingTurnIndex(0)
                setPartialText('')
                setDone(false)
              }}
              className="border-border-subtle bg-bg-elevated flex items-center gap-2 border-t px-3 py-3"
            >
              <input
                type="text"
                value={script.prompt}
                readOnly
                aria-readonly="true"
                aria-label="Demo prompt (read-only)"
                className="bg-bg-deep text-small text-text-secondary flex-1 rounded-md border border-transparent px-3 py-2"
              />
              <Button type="submit" variant="primary" size="sm">
                {done ? 'Replay' : 'Streaming'}
                {done ? (
                  <ArrowUp className="ml-1 h-4 w-4" aria-hidden="true" />
                ) : (
                  <Loader2 className="ml-1 h-4 w-4 animate-spin" aria-hidden="true" />
                )}
              </Button>
            </form>
          </article>
        </div>
      </div>
    </section>
  )
}

function DemoBubble({ turn, streaming = false }: { turn: DemoTurn; streaming?: boolean }) {
  const isUser = turn.role === 'user'
  return (
    <div className={cn('flex w-full', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'text-small max-w-[80%] rounded-xl px-4 py-3 leading-relaxed',
          isUser
            ? 'border-border-strong bg-bg-elevated text-text-primary border'
            : 'bg-bg-elevated text-text-secondary',
          streaming && !isUser
            ? 'after:bg-forge-orange after:ml-0.5 after:inline-block after:h-3 after:w-1.5 after:translate-y-0.5 after:animate-pulse after:content-[""]'
            : '',
        )}
      >
        {turn.content}
      </div>
    </div>
  )
}
