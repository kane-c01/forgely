'use client'

import { useEffect, useState } from 'react'
import { StatusDot } from '@/components/super-ui'
import { useT } from '@/lib/i18n'
import { formatTimestamp } from '@/lib/super'
import type { SuperSession } from '@/lib/super'

import { SuperLocaleSwitcher } from './LocaleSwitcher'

const ROLE_TONE = {
  OWNER: 'text-forge-orange',
  ADMIN: 'text-info',
  SUPPORT: 'text-text-secondary',
} as const

export function SuperTopbar({ session }: { session: SuperSession }) {
  const t = useT()
  const [now, setNow] = useState<number | null>(null)

  useEffect(() => {
    setNow(Date.now())
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [])

  return (
    <header className="border-border-subtle bg-bg-deep/95 sticky top-0 z-30 flex h-14 items-center justify-between gap-6 border-b px-6 backdrop-blur">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="font-display text-h3 text-forge-orange">⌬</span>
          <span className="text-small text-text-primary font-mono uppercase tracking-[0.24em]">
            Forgely Command
          </span>
        </div>
        <div className="hidden items-center gap-2 md:flex">
          <StatusDot tone="ok" />
          <span className="text-caption text-success font-mono uppercase tracking-[0.18em]">
            {t.super.health.statusAllSystemsOk}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-5">
        <SuperLocaleSwitcher />

        <div className="hidden items-center gap-2 md:flex">
          <StatusDot tone="live" pulse />
          <span className="text-caption text-info font-mono uppercase tracking-[0.18em]">LIVE</span>
          <span
            className="text-caption text-text-secondary ml-2 font-mono tabular-nums"
            suppressHydrationWarning
          >
            {now ? formatTimestamp(now) + ' UTC' : '—'}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-small text-text-primary">{session.name}</div>
            <div
              className={`text-caption font-mono uppercase tracking-[0.18em] ${ROLE_TONE[session.role]}`}
            >
              {session.role}
            </div>
          </div>
          <div className="border-border-strong bg-bg-elevated text-small text-forge-amber grid h-9 w-9 place-items-center border font-mono">
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
