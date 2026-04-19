'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { Icon } from '@/components/ui/icons'
import { cn } from '@/lib/cn'

import { defaultSite } from '@/lib/mocks'

import { navGroups, resolveHref } from './nav-config'

interface SidebarNavProps {
  /** Optional override; otherwise inferred from `/sites/[id]/...` URL. */
  siteId?: string
}

/**
 * Cinematic Industrial sidebar — collapsed icon rail by default
 * (per docs/MASTER.md §19.4), expanded label panel on hover.
 *
 * Implementation note: we use CSS group-hover to drive the expand
 * animation rather than React state so the panel doesn't re-mount on
 * every hover (smoother + a11y-friendly).
 */
export function SidebarNav({ siteId: siteIdProp }: SidebarNavProps) {
  const pathname = usePathname()
  const inferred = pathname.match(/^\/sites\/([^/]+)/)?.[1]
  const siteId = siteIdProp ?? inferred ?? defaultSite.id
  return (
    <aside className="group/sidebar fixed inset-y-0 left-0 z-30 flex w-[60px] flex-col border-r border-border-subtle bg-bg-deep transition-[width] duration-[var(--motion-medium,400ms)] ease-[var(--easing-decelerate)] hover:w-[232px]">
      <Link
        href="/dashboard"
        className="flex h-14 items-center gap-3 border-b border-border-subtle px-4 text-text-primary"
      >
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-forge-orange text-bg-void shadow-[0_0_24px_rgba(255,107,26,0.45)]">
          <span className="font-display text-h3 leading-none">F</span>
        </span>
        <span className="overflow-hidden whitespace-nowrap font-display text-body-lg opacity-0 transition-opacity duration-[var(--motion-short,200ms)] group-hover/sidebar:opacity-100">
          Forgely
        </span>
      </Link>

      <nav className="flex-1 overflow-y-auto py-3">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-2">
            <p className="px-4 pb-1 pt-3 font-mono text-[10px] uppercase tracking-[0.18em] text-text-subtle opacity-0 transition-opacity duration-[var(--motion-short,200ms)] group-hover/sidebar:opacity-100">
              {group.label}
            </p>
            <ul className="flex flex-col">
              {group.items.map((item) => {
                const href = resolveHref(item.href, siteId)
                const Active =
                  pathname === href ||
                  (href !== '/dashboard' && pathname.startsWith(href + '/')) ||
                  (href !== '/dashboard' && pathname === href)
                const I = Icon[item.icon]
                return (
                  <li key={item.label}>
                    <Link
                      href={href}
                      className={cn(
                        'group/item relative mx-2 flex h-9 items-center gap-3 rounded-md px-2 text-small transition-colors',
                        Active
                          ? 'bg-bg-elevated text-text-primary'
                          : 'text-text-secondary hover:bg-bg-elevated/60 hover:text-text-primary',
                      )}
                    >
                      {Active ? (
                        <span className="absolute left-0 top-1/2 h-5 w-[2px] -translate-y-1/2 rounded-r-full bg-forge-orange shadow-[0_0_12px_rgba(255,107,26,0.6)]" />
                      ) : null}
                      <span className="grid h-8 w-8 shrink-0 place-items-center">
                        <I size={18} />
                      </span>
                      <span className="overflow-hidden whitespace-nowrap opacity-0 transition-opacity duration-[var(--motion-short,200ms)] group-hover/sidebar:opacity-100">
                        {item.label}
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      <Link
        href="/account"
        className="flex h-14 items-center gap-3 border-t border-border-subtle px-4 text-text-secondary hover:text-text-primary"
      >
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-bg-elevated ring-1 ring-border-strong">
          <Icon.User size={16} />
        </span>
        <span className="overflow-hidden whitespace-nowrap opacity-0 transition-opacity duration-[var(--motion-short,200ms)] group-hover/sidebar:opacity-100">
          Account
        </span>
      </Link>
    </aside>
  )
}
