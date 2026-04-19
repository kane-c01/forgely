'use client'

import { Badge } from '@/components/ui/badge'
import { Icon } from '@/components/ui/icons'
import { Input } from '@/components/ui/input'
import type { Site } from '@/lib/types'

import { SiteSwitcher } from './site-switcher'

interface TopBarProps {
  currentSite: Site
  sites: Site[]
  credits: number
}

export function TopBar({ currentSite, sites, credits }: TopBarProps) {
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-4 border-b border-border-subtle bg-bg-void/80 px-6 backdrop-blur">
      <SiteSwitcher current={currentSite} sites={sites} />

      <div className="relative max-w-md flex-1">
        <Icon.Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
        <Input
          placeholder="Search products, orders, customers…"
          className="pl-8 font-mono text-caption uppercase tracking-[0.08em] placeholder:text-text-subtle"
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded border border-border-strong px-1.5 py-0.5 font-mono text-[10px] text-text-muted">
          ⌘K
        </span>
      </div>

      <div className="flex items-center gap-2">
        <Badge tone="forge" dot>
          {credits.toLocaleString()} credits
        </Badge>
        <button
          type="button"
          aria-label="Notifications"
          className="grid h-9 w-9 place-items-center rounded-md border border-border-subtle bg-bg-elevated text-text-secondary hover:border-border-strong hover:text-text-primary"
        >
          <Icon.Bell size={16} />
        </button>
      </div>
    </header>
  )
}
