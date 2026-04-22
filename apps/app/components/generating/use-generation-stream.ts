'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { SPELL_STEPS, STEP_INDEX, type SpellStatus, type StepId } from './spell-steps'

interface StepWirePayload {
  id?: string
  step: StepId | string
  status: SpellStatus
  ts: number
  payload?: Record<string, unknown>
  errorMessage?: string
}

interface StatusSnapshot {
  generationId?: string
  id?: string
  siteId?: string
  status?: string
  errorMessage?: string | null
  steps: Array<{
    stepName: string
    status: SpellStatus | string
    errorMessage: string | null
    payload?: unknown
  }>
}

export type StepFailure = {
  step: StepId
  message: string
}

export interface GenerationStreamState {
  /** Per-step status keyed by `SPELL_STEPS[i].id`. */
  statuses: SpellStatus[]
  /** 0..1 overall progress for the gradient bar. */
  overall: number
  /** Latest server-supplied detail per step (overrides defaults). */
  details: string[]
  /** Terminal success — safe to redirect. */
  finished: boolean
  /** Any fatal stream / pipeline error surfaced to the user. */
  error: string | null
  /** Currently-failed step (if any) — drives the Retry CTA. */
  failure: StepFailure | null
  /** True while the SSE connection is alive. */
  connected: boolean
  /** Fallback — no backend reachable, we're scripting locally. */
  fakeMode: boolean
  /** True while HTTP polling (SSE degraded to `/status`). */
  polling: boolean
}

const POLL_INTERVAL_MS = 2000
const IS_DONE = new Set<SpellStatus>(['succeeded', 'skipped'])

/**
 * Subscribe to the 12-step pipeline events at
 * `/api/generation/[id]/stream`. Falls back in this order:
 *
 *   1. EventSource SSE (primary)
 *   2. HTTP polling `/api/generation/[id]/status` every 2s (degraded
 *      fallback when SSE is unreachable or proxies strip text/event-stream)
 *   3. A local scripted timer that walks the 12 cards (dev / mock mode
 *      when neither the worker nor the DB has any events at all)
 */
