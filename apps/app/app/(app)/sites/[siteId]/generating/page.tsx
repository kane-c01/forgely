'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

import { useCopilotContext } from '@/components/copilot/copilot-provider'
import { SPELL_STEPS, type SpellStatus } from '@/components/generating/spell-steps'
import { useGenerationStream } from '@/components/generating/use-generation-stream'
import { PageHeader } from '@/components/shell/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icons'
import { cn } from '@/lib/cn'
import { trpc } from '@/lib/trpc'

export default function GeneratingPage({ params }: { params: { siteId: string } }) {
  useCopilotContext({ kind: 'global' })
  const router = useRouter()
  const searchParams = useSearchParams()
  const urlGenerationId = searchParams?.get('gen') ?? null
  const [resolvedId, setResolvedId] = useState<string>(urlGenerationId ?? params.siteId)

  // When the URL doesn't carry `?gen=`, fall back to the site's latest
  // generation so a direct link to /sites/foo/generating still works.
  const latest = trpc.generation.latestForSite.useQuery(
    { siteId: params.siteId },
    {
      enabled: !urlGenerationId,
      refetchOnWindowFocus: false,
      retry: false,
    },
  )

  useEffect(() => {
    if (urlGenerationId) return
    if (latest.data?.id && latest.data.id !== resolvedId) setResolvedId(latest.data.id)
  }, [latest.data, resolvedId, urlGenerationId])

  const stream = useGenerationStream(resolvedId)
  const retryMutation = trpc.generation.retry.useMutation()
  const utils = trpc.useUtils?.() ?? trpc.useContext()

  const overallPct = Math.round(stream.overall * 100)
  const badgeTone = stream.fakeMode
    ? 'outline'
    : stream.connected
      ? 'success'
      : stream.polling
        ? 'warning'
        : 'neutral'
  const badgeLabel = stream.fakeMode
    ? 'demo mode'
    : stream.connected
      ? 'live'
      : stream.polling
        ? 'polling'
        : 'connecting…'

  // Once every step is forged, park on the success state for 1.2s then
  // ship the user to the freshly generated site. Failures stay on page.
  useEffect(() => {
    if (!stream.finished || stream.failure) return
    const t = setTimeout(() => {
      router.push(`/sites/${params.siteId}`)
    }, 1200)
    return () => clearTimeout(t)
  }, [stream.finished, stream.failure, router, params.siteId])

  const visibleSteps = useMemo(
    () =>
      SPELL_STEPS.map((step, i) => ({
        ...step,
        status: stream.statuses[i] ?? 'queued',
        detail: stream.details[i] ?? step.detail,
        errorMessage: stream.failure?.step === step.id ? stream.failure.message : undefined,
      })),
    [stream.statuses, stream.details, stream.failure],
  )

  const onRetry = async () => {
    try {
      await retryMutation.mutateAsync({ id: resolvedId })
      await utils.generation.latestForSite.invalidate({ siteId: params.siteId })
      // Re-mount the hook by forcing a fresh id (same value triggers
      // React to re-run the effect because the dep list includes the
      // fresh retry counter).
      setResolvedId((prev) => prev + '?retry=' + Date.now())
      setTimeout(() => setResolvedId(resolvedId), 0)
    } catch (err) {
      console.error('[generating] retry failed', err)
    }
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <PageHeader
        eyebrow="Forging"
        title="Your site is being forged"
        description={`${SPELL_STEPS.length}-step pipeline. Streaming live progress — assets land as they finish.`}
        meta={
          <>
            <Badge tone={badgeTone} dot>
              {badgeLabel}
            </Badge>
            <span>·</span>
            <span>job</span>
            <span className="text-text-secondary font-mono">{resolvedId}</span>
            <span>·</span>
            <span className="text-forge-amber tabular-nums">{overallPct}%</span>
          </>
        }
        actions={
          stream.finished && !stream.failure ? (
            <Button onClick={() => router.push(`/sites/${params.siteId}`)}>
              <Icon.Sparkle size={14} /> Open site
            </Button>
          ) : stream.failure ? (
            <Button onClick={onRetry} loading={retryMutation.isPending}>
              <Icon.Sparkle size={14} /> Retry
            </Button>
          ) : null
        }
      />

      <div
        role="progressbar"
        aria-valuenow={overallPct}
        aria-valuemin={0}
        aria-valuemax={100}
        className="bg-bg-elevated relative h-2 overflow-hidden rounded-full"
      >
        <div
          className={cn(
            'absolute inset-y-0 left-0 bg-gradient-to-r transition-[width] duration-700 ease-out',
            stream.failure
              ? 'from-error/80 via-error to-error/70'
              : 'from-forge-orange via-forge-amber to-forge-gold',
          )}
          style={{ width: `${overallPct}%` }}
        />
        <div className="scanline absolute inset-0 opacity-40 mix-blend-overlay" aria-hidden />
      </div>

      {stream.failure ? (
        <div className="border-error/40 bg-error/10 text-small text-error rounded-md border p-4">
          <p className="font-medium">Generation halted at “{stream.failure.step}”</p>
          <p className="mt-1 opacity-90">{stream.failure.message}</p>
        </div>
      ) : stream.error ? (
        <div className="border-warning/40 bg-warning/10 text-small text-warning rounded-md border p-3">
          ⚠ {stream.error}
        </div>
      ) : null}

      <ol className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {visibleSteps.map((step, i) => (
          <SpellCard
            key={step.id}
            label={step.label}
            emoji={step.emoji}
            detail={step.detail}
            status={step.status}
            errorMessage={step.errorMessage}
            index={i + 1}
            total={SPELL_STEPS.length}
            onRetry={step.status === 'failed' ? onRetry : undefined}
          />
        ))}
      </ol>

      {stream.finished && !stream.failure ? (
        <div className="border-forge-orange/30 from-forge-orange/15 via-bg-surface to-bg-surface rounded-lg border bg-gradient-to-br p-5 text-center">
          <p className="font-display text-h2 text-text-primary">FORGED.</p>
          <p className="text-small text-text-secondary mt-2">
            Taking you to your new site in a moment.
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
  errorMessage?: string
  index: number
  total: number
  onRetry?: () => void
}

function SpellCard({
  label,
  emoji,
  detail,
  status,
  errorMessage,
  index,
  total,
  onRetry,
}: CardProps) {
  const isRunning = status === 'running'
  const isDone = status === 'succeeded' || status === 'skipped'
  const isError = status === 'failed'
  const isSkipped = status === 'skipped'
  return (
    <li
      className={cn(
        'bg-bg-surface relative flex items-start gap-3 overflow-hidden rounded-lg border p-4 transition-all',
        isRunning && 'border-forge-orange/60 shadow-[0_0_24px_rgba(255,107,26,0.18)]',
        isDone && !isSkipped && 'border-success/30 bg-bg-surface/60',
        isSkipped && 'border-border-subtle/60 opacity-60',
        isError && 'border-error/50 bg-error/5',
        !isRunning && !isDone && !isError && 'border-border-subtle',
      )}
    >
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
          isDone && !isSkipped && 'bg-success/15 text-success',
          isSkipped && 'bg-bg-deep text-text-muted',
          isError && 'bg-error/15 text-error',
          !isRunning && !isDone && !isError && 'bg-bg-deep text-text-muted',
        )}
      >
        {isDone && !isSkipped ? (
          <Icon.Check size={18} />
        ) : isError ? (
          <Icon.Close size={18} />
        ) : (
          emoji
        )}
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
          {isSkipped ? <span className="text-caption text-text-muted ml-auto">skipped</span> : null}
        </p>
        <p className="text-small text-text-secondary mt-1 line-clamp-2">{detail}</p>
        {isError && errorMessage ? (
          <p className="text-caption text-error mt-2 line-clamp-2">{errorMessage}</p>
        ) : null}
        {isError && onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="text-caption text-error hover:text-error/80 mt-2 inline-flex items-center gap-1 underline underline-offset-2"
          >
            Retry
          </button>
        ) : null}
      </div>
    </li>
  )
}
