'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

import { useCopilotContext } from '@/components/copilot/copilot-provider'
import { SPELL_STEPS, type SpellStatus } from '@/components/generating/spell-steps'
import { useGenerationStream } from '@/components/generating/use-generation-stream'
import { PageHeader } from '@/components/shell/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icons'
import { cn } from '@/lib/cn'

export default function GeneratingPage({ params }: { params: { siteId: string } }) {
  useCopilotContext({ kind: 'global' })
  const router = useRouter()
  // We use the siteId as the generationId for now — the real worker
  // job id lives in the URL once /generate.commit returns it. This
  // works for both fake-mode and live SSE.
  const stream = useGenerationStream(params.siteId)

  // Once everything is forged, give the user 1.5s to see the success
  // state then take them to the editor (where they can browse / tweak
  // their freshly generated site).
  useEffect(() => {
    if (!stream.finished) return
    const t = setTimeout(() => {
      router.push(`/sites/${params.siteId}/editor`)
    }, 1500)
    return () => clearTimeout(t)
  }, [stream.finished, router, params.siteId])

  const overallPct = Math.round(stream.overall * 100)

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <PageHeader
        eyebrow="Forging"
        title="Your site is being forged"
        description={`${SPELL_STEPS.length}-step pipeline. Average run is ~4 minutes; assets stream in as they finish.`}
        meta={
          <>
            <Badge
              tone={stream.fakeMode ? 'outline' : stream.connected ? 'success' : 'neutral'}
              dot
            >
              {stream.fakeMode ? 'demo mode' : stream.connected ? 'live' : 'connecting…'}
            </Badge>
            <span>·</span>
            <span>job</span>
            <span className="text-text-secondary font-mono">{params.siteId}</span>
            <span>·</span>
            <span className="text-forge-amber tabular-nums">{overallPct}%</span>
          </>
        }
        actions={
          stream.finished ? (
            <Button onClick={() => router.push(`/sites/${params.siteId}/editor`)}>
              <Icon.Sparkle size={14} /> Open editor
            </Button>
          ) : null
        }
      />

      {/* Progress bar */}
      <div
        role="progressbar"
        aria-valuenow={overallPct}
        aria-valuemin={0}
        aria-valuemax={100}
        className="bg-bg-elevated relative h-2 overflow-hidden rounded-full"
      >
        <div
          className="from-forge-orange via-forge-amber to-forge-gold absolute inset-y-0 left-0 bg-gradient-to-r transition-[width] duration-700 ease-out"
          style={{ width: `${overallPct}%` }}
        />
        <div className="scanline absolute inset-0 opacity-40 mix-blend-overlay" aria-hidden />
      </div>

      {stream.error ? (
        <div className="border-error/40 bg-error/10 text-small text-error rounded-md border p-3">
          ⚠ {stream.error}
        </div>
      ) : null}

      {/* 12 spell cards */}
      <ol className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {SPELL_STEPS.map((step, i) => (
          <SpellCard
            key={step.id}
            label={step.label}
            emoji={step.emoji}
            detail={stream.details[i] ?? step.detail}
            status={stream.statuses[i] ?? 'pending'}
            index={i + 1}
            total={SPELL_STEPS.length}
          />
        ))}
      </ol>

      {stream.finished ? (
        <div className="border-forge-orange/30 from-forge-orange/15 via-bg-surface to-bg-surface rounded-lg border bg-gradient-to-br p-5 text-center">
          <p className="font-display text-h2 text-text-primary">FORGED.</p>
          <p className="text-small text-text-secondary mt-2">
            Taking you to the editor in a moment so you can review and publish.
          </p>
        </div>
      ) : null}
    </div>
  )
}

interface CardProps {
  label: string
  emoji: string
  detail: string
  status: SpellStatus
  index: number
  total: number
}

function SpellCard({ label, emoji, detail, status, index, total }: CardProps) {
  const isRunning = status === 'running'
  const isDone = status === 'done'
  const isError = status === 'error'
  return (
    <li
      className={cn(
        'bg-bg-surface relative flex items-start gap-3 overflow-hidden rounded-lg border p-4 transition-all',
        isRunning && 'border-forge-orange/60 shadow-[0_0_24px_rgba(255,107,26,0.18)]',
        isDone && 'border-success/30 bg-bg-surface/60',
        isError && 'border-error/50 bg-error/5',
        !isRunning && !isDone && !isError && 'border-border-subtle',
      )}
    >
      {/* Animated halo for running step */}
      {isRunning ? (
        <span
          aria-hidden
          className="bg-forge-orange/15 pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full blur-3xl"
        />
      ) : null}

      <span
        className={cn(
          'text-h3 relative grid h-10 w-10 shrink-0 place-items-center rounded-md',
          isRunning && 'bg-forge-orange/15 text-forge-amber',
          isDone && 'bg-success/15 text-success',
          isError && 'bg-error/15 text-error',
          !isRunning && !isDone && !isError && 'bg-bg-deep text-text-muted',
        )}
      >
        {isDone ? <Icon.Check size={18} /> : emoji}
      </span>

      <div className="flex-1">
        <p className="text-small text-text-primary flex items-center gap-2 font-medium">
          <span className="text-caption text-text-muted font-mono">
            {String(index).padStart(2, '0')}/{String(total).padStart(2, '0')}
          </span>
          <span>{label}</span>
          {isRunning ? (
            <span
              className="bg-forge-orange ml-auto h-1.5 w-1.5 animate-pulse rounded-full"
              aria-hidden
            />
          ) : null}
        </p>
        <p className="text-small text-text-secondary mt-1 line-clamp-2">{detail}</p>
      </div>
    </li>
  )
}
