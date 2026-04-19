'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Icon } from '@/components/ui/icons'
import { cn } from '@/lib/cn'
import type { Site } from '@/lib/types'

interface SiteSwitcherProps {
  current: Site
  sites: Site[]
}

export function SiteSwitcher({ current, sites }: SiteSwitcherProps) {
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

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 items-center gap-2 rounded-md border border-border-strong bg-bg-elevated px-3 text-small text-text-primary hover:border-forge-orange/50"
      >
        <span className="grid h-6 w-6 place-items-center rounded bg-bg-deep text-body-lg">{current.thumbnail}</span>
        <span className="font-medium">{current.name}</span>
        <span className="font-mono text-caption text-text-muted">{current.domain}</span>
        <Icon.ChevronDown size={14} className="text-text-muted" />
      </button>

      {open ? (
        <div className="absolute left-0 top-[calc(100%+6px)] z-40 w-[320px] rounded-lg border border-border-subtle bg-bg-surface p-1 shadow-[0_24px_48px_rgba(0,0,0,0.7)]">
          <p className="px-3 pb-1 pt-2 font-mono text-caption uppercase tracking-[0.12em] text-text-muted">
            Switch site
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
                'flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-small transition-colors hover:bg-bg-elevated',
                s.id === current.id && 'bg-bg-elevated/60',
              )}
            >
              <span className="grid h-9 w-9 place-items-center rounded bg-bg-deep text-h3">{s.thumbnail}</span>
              <span className="flex flex-1 flex-col">
                <span className="font-medium text-text-primary">{s.name}</span>
                <span className="font-mono text-caption text-text-muted">{s.domain}</span>
              </span>
              <Badge tone={s.status === 'published' ? 'success' : s.status === 'building' ? 'warning' : 'neutral'} dot>
                {s.status}
              </Badge>
            </button>
          ))}
          <Link
            href="/sites"
            onClick={() => setOpen(false)}
            className="mt-1 flex items-center justify-between border-t border-border-subtle px-3 py-2 text-small text-text-secondary hover:text-text-primary"
          >
            <span className="inline-flex items-center gap-2">
              <Icon.Plus size={14} /> Create or import a site
            </span>
            <Icon.ChevronRight size={14} />
          </Link>
        </div>
      ) : null}
    </div>
  )
}
