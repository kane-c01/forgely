import type { Route } from 'next'

/**
 * /super sidebar — 14 modules. MVP enables 5 (Overview, Users, Finance,
 * Audit, Team); the rest are visible but routed to a "Coming soon" stub
 * so the IA matches docs/MASTER.md §20.4.
 */
export type SuperNavItem = {
  href: Route
  label: string
  icon: string
  /** ASCII fallback so the sidebar renders even before the icon font loads. */
  shortcut: string
  group: 'mvp' | 'v1' | 'v2'
  status: 'live' | 'soon' | 'planned'
  /** Minimum role required (mirrors RBAC matrix). */
  minRole?: 'OWNER' | 'ADMIN' | 'SUPPORT'
}

export const SUPER_NAV: SuperNavItem[] = [
  { href: '/super', label: 'Overview', icon: 'OV', shortcut: '⌘1', group: 'mvp', status: 'live', minRole: 'SUPPORT' },
  { href: '/super/users', label: 'Users', icon: 'US', shortcut: '⌘2', group: 'mvp', status: 'live', minRole: 'SUPPORT' },
  { href: '/super/sites', label: 'Sites', icon: 'ST', shortcut: '⌘3', group: 'v1', status: 'soon', minRole: 'SUPPORT' },
  { href: '/super/finance', label: 'Finance', icon: 'FN', shortcut: '⌘4', group: 'mvp', status: 'live', minRole: 'OWNER' },
  { href: '/super/ai-ops', label: 'AI Ops', icon: 'AI', shortcut: '⌘5', group: 'v1', status: 'soon', minRole: 'ADMIN' },
  { href: '/super/content', label: 'Content', icon: 'CN', shortcut: '⌘6', group: 'v1', status: 'soon', minRole: 'ADMIN' },
  { href: '/super/plugins', label: 'Plugins', icon: 'PL', shortcut: '⌘7', group: 'v2', status: 'planned', minRole: 'ADMIN' },
  { href: '/super/analytics', label: 'Analytics', icon: 'AN', shortcut: '⌘8', group: 'v2', status: 'planned', minRole: 'ADMIN' },
  { href: '/super/marketing', label: 'Marketing', icon: 'MK', shortcut: '⌘9', group: 'v2', status: 'planned', minRole: 'ADMIN' },
  { href: '/super/support', label: 'Support', icon: 'SP', shortcut: '⇧1', group: 'v1', status: 'soon', minRole: 'SUPPORT' },
  { href: '/super/settings', label: 'Platform', icon: 'PS', shortcut: '⇧2', group: 'v1', status: 'soon', minRole: 'OWNER' },
  { href: '/super/audit', label: 'Audit Log', icon: 'AU', shortcut: '⇧3', group: 'mvp', status: 'live', minRole: 'ADMIN' },
  { href: '/super/team', label: 'Team', icon: 'TM', shortcut: '⇧4', group: 'mvp', status: 'live', minRole: 'OWNER' },
  { href: '/super/health', label: 'Health', icon: 'HL', shortcut: '⇧5', group: 'v2', status: 'planned', minRole: 'ADMIN' },
]
