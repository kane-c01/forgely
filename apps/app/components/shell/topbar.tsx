'use client'

import { useCommandPalette } from '@/components/command/command-palette-context'
import { Badge } from '@/components/ui/badge'
import { Icon } from '@/components/ui/icons'
import { useT } from '@/lib/i18n'
import type { Site } from '@/lib/types'

import { SiteSwitcher } from './site-switcher'

interface TopBarProps {
  currentSite: Site
  sites: Site[]
  credits: number
  onMenuClick?: () => void
}

export function TopBar({ currentSite, sites, credits, onMenuClick }: TopBarProps) {
  const palette = useCommandPalette()
  const t = useT()
  return (
    <header className="border-border-subtle bg-bg-void/80 sticky top-0 z-20 flex h-14 items-center gap-2 border-b px-3 backdrop-blur sm:gap-4 sm:px-6">
      <button
        type="button"
        aria-label={t.topbar.openMenu}
        onClick={onMenuClick}
        className="border-border-subtle bg-bg-elevated text-text-secondary grid h-9 w-9 shrink-0 place-items-center rounded-md border md:hidden"
      >
        <Icon.Apps size={16} />
      </button>

      <div className="hidden md:block">
        <SiteSwitcher current={currentSite} sites={sites} />
      </div>

      <button
        type="button"
        onClick={() => palette.setOpen(true)}
        className="border-border-strong bg-bg-deep hover:border-forge-orange/40 group relative flex h-9 min-w-0 flex-1 items-center gap-2 rounded-md border pl-3 pr-2 text-left transition-colors sm:max-w-md"
      >
        <Icon.Search size={14} className="text-text-muted group-hover:text-forge-amber" />
        <span className="text-caption text-text-subtle flex-1 truncate font-mono uppercase tracking-[0.08em]">
          <span className="hidden sm:inline">{t.topbar.search}</span>
          <span className="sm:hidden">{t.topbar.searchShort}</span>
        </span>
        <span className="border-border-strong bg-bg-elevated text-text-muted hidden rounded border px-1.5 py-0.5 font-mono text-[10px] sm:inline">
          ⌘K
        </span>
      </button>

      <div className="flex items-center gap-2">
        <Badge tone="forge" dot className="hidden sm:inline-flex">
          {credits.toLocaleString()} {t.topbar.credits}
        </Badge>
        <span
          className="border-forge-orange/30 bg-forge-orange/10 text-forge-amber grid h-9 w-9 place-items-center rounded-md border font-mono text-[10px] sm:hidden"
          aria-label={`${credits.toLocaleString()} credits`}
        >
          {credits >= 1000 ? `${(credits / 1000).toFixed(1)}k` : credits}
        </span>
        <button
          type="button"
          aria-label={t.topbar.notifications}
          className="border-border-subtle bg-bg-elevated text-text-secondary hover:border-border-strong hover:text-text-primary grid h-9 w-9 place-items-center rounded-md border"
        >
          <Icon.Bell size={16} />
        </button>
      </div>
    </header>
  )
}
