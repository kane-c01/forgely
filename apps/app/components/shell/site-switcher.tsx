'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Icon } from '@/components/ui/icons'
import { useT } from '@/lib/i18n'
import { cn } from '@/lib/cn'
import type { Site } from '@/lib/types'

interface SiteSwitcherProps {
  current: Site
  sites: Site[]
}

export function SiteSwitcher({ current, sites }: SiteSwitcherProps) {
  const t = useT()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    window.addEventListener('mousedown', onClick)
    return () => window.removeEventListener('mousedown', onClick)
  }, [open])

  const statusLabel = (s: Site['status']) =>
    s === 'published' ? t.siteSwitcher.published : t.siteSwitcher.building

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="border-border-strong bg-bg-elevated text-small text-text-primary hover:border-forge-orange/50 flex h-9 items-center gap-2 rounded-md border px-3"
      >
        <span className="bg-bg-deep text-body-lg grid h-6 w-6 place-items-center rounded">
          {current.thumbnail}
        </span>
        <span className="font-medium">{current.name}</span>
        <span className="text-caption text-text-muted font-mono">{current.domain}</span>
        <Icon.ChevronDown size={14} className="text-text-muted" />
      </button>

      {open ? (
        <div className="border-border-subtle bg-bg-surface absolute left-0 top-[calc(100%+6px)] z-40 w-[320px] rounded-lg border p-1 shadow-[0_24px_48px_rgba(0,0,0,0.7)]">
          <p className="text-caption text-text-muted px-3 pb-1 pt-2 font-mono uppercase tracking-[0.12em]">
            {t.siteSwitcher.switchSite}
          </p>
          {sites.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                setOpen(false)
                router.push(`/sites/${s.id}/products`)
              }}
              className={cn(
                'text-small hover:bg-bg-elevated flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors',
                s.id === current.id && 'bg-bg-elevated/60',
              )}
            >
              <span className="bg-bg-deep text-h3 grid h-9 w-9 place-items-center rounded">
                {s.thumbnail}
              </span>
              <span className="flex flex-1 flex-col">
                <span className="text-text-primary font-medium">{s.name}</span>
                <span className="text-caption text-text-muted font-mono">{s.domain}</span>
              </span>
              <Badge
                tone={
                  s.status === 'published'
                    ? 'success'
                    : s.status === 'building'
                      ? 'warning'
                      : 'neutral'
                }
                dot
              >
                {statusLabel(s.status)}
              </Badge>
            </button>
          ))}
          <Link
            href="/sites"
            onClick={() => setOpen(false)}
            className="border-border-subtle text-small text-text-secondary hover:text-text-primary mt-1 flex items-center justify-between border-t px-3 py-2"
          >
            <span className="inline-flex items-center gap-2">
              <Icon.Plus size={14} /> {t.siteSwitcher.createOrImport}
            </span>
            <Icon.ChevronRight size={14} />
          </Link>
        </div>
      ) : null}
    </div>
  )
}
