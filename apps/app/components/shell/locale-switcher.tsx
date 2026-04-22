'use client'

import { useEffect, useRef, useState } from 'react'

import { Icon } from '@/components/ui/icons'
import { cn } from '@/lib/cn'

/**
 * LocaleSwitcher — topbar dropdown for UI language.
 *
 * Sprint 3 W2: user-side mirror of the super-admin locale switcher. The
 * choice persists in `localStorage` (fast path) and, when the user is
 * signed in, in `User.locale` via tRPC. The active locale is exposed via
 * a custom event so `<I18nProvider>` (or equivalent) can react without
 * a full reload.
 */
export type AppLocale = 'zh-CN' | 'zh-HK' | 'zh-TW' | 'en'

const OPTIONS: Array<{ code: AppLocale; label: string; flag: string }> = [
  { code: 'zh-CN', label: '简体中文', flag: '🇨🇳' },
  { code: 'zh-HK', label: '繁體中文 (香港)', flag: '🇭🇰' },
  { code: 'zh-TW', label: '繁體中文 (台灣)', flag: '🇹🇼' },
  { code: 'en', label: 'English', flag: '🇺🇸' },
]

const STORAGE_KEY = 'forgely:locale'

function readInitialLocale(): AppLocale {
  if (typeof window === 'undefined') return 'zh-CN'
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    if (saved && OPTIONS.some((o) => o.code === saved)) return saved as AppLocale
  } catch {
    /* localStorage disabled */
  }
  const browser = typeof navigator !== 'undefined' ? navigator.language : 'zh-CN'
  if (browser.startsWith('zh-HK')) return 'zh-HK'
  if (browser.startsWith('zh-TW')) return 'zh-TW'
  if (browser.startsWith('en')) return 'en'
  return 'zh-CN'
}

export function LocaleSwitcher() {
  const [locale, setLocale] = useState<AppLocale>('zh-CN')
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    setLocale(readInitialLocale())
  }, [])

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const select = async (code: AppLocale) => {
    setLocale(code)
    setOpen(false)
    try {
      window.localStorage.setItem(STORAGE_KEY, code)
      window.dispatchEvent(new CustomEvent('forgely:locale-change', { detail: code }))
      document.documentElement.lang = code
    } catch {
      /* noop */
    }
    // Best-effort persist on the user profile. We don't block the UI on it.
    try {
      await fetch('/api/trpc/auth.updateLocale', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ json: { locale: code } }),
      })
    } catch {
      /* anonymous session — profile update will retry on next sign-in */
    }
  }

  const current = OPTIONS.find((o) => o.code === locale) ?? OPTIONS[0]!

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-label="Select language"
        onClick={() => setOpen((v) => !v)}
        className="border-border-subtle bg-bg-elevated text-text-secondary hover:border-border-strong hover:text-text-primary text-caption grid h-9 min-w-[74px] place-items-center rounded-md border px-2 font-mono uppercase tracking-[0.12em]"
      >
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden>{current.flag}</span>
          <span>{current.code}</span>
          <Icon.ChevronDown size={12} />
        </span>
      </button>

      {open ? (
        <div
          role="menu"
          className="border-border-strong bg-bg-elevated/95 shadow-elevated absolute right-0 top-[calc(100%+6px)] z-30 min-w-[200px] rounded-md border p-1 backdrop-blur-md"
        >
          {OPTIONS.map((o) => (
            <button
              key={o.code}
              type="button"
              onClick={() => void select(o.code)}
              className={cn(
                'text-small hover:bg-bg-deep flex w-full items-center justify-between gap-3 rounded-sm px-3 py-2 text-left transition-colors',
                o.code === locale ? 'text-forge-amber' : 'text-text-secondary',
              )}
            >
              <span className="inline-flex items-center gap-2">
                <span aria-hidden>{o.flag}</span>
                <span>{o.label}</span>
              </span>
              {o.code === locale ? <Icon.Check size={14} /> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
