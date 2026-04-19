'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/components/super-ui'
import { SUPER_NAV } from '@/lib/super'
import type { SuperRole } from '@/lib/super'

const GROUP_LABEL: Record<'mvp' | 'v1' | 'v2', string> = {
  mvp: 'MVP',
  v1: 'V1',
  v2: 'V2',
}

const STATUS_HINT = {
  live: '',
  soon: 'soon',
  planned: 'planned',
} as const

function canSeeItem(role: SuperRole, minRole?: SuperRole): boolean {
  if (!minRole) return true
  if (role === 'OWNER') return true
  if (role === 'ADMIN') return minRole !== 'OWNER'
  return minRole === 'SUPPORT'
}

export function SuperSidebar({ role }: { role: SuperRole }) {
  const pathname = usePathname() ?? '/super'

  const grouped = (['mvp', 'v1', 'v2'] as const).map((group) => ({
    group,
    items: SUPER_NAV.filter((item) => item.group === group && canSeeItem(role, item.minRole)),
  }))

  return (
    <aside className="hidden w-56 shrink-0 flex-col border-r border-border-subtle bg-bg-deep md:flex">
      <div className="flex h-14 items-center gap-2 border-b border-border-subtle px-5">
        <div className="grid h-7 w-7 place-items-center border border-forge-ember bg-forge-orange/10 font-mono text-caption text-forge-amber">
          F
        </div>
        <div>
          <div className="font-mono text-caption uppercase tracking-[0.2em] text-text-secondary">
            Super
          </div>
          <div className="font-mono text-caption text-text-muted">v0.1 · MVP</div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-3">
        {grouped.map(({ group, items }) =>
          items.length === 0 ? null : (
            <div key={group} className="mb-4">
              <div className="px-5 py-2 font-mono text-caption uppercase tracking-[0.22em] text-text-muted">
                {GROUP_LABEL[group]}
              </div>
              <ul className="space-y-[2px] px-2">
                {items.map((item) => {
                  const active =
                    item.href === '/super'
                      ? pathname === '/super'
                      : pathname.startsWith(item.href)
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
                        'grid h-6 w-6 place-items-center border font-mono text-caption tracking-tight',
                        active
                          ? 'border-forge-ember bg-forge-orange/15 text-forge-amber'
                          : 'border-border-subtle text-text-muted',
                      )}
                    >
                      {item.icon}
                    </span>
                  )
                  const label = <span className="flex-1 truncate text-small">{item.label}</span>
                  const trailing = disabled ? (
                    <span className="font-mono text-caption uppercase tracking-[0.16em] text-text-subtle">
                      {STATUS_HINT[item.status]}
                    </span>
                  ) : (
                    <span className="font-mono text-caption text-text-subtle">{item.shortcut}</span>
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

      <div className="border-t border-border-subtle px-5 py-3 font-mono text-caption uppercase tracking-[0.18em] text-text-muted">
        ROLE · <span className="text-text-secondary">{role}</span>
      </div>
    </aside>
  )
}
