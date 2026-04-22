'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/components/super-ui'
import { useT } from '@/lib/i18n'
import { SUPER_NAV } from '@/lib/super'
import type { SuperRole, SuperNavItem } from '@/lib/super'

const NAV_LABEL_KEY: Record<string, string> = {
  '/super': 'overview',
  '/super/users': 'users',
  '/super/sites': 'sites',
  '/super/finance': 'finance',
  '/super/ai-ops': 'aiOps',
  '/super/content': 'content',
  '/super/plugins': 'plugins',
  '/super/analytics': 'analytics',
  '/super/marketing': 'marketing',
  '/super/support': 'support',
  '/super/settings': 'settings',
  '/super/audit': 'audit',
  '/super/team': 'team',
  '/super/health': 'health',
}

function canSeeItem(role: SuperRole, minRole?: SuperRole): boolean {
  if (!minRole) return true
  if (role === 'OWNER') return true
  if (role === 'ADMIN') return minRole !== 'OWNER'
  return minRole === 'SUPPORT'
}

function labelFor(item: SuperNavItem, t: ReturnType<typeof useT>): string {
  const section = NAV_LABEL_KEY[item.href]
  if (!section) return item.label
  const s = t.super[section as keyof typeof t.super] as { title?: string } | undefined
  return s?.title ?? item.label
}

export function SuperSidebar({ role }: { role: SuperRole }) {
  const pathname = usePathname() ?? '/super'
  const t = useT()

  const groupLabel: Record<'mvp' | 'v1' | 'v2', string> = {
    mvp: t.super.sidebar.groupMvp,
    v1: t.super.sidebar.groupV1,
    v2: t.super.sidebar.groupV2,
  }
  const statusHint: Record<'live' | 'soon' | 'planned', string> = {
    live: '',
    soon: t.super.sidebar.statusSoon,
    planned: t.super.sidebar.statusPlanned,
  }

  const grouped = (['mvp', 'v1', 'v2'] as const).map((group) => ({
    group,
    items: SUPER_NAV.filter((item) => item.group === group && canSeeItem(role, item.minRole)),
  }))

  return (
    <aside className="border-border-subtle bg-bg-deep hidden w-56 shrink-0 flex-col border-r md:flex">
      <div className="border-border-subtle flex h-14 items-center gap-2 border-b px-5">
        <div className="border-forge-ember bg-forge-orange/10 text-caption text-forge-amber grid h-7 w-7 place-items-center border font-mono">
          F
        </div>
        <div>
          <div className="text-caption text-text-secondary font-mono uppercase tracking-[0.2em]">
            {t.super.sidebar.superTitle}
          </div>
          <div className="text-caption text-text-muted font-mono">
            {t.super.sidebar.superSubtitle}
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-3">
        {grouped.map(({ group, items }) =>
          items.length === 0 ? null : (
            <div key={group} className="mb-4">
              <div className="text-caption text-text-muted px-5 py-2 font-mono uppercase tracking-[0.22em]">
                {groupLabel[group]}
              </div>
              <ul className="space-y-[2px] px-2">
                {items.map((item) => {
                  const active =
                    item.href === '/super' ? pathname === '/super' : pathname.startsWith(item.href)
                  const disabled = item.status !== 'live'
                  const rowClasses = cn(
                    'group flex items-center gap-3 px-3 py-2 transition-colors',
                    active
                      ? 'bg-forge-orange/10 text-forge-amber'
                      : disabled
                        ? 'cursor-not-allowed text-text-subtle'
                        : 'text-text-secondary hover:bg-bg-surface hover:text-text-primary',
                  )
                  const iconBox = (
                    <span
                      className={cn(
                        'text-caption grid h-6 w-6 place-items-center border font-mono tracking-tight',
                        active
                          ? 'border-forge-ember bg-forge-orange/15 text-forge-amber'
                          : 'border-border-subtle text-text-muted',
                      )}
                    >
                      {item.icon}
                    </span>
                  )
                  const label = (
                    <span className="text-small flex-1 truncate">{labelFor(item, t)}</span>
                  )
                  const trailing = disabled ? (
                    <span className="text-caption text-text-subtle font-mono uppercase tracking-[0.16em]">
                      {statusHint[item.status]}
                    </span>
                  ) : (
                    <span className="text-caption text-text-subtle font-mono">{item.shortcut}</span>
                  )

                  return (
                    <li key={item.href}>
                      {disabled ? (
                        <span className={rowClasses} aria-disabled="true" role="link">
                          {iconBox}
                          {label}
                          {trailing}
                        </span>
                      ) : (
                        <Link href={item.href} className={rowClasses}>
                          {iconBox}
                          {label}
                          {trailing}
                        </Link>
                      )}
                    </li>
                  )
                })}
              </ul>
            </div>
          ),
        )}
      </nav>

      <div className="border-border-subtle text-caption text-text-muted border-t px-5 py-3 font-mono uppercase tracking-[0.18em]">
        {t.super.sidebar.role} · <span className="text-text-secondary">{role}</span>
      </div>
    </aside>
  )
}
