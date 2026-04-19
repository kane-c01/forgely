'use client'

import { useEffect, useRef, useState } from 'react'
import { Badge, SectionCard, StatusDot } from '@/components/super-ui'
import { formatRelative, formatTime, formatUsd } from '@/lib/super'
import type { ActivityEvent, ActivityType } from '@/lib/super'

const TYPE_TONE: Record<ActivityType, 'forge' | 'info' | 'success' | 'warning' | 'neutral' | 'error'> = {
  user_signup: 'info',
  subscription_upgrade: 'forge',
  subscription_downgrade: 'warning',
  credits_purchase: 'success',
  site_published: 'info',
  refund_issued: 'error',
  super_login: 'neutral',
}

const TYPE_LABEL: Record<ActivityType, string> = {
  user_signup: 'signup',
  subscription_upgrade: 'upgrade',
  subscription_downgrade: 'downgrade',
  credits_purchase: 'credits',
  site_published: 'publish',
  refund_issued: 'refund',
  super_login: 'super',
}

export function LiveActivityFeed({
  initial,
  maxRows = 60,
}: {
  initial: ActivityEvent[]
  maxRows?: number
}) {
  const [events, setEvents] = useState<ActivityEvent[]>(initial)
  const [paused, setPaused] = useState(false)
  const [connected, setConnected] = useState(false)
  const sourceRef = useRef<EventSource | null>(null)

  useEffect(() => {
    if (paused) {
      sourceRef.current?.close()
      sourceRef.current = null
      setConnected(false)
      return
    }
    if (typeof window === 'undefined') return
    if (sourceRef.current) return

    const src = new EventSource('/super/api/live')
    sourceRef.current = src
    src.onopen = () => setConnected(true)
    src.onerror = () => setConnected(false)
    src.addEventListener('activity', (raw) => {
      try {
        const event = JSON.parse((raw as MessageEvent).data) as ActivityEvent
        setEvents((prev) => [event, ...prev].slice(0, maxRows))
      } catch {
        // ignore malformed payload
      }
    })
    return () => {
      src.close()
      sourceRef.current = null
      setConnected(false)
    }
  }, [paused, maxRows])

  return (
    <SectionCard
      title={
        <span className="inline-flex items-center gap-2">
          <StatusDot tone={connected ? 'live' : 'idle'} pulse={connected} />
          Live activity
        </span>
      }
      action={
        <button
          type="button"
          onClick={() => setPaused((p) => !p)}
          className="font-mono text-caption uppercase tracking-[0.16em] text-text-muted hover:text-text-primary"
        >
          {paused ? 'Resume' : 'Pause'}
        </button>
      }
      bodyClassName="p-0"
    >
      <ul className="max-h-[28rem] overflow-y-auto">
        {events.length === 0 && (
          <li className="px-5 py-6 text-center text-small text-text-muted">
            Waiting for events…
          </li>
        )}
        {events.map((event, idx) => (
          <li
            key={event.id}
            className={
              'grid grid-cols-[64px_60px_1fr_auto] items-center gap-3 px-5 py-2' +
              (idx === events.length - 1 ? '' : ' border-b border-border-subtle')
            }
          >
            <span className="font-mono text-caption tabular-nums text-text-muted">
              {formatTime(event.occurredAt)}
            </span>
            <Badge tone={TYPE_TONE[event.type]}>{TYPE_LABEL[event.type]}</Badge>
            <span className="truncate text-small text-text-primary">
              <span className="font-mono text-text-secondary">{event.actor.label}</span>{' '}
              <span className="text-text-muted">{event.description}</span>
            </span>
            <span className="font-mono text-small tabular-nums text-forge-amber">
              {event.amountUsd != null ? formatUsd(event.amountUsd) : ''}
            </span>
          </li>
        ))}
      </ul>
      <footer className="border-t border-border-subtle px-5 py-2 font-mono text-caption uppercase tracking-[0.16em] text-text-muted">
        {events.length} event{events.length === 1 ? '' : 's'} · stream{' '}
        {paused ? 'paused' : connected ? 'connected' : 'connecting…'} ·{' '}
        {events[0] ? formatRelative(events[0].occurredAt) : 'no data'}
      </footer>
    </SectionCard>
  )
}
