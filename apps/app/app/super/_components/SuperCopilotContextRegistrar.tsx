'use client'

/**
 * Path-aware Copilot context registrar for /super.
 *
 * Sits inside the super layout (client) and reads `usePathname()` to
 * derive which super-* CopilotPageContext should be active. This way
 * every server-component super page gets correct context for free —
 * no per-page boilerplate.
 */

import { usePathname } from 'next/navigation'

import { useCopilotContext } from '@/components/copilot/copilot-provider'
import type { CopilotPageContext } from '@/components/copilot/types'

function deriveContext(pathname: string): CopilotPageContext {
  if (pathname === '/super' || pathname === '/super/') return { kind: 'super-overview' }
  if (pathname.startsWith('/super/users')) return { kind: 'super-users' }
  if (pathname.startsWith('/super/finance')) return { kind: 'super-finance' }
  if (pathname.startsWith('/super/audit')) return { kind: 'super-audit' }
  if (pathname.startsWith('/super/team')) return { kind: 'super-team' }
  if (pathname.startsWith('/super/marketing')) return { kind: 'super-marketing' }
  if (pathname.startsWith('/super/plugins')) return { kind: 'super-plugins' }
  if (pathname.startsWith('/super/health')) return { kind: 'super-health' }
  if (pathname.startsWith('/super/ai-ops')) return { kind: 'super-ai-ops' }
  if (pathname.startsWith('/super/sites')) return { kind: 'super-sites' }
  if (pathname.startsWith('/super/content')) return { kind: 'super-content' }
  if (pathname.startsWith('/super/analytics')) return { kind: 'super-analytics' }
  if (pathname.startsWith('/super/support')) return { kind: 'super-support' }
  if (pathname.startsWith('/super/settings')) return { kind: 'super-settings' }
  return { kind: 'super-overview' }
}

export function SuperCopilotContextRegistrar() {
  const pathname = usePathname() ?? '/super'
  useCopilotContext(deriveContext(pathname))
  return null
}
