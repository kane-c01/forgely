'use client'

import { usePathname } from 'next/navigation'
import { useState, type ReactNode } from 'react'

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
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  return (
    <CopilotProvider>
      <CommandPaletteProvider>
        <SidebarNav
          siteId={current.id}
          mobileOpen={mobileNavOpen}
          onMobileClose={() => setMobileNavOpen(false)}
        />
        <div className="bg-bg-void flex min-h-screen flex-col md:ml-[60px]">
          <TopBar
            currentSite={current}
            sites={sites}
            credits={CREDITS_BALANCE}
            onMenuClick={() => setMobileNavOpen(true)}
          />
          <main className="flex-1 px-4 py-5 sm:px-6 md:px-8 md:py-6">{children}</main>
        </div>
        <CopilotLauncher />
        <CopilotDrawer />
        <CommandPalette />
      </CommandPaletteProvider>
    </CopilotProvider>
  )
}
