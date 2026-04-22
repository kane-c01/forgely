'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { createPortal } from 'react-dom'

import { useCommandPalette } from '@/components/command/command-palette-context'
import { useCopilot } from '@/components/copilot/copilot-provider'
import { Icon, type IconKey } from '@/components/ui/icons'
import { cn } from '@/lib/cn'
import { useT } from '@/lib/i18n'
import {
  customers as MOCK_CUSTOMERS,
  defaultSite,
  orders as MOCK_ORDERS,
  products as MOCK_PRODUCTS,
  sites as MOCK_SITES,
} from '@/lib/mocks'
import { formatCurrency } from '@/lib/format'

/**
 * Cmd+K command palette — the keyboard front door of the dashboard.
 *
 * Implementation goals:
 *   • Zero deps (no `cmdk`); the navigation logic is small enough.
 *   • Three sources fused: actions, navigation pages, and entity records
 *     (sites / products / orders / customers).
 *   • Smart fuzzy match: token-based contains-all match (so "yir wash"
 *     would match "Yirgacheffe Washington").
 *   • ↑/↓ to move, Enter to run, Esc to close, Cmd+K to toggle.
 */

interface CommandItem {
  id: string
  group: 'actions' | 'navigate' | 'sites' | 'products' | 'orders' | 'customers'
  label: string
  hint?: string
  icon: IconKey
  shortcut?: string
  run: () => void
  keywords?: string
}

function tokensMatch(haystack: string, query: string): boolean {
  if (!query.trim()) return true
  const h = haystack.toLowerCase()
  return query
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .every((tok) => h.includes(tok))
}

