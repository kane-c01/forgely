'use client'

import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'

import { CommandPalette } from '@/components/command/command-palette'
import { CommandPaletteProvider } from '@/components/command/command-palette-context'
import { CopilotDrawer } from '@/components/copilot/copilot-drawer'
import { CopilotLauncher } from '@/components/copilot/copilot-launcher'
import { CopilotProvider } from '@/components/copilot/copilot-provider'
import { defaultSite, sites } from '@/lib/mocks'

import { SidebarNav } from './sidebar-nav'
import { TopBar } from './topbar'

interface AppShellProps {
  children: ReactNode
}

const CREDITS_BALANCE = 4_231

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname()
  const inferredSiteId = pathname.match(/^\/sites\/([^/]+)/)?.[1]
  const current = (inferredSiteId && sites.find((s) => s.id === inferredSiteId)) || defaultSite
  return (
    <CopilotProvider>
      <CommandPaletteProvider>
        <SidebarNav siteId={current.id} />
        <div className="ml-[60px] flex min-h-screen flex-col bg-bg-void">
          <TopBar currentSite={current} sites={sites} credits={CREDITS_BALANCE} />
          <main className="flex-1 px-8 py-6">{children}</main>
        </div>
        <CopilotLauncher />
        <CopilotDrawer />
        <CommandPalette />
      </CommandPaletteProvider>
    </CopilotProvider>
  )
}
