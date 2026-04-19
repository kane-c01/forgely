'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, Loader2, Sparkles, Zap } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  forgePipeline,
  totalCredits,
  totalDurationMs,
  type PipelineStep,
} from '@/lib/forge-pipeline'
import { cn } from '@/lib/cn'

type StepStatus = 'pending' | 'running' | 'done'

interface RunningState {
  active: number // index of step currently running
  visibleLines: number // how many lines of the active step are revealed
}

interface ForgePipelineRunnerProps {
  /**
   * Default URL surfaced in the input. Visible only — the simulation
   * does not actually call the network.
   */
  defaultUrl?: string
}

/**
 * Visualised "12-step spell-cast" — front-end-only simulation of the
 * Forgely Agent pipeline (docs/MASTER.md §5.4).
 *
 * Behaviour:
 *   - Click "Start forging" → walks through all 12 steps in sequence.
 *   - Each step's `thoughts` are revealed evenly across its `durationMs`,
 *     so a 6-second step with 4 lines reveals one line every 1.5s.
 *   - A status pill ticks pending → running → done as we progress.
 *   - The credit / time totals on the right tick up live.
 *   - `prefers-reduced-motion` skips the streaming and shows the final
 *     report instantly.
 */
export function ForgePipelineRunner({
  defaultUrl = 'https://toybloom.myshopify.com',
}: ForgePipelineRunnerProps) {
  const [url, setUrl] = useState(defaultUrl)
  const [reduced, setReduced] = useState(false)
  const [state, setState] = useState<{
    status: 'idle' | 'running' | 'done'
    progress: RunningState
  }>({
    status: 'idle',
    progress: { active: 0, visibleLines: 0 },
  })

  const startedAt = useRef<number | null>(null)
  const transcriptRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    setReduced(window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  }, [])

  useEffect(() => {
    if (state.status !== 'running') return

    const step = forgePipeline[state.progress.active]
    if (!step) {
      setState((s) => ({ ...s, status: 'done' }))
      return
    }

    if (reduced) {
      const next: RunningState = { active: state.progress.active + 1, visibleLines: 0 }
      const t = setTimeout(() => {
        setState({
          status: next.active >= forgePipeline.length ? 'done' : 'running',
          progress: next,
        })
      }, 80)
      return () => clearTimeout(t)
    }

    if (state.progress.visibleLines < step.thoughts.length) {
      const perLine = step.durationMs / step.thoughts.length
      const t = setTimeout(() => {
        setState((s) => ({
          ...s,
          progress: { ...s.progress, visibleLines: s.progress.visibleLines + 1 },
        }))
      }, perLine)
      return () => clearTimeout(t)
    }

    const t = setTimeout(() => {
      setState((s) => {
        const nextActive = s.progress.active + 1
        if (nextActive >= forgePipeline.length) return { status: 'done', progress: s.progress }
        return { status: 'running', progress: { active: nextActive, visibleLines: 0 } }
      })
    }, 240)
    return () => clearTimeout(t)
  }, [state, reduced])

  useEffect(() => {
    const el = transcriptRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [state.progress])

  const stepStatuses = useMemo<StepStatus[]>(() => {
    if (state.status === 'idle') return forgePipeline.map(() => 'pending')
    if (state.status === 'done') return forgePipeline.map(() => 'done')
    const { active } = state.progress
    return forgePipeline.map((_, i) => (i < active ? 'done' : i === active ? 'running' : 'pending'))
  }, [state])

  const consumedCredits = useMemo(() => {
    if (state.status === 'idle') return 0
    if (state.status === 'done') return totalCredits()
    return forgePipeline.slice(0, state.progress.active).reduce((s, step) => s + step.credits, 0)
  }, [state])

  const elapsedSec = useMemo(() => {
    if (state.status === 'idle' || !startedAt.current) return 0
    if (state.status === 'done') return Math.round(totalDurationMs() / 1000)
    return Math.round((Date.now() - startedAt.current) / 1000)
  }, [state])

  function start() {
    startedAt.current = Date.now()
    setState({ status: 'running', progress: { active: 0, visibleLines: 0 } })
  }

  function reset() {
    startedAt.current = null
    setState({ status: 'idle', progress: { active: 0, visibleLines: 0 } })
  }

  const activeStep = forgePipeline[state.progress.active]

  return (
    <section
      id="generate-runner"
      aria-labelledby="generate-runner-title"
      className="container-page flex flex-col gap-12 py-16 lg:py-24"
    >
      <header className="flex flex-col gap-4">
        <span className="text-caption text-forge-orange font-mono uppercase tracking-[0.22em]">
          Generate · live preview
        </span>
        <h1
          id="generate-runner-title"
          className="font-display text-display text-text-primary font-light leading-[1] tracking-tight"
        >
          Watch Forgely <span className="text-gradient-forge italic">forge</span> a brand in twelve
          quiet steps.
        </h1>
        <p className="text-body-lg text-text-secondary max-w-3xl">
          A faithful preview of the Agent pipeline — Scraper, Vision, Director, Planner, Copywriter,
          Artist, Compliance, SEO, Compiler, Deployer — all working in concert. The numbers, prompts
          and timings mirror the private-beta runtime; the live system is reserved for{' '}
          <span className="text-text-primary">app.forgely.com</span>.
        </p>
      </header>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (state.status === 'running') return
          start()
        }}
        className="border-border-strong bg-bg-deep flex w-full max-w-3xl flex-col gap-3 rounded-2xl border p-3 sm:flex-row sm:items-center"
        aria-label="Source URL for the simulation"
      >
        <input
          aria-label="Store URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={state.status === 'running'}
          className="bg-bg-elevated text-body text-text-primary placeholder:text-text-muted focus-visible:border-forge-orange focus-visible:ring-forge-orange/40 h-12 flex-1 rounded-md border border-transparent px-4 focus-visible:outline-none focus-visible:ring-2"
          placeholder="https://yourbrand.com"
        />
        <Button
          type="submit"
          variant="forge"
          size="lg"
          disabled={state.status === 'running'}
          className="h-12 px-6"
        >
          {state.status === 'running' ? (
            <>
              <Loader2 className="-ml-1 h-4 w-4 animate-spin" aria-hidden="true" />
              <span>Forging…</span>
            </>
          ) : (
            <>
              <Sparkles className="-ml-1 h-4 w-4" aria-hidden="true" />
              <span>Start the forge</span>
            </>
          )}
        </Button>
        {state.status !== 'idle' ? (
          <Button
            type="button"
            variant="ghost"
            size="lg"
            className="h-12"
            onClick={reset}
            disabled={state.status === 'running'}
          >
            Reset
          </Button>
        ) : null}
      </form>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <ol className="border-border-strong bg-bg-deep flex flex-col overflow-hidden rounded-2xl border">
          {forgePipeline.map((step, i) => (
            <PipelineRow
              key={step.index}
              step={step}
              status={stepStatuses[i] ?? 'pending'}
              isActive={i === state.progress.active && state.status === 'running'}
              visibleLines={
                i === state.progress.active ? state.progress.visibleLines : step.thoughts.length
              }
              showAllLines={state.status === 'done' || stepStatuses[i] === 'done'}
            />
          ))}
        </ol>

        <aside className="border-border-strong bg-bg-deep flex flex-col gap-4 self-start rounded-2xl border p-6">
          <SummaryRow
            label="Steps"
            value={`${Math.min(state.progress.active + (state.status === 'running' ? 1 : 0), forgePipeline.length)} / ${forgePipeline.length}`}
          />
          <SummaryRow
            label="Credits"
            value={consumedCredits.toLocaleString()}
            hint={`of ${totalCredits().toLocaleString()}`}
          />
          <SummaryRow
            label="Elapsed"
            value={`${elapsedSec}s`}
            hint={`~ ${Math.round(totalDurationMs() / 1000)}s total`}
          />
          <SummaryRow
            label="Status"
            value={
              state.status === 'idle'
                ? 'Idle'
                : state.status === 'running'
                  ? (activeStep?.label ?? 'Running')
                  : 'Live'
            }
            tone={state.status === 'done' ? 'forge' : 'default'}
          />

          {state.status === 'done' ? (
            <div
              ref={transcriptRef}
              className="border-forge-orange/40 bg-forge-orange/10 text-small text-forge-amber rounded-xl border p-4"
            >
              <Zap className="mr-1 inline-block h-4 w-4" aria-hidden="true" />
              <span className="font-mono uppercase tracking-[0.18em]">Live</span>
              <p className="text-text-primary mt-2">
                <a href="https://toybloom.forgely.app" target="_blank" rel="noreferrer">
                  toybloom.forgely.app
                </a>
              </p>
              <p className="text-caption text-text-muted mt-1">
                Cloudflare Pages · SSL ✓ · Medusa store linked · 12 products imported
              </p>
            </div>
          ) : null}
        </aside>
      </div>
    </section>
  )
}

