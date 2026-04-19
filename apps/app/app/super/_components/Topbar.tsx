'use client'

import { useEffect, useState } from 'react'
import { StatusDot } from '@/components/super-ui'
import { formatTimestamp } from '@/lib/super'
import type { SuperSession } from '@/lib/super'

const ROLE_TONE = {
  OWNER: 'text-forge-orange',
  ADMIN: 'text-info',
  SUPPORT: 'text-text-secondary',
} as const

export function SuperTopbar({ session }: { session: SuperSession }) {
  const [now, setNow] = useState<number | null>(null)

  useEffect(() => {
    setNow(Date.now())
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [])

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-6 border-b border-border-subtle bg-bg-deep/95 px-6 backdrop-blur">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="font-display text-h3 text-forge-orange">⌬</span>
          <span className="font-mono text-small uppercase tracking-[0.24em] text-text-primary">
            Forgely Command
          </span>
        </div>
        <div className="hidden items-center gap-2 md:flex">
          <StatusDot tone="ok" />
          <span className="font-mono text-caption uppercase tracking-[0.18em] text-success">
            All systems ok
          </span>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="hidden items-center gap-2 md:flex">
          <StatusDot tone="live" pulse />
          <span className="font-mono text-caption uppercase tracking-[0.18em] text-info">
            LIVE
          </span>
          <span
            className="ml-2 font-mono text-caption tabular-nums text-text-secondary"
            suppressHydrationWarning
          >
            {now ? formatTimestamp(now) + ' UTC' : '—'}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-small text-text-primary">{session.name}</div>
            <div
              className={`font-mono text-caption uppercase tracking-[0.18em] ${ROLE_TONE[session.role]}`}
            >
              {session.role}
            </div>
          </div>
          <div className="grid h-9 w-9 place-items-center border border-border-strong bg-bg-elevated font-mono text-small text-forge-amber">
            {session.name
              .split(' ')
              .map((p) => p[0])
              .filter(Boolean)
              .slice(0, 2)
              .join('')}
          </div>
        </div>
      </div>
    </header>
  )
}