export function CommandPalette() {
  const palette = useCommandPalette()
  const t = useT()
  const open = palette.open
  const setOpen = palette.setOpen
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const copilot = useCopilot()

  const hintByGroup: Record<CommandItem['group'], string> = {
    actions: t.commandPalette.hintAction,
    navigate: t.commandPalette.hintPage,
    sites: t.commandPalette.hintSite,
    products: t.commandPalette.hintProduct,
    orders: t.commandPalette.hintOrder,
    customers: t.commandPalette.hintCustomer,
  }

  const close = () => {
    setOpen(false)
    setQuery('')
    setActive(0)
  }
  const navigate = (href: string) => {
    router.push(href)
    close()
  }

  const items: CommandItem[] = useMemo(() => {
    const list: CommandItem[] = []

    // ---------- actions
    list.push(
      {
        id: 'a:copilot',
        group: 'actions',
        label: t.commandPalette.openCopilot,
        hint: t.commandPalette.askAiHint,
        icon: 'Sparkle',
        shortcut: '⌘J',
        run: () => {
          copilot.setOpen(true)
          close()
        },
      },
      {
        id: 'a:copilot.sales',
        group: 'actions',
        label: t.commandPalette.askSales,
        icon: 'Sparkle',
        run: () => {
          copilot.setOpen(true)
          void copilot.send('How are sales this month? Compare to last 30 days.')
          close()
        },
      },
      {
        id: 'a:copilot.discount',
        group: 'actions',
        label: t.commandPalette.askDiscount,
        icon: 'Sparkle',
        run: () => {
          copilot.setOpen(true)
          void copilot.send('Create a launch discount code valid for 7 days.')
          close()
        },
      },
      {
        id: 'a:copilot.hero',
        group: 'actions',
        label: t.commandPalette.askHero,
        icon: 'Sparkle',
        run: () => {
          copilot.setOpen(true)
          void copilot.send('Regenerate the hero video with warmer lighting and 2 alternates.')
          close()
        },
      },
      {
        id: 'a:new-product',
        group: 'actions',
        label: t.commandPalette.newProduct,
        icon: 'Plus',
        run: () => navigate(`/sites/${defaultSite.id}/products`),
      },
      {
        id: 'a:new-site',
        group: 'actions',
        label: t.commandPalette.forgeNewSite,
        icon: 'Plus',
        run: () => navigate('/sites'),
      },
    )

    // ---------- navigate
    list.push(
      {
        id: 'n:dashboard',
        group: 'navigate',
        label: t.commandPalette.navDashboard,
        icon: 'Dashboard',
        run: () => navigate('/dashboard'),
      },
      {
        id: 'n:sites',
        group: 'navigate',
        label: t.commandPalette.navSites,
        icon: 'Sites',
        run: () => navigate('/sites'),
      },
      {
        id: 'n:products',
        group: 'navigate',
        label: t.commandPalette.navProducts,
        icon: 'Box',
        run: () => navigate(`/sites/${defaultSite.id}/products`),
      },
      {
        id: 'n:orders',
        group: 'navigate',
        label: t.commandPalette.navOrders,
        icon: 'Cart',
        run: () => navigate(`/sites/${defaultSite.id}/orders`),
      },
      {
        id: 'n:customers',
        group: 'navigate',
        label: t.commandPalette.navCustomers,
        icon: 'Users',
        run: () => navigate(`/sites/${defaultSite.id}/customers`),
      },
      {
        id: 'n:editor',
        group: 'navigate',
        label: t.commandPalette.navThemeEditor,
        icon: 'Editor',
        run: () => navigate(`/sites/${defaultSite.id}/editor`),
      },
      {
        id: 'n:media',
        group: 'navigate',
        label: t.commandPalette.navMediaLibrary,
        icon: 'Image',
        run: () => navigate(`/sites/${defaultSite.id}/media`),
      },
      {
        id: 'n:brand',
        group: 'navigate',
        label: t.commandPalette.navBrandKits,
        icon: 'Brand',
        run: () => navigate('/brand-kits'),
      },
      {
        id: 'n:billing',
        group: 'navigate',
        label: t.commandPalette.navBilling,
        icon: 'Wallet',
        run: () => navigate('/billing'),
      },
      {
        id: 'n:settings',
        group: 'navigate',
        label: t.commandPalette.navSettings,
        icon: 'Settings',
        run: () => navigate('/settings'),
      },
    )

    // ---------- entities
    for (const s of MOCK_SITES) {
      list.push({
        id: `s:${s.id}`,
        group: 'sites',
        label: s.name,
        hint: s.domain,
        icon: 'Sites',
        keywords: `${s.domain} ${s.status}`,
        run: () => navigate(`/sites/${s.id}/products`),
      })
    }
    for (const p of MOCK_PRODUCTS) {
      list.push({
        id: `p:${p.id}`,
        group: 'products',
        label: p.title,
        hint: `/${p.handle} · ${formatCurrency(p.priceCents)}`,
        icon: 'Box',
        keywords: `${p.handle} ${p.vendor} ${p.collections.join(' ')}`,
        run: () => navigate(`/sites/${p.siteId}/products/${p.id}`),
      })
    }
    for (const o of MOCK_ORDERS) {
      list.push({
        id: `o:${o.id}`,
        group: 'orders',
        label: `${o.number} · ${o.customerName}`,
        hint: `${o.status} · ${formatCurrency(o.totalCents)}`,
        icon: 'Cart',
        keywords: `${o.shippingTo.city} ${o.shippingTo.country}`,
        run: () => navigate(`/sites/${o.siteId}/orders/${o.id}`),
      })
    }
    for (const c of MOCK_CUSTOMERS) {
      list.push({
        id: `c:${c.id}`,
        group: 'customers',
        label: c.name,
        hint: `${c.email} · ${formatCurrency(c.totalSpentCents)} LTV`,
        icon: 'User',
        keywords: c.tags.join(' '),
        run: () => navigate(`/sites/${c.siteId}/customers/${c.id}`),
      })
    }

    return list
    // `close` and `navigate` are local helpers that close over stable
    // refs (router / palette setOpen) — re-creating them on each render
    // would invalidate the entire item list. Safe to omit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [copilot, router, t])

  const filtered = useMemo(() => {
    return items.filter((i) => tokensMatch(`${i.label} ${i.hint ?? ''} ${i.keywords ?? ''}`, query))
  }, [items, query])

  // Reset active when filter changes
  useEffect(() => setActive(0), [query, open])

  // Toggle hot keys: ⌘K / Ctrl+K
  useEffect(() => {
    const onKey = (e: KeyboardEvent | globalThis.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        palette.toggle()
      } else if (e.key === 'Escape') {
        if (open) close()
      }
    }
    window.addEventListener('keydown', onKey as EventListener)
    return () => window.removeEventListener('keydown', onKey as EventListener)
    // `palette.toggle` and `close` are stable closures from context /
    // local scope; re-binding the listener on each render would thrash.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // Focus on open
  useEffect(() => {
    if (open) requestAnimationFrame(() => inputRef.current?.focus())
  }, [open])

  // Lock body scroll
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  if (!open || typeof document === 'undefined') return null

  const grouped = filtered.reduce<Record<string, CommandItem[]>>((acc, it) => {
    acc[it.group] ||= []
    acc[it.group]!.push(it)
    return acc
  }, {})
  const flatIds = filtered.map((f) => f.id)

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((i) => Math.min(filtered.length - 1, i + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => Math.max(0, i - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      filtered[active]?.run()
    }
  }

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t.commandPalette.ariaLabel}
      className="fixed inset-0 z-[60] flex items-start justify-center px-4 pt-[12vh]"
    >
      <button
        aria-label={t.commandPalette.closeAria}
        onClick={close}
        className="bg-bg-void/80 absolute inset-0 backdrop-blur-sm"
      />
      <div className="border-border-subtle bg-bg-surface relative w-full max-w-2xl animate-[cmdk-pop_180ms_ease-out] overflow-hidden rounded-xl border shadow-[0_24px_64px_rgba(0,0,0,0.7),0_0_0_1px_rgba(255,255,255,0.04)_inset]">
        <div className="border-border-subtle flex items-center gap-3 border-b px-4 py-3">
          <Icon.Search size={16} className="text-text-muted" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKey}
            placeholder={t.commandPalette.placeholder}
            className="text-body text-text-primary placeholder:text-text-muted flex-1 bg-transparent outline-none"
          />
          <kbd className="border-border-strong text-caption text-text-muted rounded border px-1.5 py-0.5 font-mono">
            ESC
          </kbd>
        </div>

        <div className="max-h-[60vh] overflow-y-auto py-2">
          {filtered.length === 0 ? (
            <p className="text-small text-text-muted px-5 py-8 text-center">
              {t.commandPalette.noMatches}
            </p>
          ) : (
            (Object.keys(grouped) as CommandItem['group'][]).map((g) => (
              <section key={g} className="mb-2">
                <p className="text-caption text-text-subtle px-4 pb-1 pt-2 font-mono uppercase tracking-[0.18em]">
                  {hintByGroup[g]} · {grouped[g]!.length}
                </p>
                {grouped[g]!.map((it) => {
                  const idx = flatIds.indexOf(it.id)
                  const isActive = idx === active
                  const I = Icon[it.icon]
                  return (
                    <button
                      key={it.id}
                      type="button"
                      onMouseEnter={() => setActive(idx)}
                      onClick={() => it.run()}
                      className={cn(
                        'text-small flex w-full items-center gap-3 px-4 py-2 text-left transition-colors',
                        isActive
                          ? 'bg-bg-elevated text-text-primary'
                          : 'text-text-secondary hover:bg-bg-elevated/60',
                      )}
                    >
                      <span className="bg-bg-deep text-text-muted grid h-7 w-7 shrink-0 place-items-center rounded-md">
                        <I size={14} />
                      </span>
                      <span className="flex flex-1 items-center justify-between gap-2 truncate">
                        <span className="text-text-primary truncate">{it.label}</span>
                        {it.hint ? (
                          <span className="text-caption text-text-muted hidden truncate font-mono sm:inline">
                            {it.hint}
                          </span>
                        ) : null}
                      </span>
                      {it.shortcut ? (
                        <kbd className="border-border-strong text-caption text-text-muted hidden shrink-0 rounded border px-1.5 py-0.5 font-mono sm:inline">
                          {it.shortcut}
                        </kbd>
                      ) : null}
                      {isActive ? <Icon.Check size={14} className="text-forge-amber" /> : null}
                    </button>
                  )
                })}
              </section>
            ))
          )}
        </div>

        <div className="border-border-subtle bg-bg-deep text-caption text-text-muted flex items-center justify-between gap-3 border-t px-4 py-2 font-mono">
          <span className="flex items-center gap-3">
            <span>
              <kbd className="border-border-strong rounded border px-1">↑</kbd>/
              <kbd className="border-border-strong rounded border px-1">↓</kbd>{' '}
              {t.commandPalette.move}
            </span>
            <span>
              <kbd className="border-border-strong rounded border px-1">↵</kbd>{' '}
              {t.commandPalette.run}
            </span>
            <span>
              <kbd className="border-border-strong rounded border px-1">esc</kbd>{' '}
              {t.commandPalette.close}
            </span>
          </span>
          <span>
            {filtered.length} {t.commandPalette.results}
          </span>
        </div>
      </div>
      <style jsx global>{`
        @keyframes cmdk-pop {
          from {
            transform: translateY(-6px) scale(0.98);
            opacity: 0;
          }
          to {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>,
    document.body,
  )
}
