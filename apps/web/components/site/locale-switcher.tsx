'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Globe } from 'lucide-react'
import { localeLabels, routing, type Locale } from '@/i18n/routing'
import { cn } from '@forgely/ui'

interface LocaleSwitcherProps {
  className?: string
}

/**
 * Pill-style locale switcher reading the active locale from
 * `next-intl` and emitting locale-prefixed `<Link>`s for every
 * supported alternative.
 *
 * Behaviour:
 * - Reads `useLocale()` so we always highlight the right pill.
 * - Strips the current locale from `usePathname()` (if any), then
 *   re-prefixes with the target locale. Default locale stays
 *   path-prefix-free per the next-intl `as-needed` strategy.
 * - Static-rendering friendly: when the surrounding subtree is
 *   server-rendered (e.g. footer), Next still hydrates this client
 *   component without re-rendering the parent.
 */
export function LocaleSwitcher({ className }: LocaleSwitcherProps) {
  const pathname = usePathname() ?? '/'
  const current = detectLocale(pathname)
  const stripped = stripLocale(pathname, routing.locales)

  return (
    <div
      className={cn(
        'border-border-strong bg-bg-elevated inline-flex items-center gap-1 rounded-full border p-1',
        className,
      )}
      role="group"
      aria-label="Choose language"
    >
      <Globe aria-hidden="true" className="text-text-muted ml-2 h-3.5 w-3.5" />
      {routing.locales.map((locale) => {
        const active = locale === current
        const href = buildHref(locale, stripped)
        return (
          <Link
            key={locale}
            href={href}
            hrefLang={locale === 'zh' ? 'zh-CN' : locale}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'text-caption rounded-full px-3 py-1 font-mono uppercase tracking-[0.18em] transition',
              active
                ? 'bg-forge-orange text-bg-void'
                : 'text-text-secondary hover:text-text-primary',
            )}
          >
            {localeLabels[locale]}
          </Link>
        )
      })}
    </div>
  )
}

function stripLocale(pathname: string, locales: readonly string[]): string {
  for (const locale of locales) {
    if (pathname === `/${locale}`) return '/'
    if (pathname.startsWith(`/${locale}/`)) return pathname.slice(locale.length + 1)
  }
  return pathname
}

function detectLocale(pathname: string): Locale {
  for (const locale of routing.locales) {
    if (pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)) {
      return locale
    }
  }
  return routing.defaultLocale as Locale
}

function buildHref(locale: Locale, stripped: string): string {
  if (locale === routing.defaultLocale) return stripped
  if (stripped === '/') return `/${locale}`
  return `/${locale}${stripped}`
}