export function useGenerationStream(generationId: string): GenerationStreamState {
  const [statuses, setStatuses] = useState<SpellStatus[]>(() =>
    SPELL_STEPS.map(() => 'queued' as SpellStatus),
  )
  const [details, setDetails] = useState<string[]>(() => SPELL_STEPS.map((s) => s.detail))
  const [finished, setFinished] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [failure, setFailure] = useState<StepFailure | null>(null)
  const [connected, setConnected] = useState(false)
  const [fakeMode, setFakeMode] = useState(false)
  const [polling, setPolling] = useState(false)
  const fakeTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const applyWireEvent = useCallback((evt: StepWirePayload) => {
    const idx = STEP_INDEX[evt.step as StepId]
    if (typeof idx !== 'number') return
    setStatuses((prev) => {
      const next = [...prev]
      next[idx] = evt.status
      // Auto-advance: once a step is `succeeded|skipped`, mark earlier
      // unchecked steps as succeeded too (we can drop events under load).
      if (IS_DONE.has(evt.status)) {
        for (let i = 0; i < idx; i += 1) {
          if (next[i] === 'queued' || next[i] === 'running') next[i] = 'succeeded'
        }
      }
      return next
    })
    if (evt.payload && typeof evt.payload === 'object') {
      const detail = pickDetail(evt.payload)
      if (detail) {
        setDetails((prev) => {
          const next = [...prev]
          next[idx] = detail
          return next
        })
      }
    }
    if (evt.status === 'failed') {
      setFailure({ step: evt.step as StepId, message: evt.errorMessage ?? 'Step failed.' })
      setError(evt.errorMessage ?? 'Step failed.')
    }
    if (
      (evt.step === 'compliance' && evt.status === 'succeeded') ||
      (evt.step === 'compliance' && evt.status === 'skipped')
    ) {
      setFinished(true)
    }
  }, [])

  const applySnapshot = useCallback((snap: StatusSnapshot) => {
    if (!snap?.steps) return
    const next: SpellStatus[] = SPELL_STEPS.map(() => 'queued')
    const nextDetails = SPELL_STEPS.map((s) => s.detail)
    let failed: StepFailure | null = null
    for (const row of snap.steps) {
      const idx = STEP_INDEX[row.stepName as StepId]
      if (typeof idx !== 'number') continue
      next[idx] = (row.status as SpellStatus) ?? 'queued'
      if (row.status === 'failed') {
        failed = { step: row.stepName as StepId, message: row.errorMessage ?? 'Step failed.' }
      }
      if (row.payload && typeof row.payload === 'object') {
        const detail = pickDetail(row.payload as Record<string, unknown>)
        if (detail) nextDetails[idx] = detail
      }
    }
    setStatuses(next)
    setDetails(nextDetails)
    setFailure(failed)
    if (failed) setError(failed.message)
    const last = next[next.length - 1]
    if (last === 'succeeded' || last === 'skipped') setFinished(true)
  }, [])

  const startFakeTimer = useCallback(() => {
    if (fakeTimerRef.current) return
    let idx = 0
    fakeTimerRef.current = setInterval(() => {
      idx += 1
      setStatuses((prev) => {
        const next = [...prev]
        for (let i = 0; i < next.length; i += 1) {
          if (i < idx) next[i] = 'succeeded'
          else if (i === idx) next[i] = i === SPELL_STEPS.length - 1 ? 'succeeded' : 'running'
          else next[i] = 'queued'
        }
        return next
      })
      if (idx >= SPELL_STEPS.length - 1) {
        setFinished(true)
        if (fakeTimerRef.current) clearInterval(fakeTimerRef.current)
        fakeTimerRef.current = null
      }
    }, 1500)
  }, [])

  const startPolling = useCallback(() => {
    if (pollTimerRef.current || !generationId) return
    setPolling(true)
    const tick = async () => {
      try {
        const res = await fetch(`/api/generation/${generationId}/status`, {
          cache: 'no-store',
        })
        if (!res.ok) throw new Error(`status ${res.status}`)
        const data = (await res.json()) as StatusSnapshot
        applySnapshot(data)
        const done = data.steps.every(
          (s) => s.status === 'succeeded' || s.status === 'skipped' || s.status === 'failed',
        )
        if (done) {
          setFinished(data.steps.every((s) => s.status !== 'failed'))
          if (pollTimerRef.current) clearInterval(pollTimerRef.current)
          pollTimerRef.current = null
          setPolling(false)
        }
      } catch (err) {
        // DB unreachable too — drop to the fake timer as a last resort.
        console.warn('[use-generation-stream] polling failed:', (err as Error).message)
        if (pollTimerRef.current) clearInterval(pollTimerRef.current)
        pollTimerRef.current = null
        setPolling(false)
        if (!fakeMode) {
          setFakeMode(true)
          startFakeTimer()
        }
      }
    }
    void tick()
    pollTimerRef.current = setInterval(tick, POLL_INTERVAL_MS)
  }, [applySnapshot, fakeMode, generationId, startFakeTimer])

  useEffect(() => {
    if (!generationId) return
    let cancelled = false
    let es: EventSource | null = null
    let sseErrored = false

    try {
      es = new EventSource(`/api/generation/${generationId}/stream`)
    } catch {
      es = null
    }

    const onStep = (e: MessageEvent) => {
      try {
        const raw = JSON.parse(e.data) as StepWirePayload
        applyWireEvent(raw)
      } catch {
        /* swallow malformed frame */
      }
    }
    const onDone = () => setFinished(true)
    const onFatal = () => {
      if (cancelled || !es) return
      if (es.readyState === EventSource.CLOSED) {
        setConnected(false)
        if (!sseErrored) {
          sseErrored = true
          // SSE dead — degrade to polling. If that's also dead the
          // polling path will kick on the fake timer.
          startPolling()
        }
      }
    }

    if (es) {
      es.onopen = () => {
        if (cancelled) return
        setConnected(true)
      }
      es.addEventListener('step', onStep as EventListener)
      es.addEventListener('done', onDone)
      es.addEventListener('error', onFatal as EventListener)
    } else {
      startPolling()
    }

    return () => {
      cancelled = true
      es?.close()
      if (fakeTimerRef.current) {
        clearInterval(fakeTimerRef.current)
        fakeTimerRef.current = null
      }
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current)
        pollTimerRef.current = null
      }
    }
  }, [applyWireEvent, generationId, startPolling])

  const doneCount = statuses.filter((s) => s === 'succeeded' || s === 'skipped').length
  const runningCount = statuses.filter((s) => s === 'running').length
  const overall = Math.min(1, (doneCount + 0.5 * runningCount) / SPELL_STEPS.length)

  return {
    statuses,
    overall,
    details,
    finished,
    error,
    failure,
    connected,
    fakeMode,
    polling,
  }
}

/** Derive a one-line detail string from a free-form step payload. */
function pickDetail(payload: Record<string, unknown>): string | null {
  if (typeof payload.message === 'string') return payload.message
  if (typeof payload.url === 'string') return payload.url
  if (Array.isArray(payload.palette)) return `Palette: ${(payload.palette as string[]).join(' · ')}`
  if (typeof payload.assetCount === 'number')
    return `${payload.assetCount} asset${payload.assetCount === 1 ? '' : 's'} rendered`
  if (typeof payload.productCount === 'number')
    return `${payload.productCount} product${payload.productCount === 1 ? '' : 's'}`
  if (typeof payload.progress === 'number')
    return `Progress: ${Math.round((payload.progress as number) * 100)}%`
  return null
}
