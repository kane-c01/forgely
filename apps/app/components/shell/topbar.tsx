'use client'

import { useCommandPalette } from '@/components/command/command-palette-context'
import { Badge } from '@/components/ui/badge'
import { Icon } from '@/components/ui/icons'
import type { Site } from '@/lib/types'

import { SiteSwitcher } from './site-switcher'

interface TopBarProps {
  currentSite: Site
  sites: Site[]
  credits: number
}

export function TopBar({ currentSite, sites, credits }: TopBarProps) {
  const palette = useCommandPalette()
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-4 border-b border-border-subtle bg-bg-void/80 px-6 backdrop-blur">
      <SiteSwitcher current={currentSite} sites={sites} />

      <button
        type="button"
        onClick={() => palette.setOpen(true)}
        className="group relative flex h-9 max-w-md flex-1 items-center gap-2 rounded-md border border-border-strong bg-bg-deep pl-3 pr-2 text-left transition-colors hover:border-forge-orange/40"
      >
        <Icon.Search size={14} className="text-text-muted group-hover:text-forge-amber" />
        <span className="flex-1 truncate font-mono text-caption uppercase tracking-[0.08em] text-text-subtle">
          Search products, orders, customers…
        </span>
        <span className="rounded border border-border-strong bg-bg-elevated px-1.5 py-0.5 font-mono text-[10px] text-text-muted">
          ⌘K
        </span>
      </button>

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
