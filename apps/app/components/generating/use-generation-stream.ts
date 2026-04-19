'use client'

import { useEffect, useRef, useState } from 'react'

import { SPELL_STEPS, STAGE_TO_INDEX, type SpellStatus } from './spell-steps'

interface StreamEvent {
  step: string
  ts?: string
  message?: string
  progress?: number
  error?: string
}

export interface GenerationStreamState {
  /** Per-step status keyed by `SPELL_STEPS[i].id`. */
  statuses: SpellStatus[]
  /** 0..1 overall progress for the gradient bar. */
  overall: number
  /** Latest server-supplied detail line (overrides defaults if present). */
  details: string[]
  /** True after the `finished` event arrives — page should redirect. */
  finished: boolean
  /** Any fatal stream error. */
  error: string | null
  /** True when /api/generation/[id]/stream is actively connected. */
  connected: boolean
  /** True when no real backend was reachable and we're scripting locally. */
  fakeMode: boolean
}

/**
 * Subscribe to the per-job SSE feed at `/api/generation/[id]/stream`.
 *
 * Falls back to a local "fake" timer that walks the 12 cards in order
 * if EventSource throws (no backend / 404 — typical local dev). This
 * lets the cinematic UI demo without `services/worker` running.
 */
export function useGenerationStream(generationId: string): GenerationStreamState {
  const [statuses, setStatuses] = useState<SpellStatus[]>(() =>
    SPELL_STEPS.map((_, i) => (i === 0 ? 'running' : 'pending')),
  )
  const [details, setDetails] = useState<string[]>(() => SPELL_STEPS.map((s) => s.detail))
  const [finished, setFinished] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [connected, setConnected] = useState(false)
  const [fakeMode, setFakeMode] = useState(false)
  const fakeTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Try the real EventSource first.
  useEffect(() => {
    if (!generationId) return
    let cancelled = false
    let es: EventSource | null = null
    try {
      es = new EventSource(`/api/generation/${generationId}/stream`)
    } catch {
      es = null
    }

    const handleStep = (raw: string) => {
      try {
        const evt = JSON.parse(raw) as StreamEvent
        const idx = STAGE_TO_INDEX[evt.step]
        if (typeof idx !== 'number') return
        setStatuses((prev) => {
          const next = [...prev]
          // Mark all earlier steps done, this one running, later pending
          for (let i = 0; i < next.length; i += 1) {
            if (i < idx) next[i] = 'done'
            else if (i === idx) next[i] = evt.step === 'finished' ? 'done' : 'running'
            else next[i] = 'pending'
          }
          return next
        })
        if (evt.message) {
          setDetails((prev) => {
            const next = [...prev]
            next[idx] = evt.message!
            return next
          })
        }
        if (evt.step === 'finished') setFinished(true)
        if (evt.error) setError(evt.error)
      } catch {
        /* ignore malformed events */
      }
    }

    if (es) {
      es.onopen = () => !cancelled && setConnected(true)
      es.addEventListener('step', (e) => handleStep((e as MessageEvent).data))
      es.addEventListener('done', () => setFinished(true))
      es.addEventListener('error', (e) => {
        // EventSource emits an error event whenever the connection closes
        // (server didn't open the stream, network drop, …). Once it's
        // failed twice we assume there's no real backend and fall over
        // to the scripted timer.
        if (cancelled) return
        const err = e as MessageEvent & { data?: unknown }
        if (typeof err.data === 'string') {
          handleStep(err.data)
        }
        if (es && es.readyState === EventSource.CLOSED) {
          setConnected(false)
          if (!fakeMode) {
            setFakeMode(true)
            startFakeTimer()
          }
        }
      })
    } else {
      setFakeMode(true)
      startFakeTimer()
    }

    function startFakeTimer() {
      if (fakeTimerRef.current) return
      let idx = 0
      fakeTimerRef.current = setInterval(() => {
        if (cancelled) return
        idx += 1
        setStatuses((prev) => {
          const next = [...prev]
          for (let i = 0; i < next.length; i += 1) {
            if (i < idx) next[i] = 'done'
            else if (i === idx) next[i] = i === SPELL_STEPS.length - 1 ? 'done' : 'running'
            else next[i] = 'pending'
          }
          return next
        })
        if (idx >= SPELL_STEPS.length - 1) {
          setFinished(true)
          if (fakeTimerRef.current) clearInterval(fakeTimerRef.current)
          fakeTimerRef.current = null
        }
      }, 1800)
    }

    return () => {
      cancelled = true
      es?.close()
      if (fakeTimerRef.current) {
        clearInterval(fakeTimerRef.current)
        fakeTimerRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [generationId])

  // Overall progress = (done + 0.5*running) / total
  const doneCount = statuses.filter((s) => s === 'done').length
  const runningCount = statuses.filter((s) => s === 'running').length
  const overall = Math.min(1, (doneCount + 0.5 * runningCount) / SPELL_STEPS.length)

  return { statuses, overall, details, finished, error, connected, fakeMode }
}
