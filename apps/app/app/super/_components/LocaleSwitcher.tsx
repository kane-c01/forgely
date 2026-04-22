'use client'

import { useLocale, type AppLocale } from '@/lib/i18n'

/**
 * zh-CN / en toggle pill for the /super topbar.
 *
 * Persists to localStorage via LocaleProvider.setLocale.
 * The same switcher mirrors the one in the user dashboard topbar so
 * super-admins who also own a merchant account see a consistent UX.
 */
export function SuperLocaleSwitcher() {
  const { locale, setLocale, t } = useLocale()

  const btn = (id: AppLocale, label: string) => {
    const active = locale === id
    return (
      <button
        key={id}
        type="button"
        onClick={() => setLocale(id)}
        aria-pressed={active}
        className={
          'border px-2 py-[3px] font-mono text-[10px] uppercase tracking-[0.18em] transition-colors ' +
          (active
            ? 'border-forge-ember bg-forge-orange/15 text-forge-amber'
            : 'border-border-subtle text-text-muted hover:border-border-strong hover:text-text-primary')
        }
      >
        {label}
      </button>
    )
  }

  return (
    <div
      className="hidden items-center gap-1 md:flex"
      role="group"
      aria-label={t.super.topbar.language}
    >
      {btn('zh-CN', t.super.topbar.langCN)}
      {btn('en', t.super.topbar.langEN)}
    </div>
  )
}
