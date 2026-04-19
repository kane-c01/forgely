import Link from 'next/link'
import { Globe } from 'lucide-react'
import { LOCALE_HREF, LOCALE_LABEL, SUPPORTED_LOCALES, type Locale } from '@/lib/i18n'
import { cn } from '@/lib/cn'

interface LocaleSwitcherProps {
  /** Currently active locale, used to highlight the link. */
  current: Locale
  className?: string
}

/**
 * Tiny pill-style locale switcher rendered in the footer + every
 * locale-specific layout. Uses real anchor links (so it works without
 * JS and so search engines can crawl all locales).
 */
export function LocaleSwitcher({ current, className }: LocaleSwitcherProps) {
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
      {SUPPORTED_LOCALES.map((locale) => {
        const active = locale === current
        return (
          <Link
            key={locale}
            href={LOCALE_HREF[locale]}
            hrefLang={locale}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'text-caption rounded-full px-3 py-1 font-mono uppercase tracking-[0.18em] transition',
              active
                ? 'bg-forge-orange text-bg-void'
                : 'text-text-secondary hover:text-text-primary',
            )}
          >
            {LOCALE_LABEL[locale]}
          </Link>
        )
      })}
    </div>
  )
}
