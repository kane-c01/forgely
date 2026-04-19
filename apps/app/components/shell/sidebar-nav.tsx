'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

import { Icon } from '@/components/ui/icons'
import { cn } from '@/lib/cn'

import { defaultSite } from '@/lib/mocks'

import { navGroups, resolveHref } from './nav-config'

interface SidebarNavProps {
  /** Optional override; otherwise inferred from `/sites/[id]/...` URL. */
  siteId?: string
  /** Mobile drawer open state — controlled by `<TopBar>` hamburger. */
  mobileOpen?: boolean
  onMobileClose?: () => void
}

/**
 * Cinematic Industrial sidebar.
 *
 * Desktop (md+): collapsed icon rail by default (per docs/MASTER.md
 * §19.4), expands on hover via CSS group-hover.
 *
 * Mobile (<md): the rail is hidden entirely; we expose a slide-in
 * drawer triggered by the topbar hamburger and dismissed on overlay
 * click / route change / Escape.
 */
export function SidebarNav({ siteId: siteIdProp, mobileOpen, onMobileClose }: SidebarNavProps) {
  const pathname = usePathname()
  const inferred = pathname.match(/^\/sites\/([^/]+)/)?.[1]
  const siteId = siteIdProp ?? inferred ?? defaultSite.id

  // Auto-close the mobile drawer when navigating to a new route.
  useEffect(() => {
    if (mobileOpen) onMobileClose?.()
    // intentionally only depends on pathname so close fires on nav, not
    // on mobileOpen flips
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  // Esc to close on mobile
  useEffect(() => {
    if (!mobileOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onMobileClose?.()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [mobileOpen, onMobileClose])

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen ? (
        <button
          aria-label="Close menu"
          onClick={onMobileClose}
          className="bg-bg-void/70 fixed inset-0 z-40 backdrop-blur-sm md:hidden"
        />
      ) : null}

      <aside
        className={cn(
          'group/sidebar border-border-subtle bg-bg-deep fixed inset-y-0 left-0 z-50 flex w-[232px] flex-col border-r',
          'transition-transform duration-[var(--motion-medium,400ms)] ease-[var(--easing-decelerate)]',
          'md:w-[60px] md:translate-x-0 md:transition-[width] md:hover:w-[232px]',
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
        )}
      >
        <Link
          href="/dashboard"
          className="border-border-subtle text-text-primary flex h-14 items-center gap-3 border-b px-4"
        >
          <span className="bg-forge-orange text-bg-void grid h-8 w-8 shrink-0 place-items-center rounded-md shadow-[0_0_24px_rgba(255,107,26,0.45)]">
            <span className="font-display text-h3 leading-none">F</span>
          </span>
          <span className="font-display text-body-lg overflow-hidden whitespace-nowrap opacity-100 transition-opacity duration-[var(--motion-short,200ms)] md:opacity-0 md:group-hover/sidebar:opacity-100">
            Forgely
          </span>
        </Link>

        <nav className="flex-1 overflow-y-auto py-3">
          {navGroups.map((group) => (
            <div key={group.label} className="mb-2">
              <p className="text-text-subtle px-4 pb-1 pt-3 font-mono text-[10px] uppercase tracking-[0.18em] opacity-100 transition-opacity duration-[var(--motion-short,200ms)] md:opacity-0 md:group-hover/sidebar:opacity-100">
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
                          'group/item text-small relative mx-2 flex h-9 items-center gap-3 rounded-md px-2 transition-colors',
                          Active
                            ? 'bg-bg-elevated text-text-primary'
                            : 'text-text-secondary hover:bg-bg-elevated/60 hover:text-text-primary',
                        )}
                      >
                        {Active ? (
                          <span className="bg-forge-orange absolute left-0 top-1/2 h-5 w-[2px] -translate-y-1/2 rounded-r-full shadow-[0_0_12px_rgba(255,107,26,0.6)]" />
                        ) : null}
                        <span className="grid h-8 w-8 shrink-0 place-items-center">
                          <I size={18} />
                        </span>
                        <span className="overflow-hidden whitespace-nowrap opacity-100 transition-opacity duration-[var(--motion-short,200ms)] md:opacity-0 md:group-hover/sidebar:opacity-100">
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
          className="border-border-subtle text-text-secondary hover:text-text-primary flex h-14 items-center gap-3 border-t px-4"
        >
          <span className="bg-bg-elevated ring-border-strong grid h-8 w-8 shrink-0 place-items-center rounded-full ring-1">
            <Icon.User size={16} />
          </span>
          <span className="overflow-hidden whitespace-nowrap opacity-100 transition-opacity duration-[var(--motion-short,200ms)] md:opacity-0 md:group-hover/sidebar:opacity-100">
            Account
          </span>
        </Link>
      </aside>
    </>
  )
}