function PipelineRow({
  step,
  status,
  isActive,
  visibleLines,
  showAllLines,
}: {
  step: PipelineStep
  status: StepStatus
  isActive: boolean
  visibleLines: number
  showAllLines: boolean
}) {
  const lines = showAllLines ? step.thoughts : step.thoughts.slice(0, visibleLines)
  return (
    <li
      className={cn(
        'border-border-subtle flex flex-col gap-3 border-b px-5 py-4 transition last:border-b-0',
        isActive ? 'bg-forge-orange/5' : status === 'done' ? 'bg-bg-deep' : 'bg-bg-deep/60',
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span
            className={cn(
              'text-caption grid h-8 w-8 place-items-center rounded-full font-mono font-semibold',
              status === 'done'
                ? 'bg-forge-orange text-bg-void'
                : status === 'running'
                  ? 'border-forge-orange/60 text-forge-orange border'
                  : 'border-border-strong text-text-muted border',
            )}
          >
            {status === 'done' ? (
              <Check className="h-4 w-4" aria-hidden="true" />
            ) : (
              String(step.index).padStart(2, '0')
            )}
          </span>
          <div className="flex flex-col">
            <span className="text-body text-text-primary font-medium">{step.label}</span>
            <span className="text-caption text-text-muted">{step.agent}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {step.credits > 0 ? (
            <span className="text-caption text-text-muted font-mono uppercase tracking-[0.18em]">
              {step.credits} credits
            </span>
          ) : (
            <span className="text-caption text-text-muted font-mono uppercase tracking-[0.18em]">
              free
            </span>
          )}
          <span className="text-caption text-text-muted font-mono uppercase tracking-[0.18em]">
            {Math.round(step.durationMs / 1000)}s
          </span>
        </div>
      </div>
      {(isActive || showAllLines) && lines.length > 0 ? (
        <ul className="text-small text-text-secondary space-y-1.5 pl-11">
          {lines.map((line, i) => (
            <li key={i} className="flex items-start gap-2">
              <span
                aria-hidden="true"
                className="bg-forge-orange mt-1.5 h-1 w-1 shrink-0 rounded-full"
              />
              <span>{line}</span>
            </li>
          ))}
          {isActive && !showAllLines && lines.length < step.thoughts.length ? (
            <li className="text-caption text-text-muted ml-3 inline-flex items-center gap-2 font-mono uppercase tracking-[0.18em]">
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              thinking…
            </li>
          ) : null}
        </ul>
      ) : null}
    </li>
  )
}

function SummaryRow({
  label,
  value,
  hint,
  tone = 'default',
}: {
  label: string
  value: string
  hint?: string
  tone?: 'default' | 'forge'
}) {
  return (
    <div className="border-border-subtle flex items-baseline justify-between border-b pb-3 last:border-b-0 last:pb-0">
      <div className="text-caption text-text-muted font-mono uppercase tracking-[0.2em]">
        {label}
      </div>
      <div className="text-right">
        {tone === 'forge' ? (
          <Badge tone="forge">{value}</Badge>
        ) : (
          <div className="text-body-lg text-text-primary font-mono">{value}</div>
        )}
        {hint ? <div className="text-caption text-text-muted">{hint}</div> : null}
      </div>
    </div>
  )
}
