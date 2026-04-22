'use client'

import type { ReactNode } from 'react'

import { CommandPalette } from '@/components/command/command-palette'
import { CommandPaletteProvider } from '@/components/command/command-palette-context'
import { CopilotDrawer } from '@/components/copilot/copilot-drawer'
import { CopilotLauncher } from '@/components/copilot/copilot-launcher'
import { CopilotProvider } from '@/components/copilot/copilot-provider'
import { useLocale } from '@/lib/i18n'

import { SuperCopilotBridge } from './SuperCopilotBridge'
import { SuperCopilotContextRegistrar } from './SuperCopilotContextRegistrar'

interface SuperCopilotShellProps {
  children: ReactNode
  role: string
}

/**
 * Client wrapper that mounts Copilot + ⌘K palette around the entire
 * /super tree. Initial context is `super-overview` so the very first
 * Copilot turn (and the keyboard ⌘J launch) already sees super-admin
 * suggestions.
 *
 * Individual /super pages override the context with `useCopilotContext`
 * (e.g. `super-users` on /super/users, `super-user` on the user detail
 * drawer) — same pattern as the regular dashboard.
 */
export function SuperCopilotShell({ children, role }: SuperCopilotShellProps) {
  const { locale } = useLocale()
  return (
    <CopilotProvider locale={locale} initialContext={{ kind: 'super-overview' }}>
      <CommandPaletteProvider>
        <SuperCopilotContextRegistrar />
        {children}
        <CopilotLauncher />
        <CopilotDrawer />
        <CommandPalette />
        <SuperCopilotBridge role={role} />
      </CommandPaletteProvider>
    </CopilotProvider>
  )
}
