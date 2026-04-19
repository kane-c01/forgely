'use client'

import { useLocale, useTranslations } from 'next-intl'
import { useTransition } from 'react'
import { Globe } from 'lucide-react'
import { usePathname, useRouter } from '@/i18n/navigation'
import { localeLabels, routing, type Locale } from '@/i18n/routing'
import { cn } from '@/lib/cn'

interface LocaleSwitcherProps {
  variant?: 'inline' | 'compact'
  className?: string
  onSwitch?: () => void
}

export function LocaleSwitcher({
  variant = 'compact',
  className,
  onSwitch,
}: LocaleSwitcherProps) {
  const t = useTranslations('common')
  const locale = useLocale() as Locale
  const pathname = usePathname()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const switchTo = (next: Locale) => {
    if (next === locale) return
    startTransition(() => {
      router.replace(pathname, { locale: next })
      onSwitch?.()
    })
  }

  if (variant === 'inline') {
    return (
      <div
        role="group"
        aria-label={t('switchLanguage')}
        className={cn(
          'inline-flex items-center gap-1 rounded-full border border-border-subtle bg-bg-elevated/60 p-1',
          className,
        )}
      >
        {routing.locales.map((loc) => {
          const isActive = loc === locale
          return (
            <button
              key={loc}
              type="button"
              onClick={() => switchTo(loc)}
              disabled={isPending && !isActive}
              aria-pressed={isActive}
              className={cn(
                'rounded-full px-3 py-1 font-mono text-caption uppercase tracking-[0.16em] transition',
                isActive
                  ? 'bg-forge-orange text-bg-void shadow-glow-forge'
                  : 'text-text-secondary hover:text-text-primary',
              )}
            >
              {loc === 'zh' ? '中' : 'EN'}
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div
      role="group"
      aria-label={t('switchLanguage')}
      className={cn(
        'inline-flex items-center gap-1 rounded-full border border-border-subtle bg-bg-elevated/60 px-2 py-1',
        className,
      )}
    >
      <Globe className="h-3.5 w-3.5 text-text-muted" aria-hidden="true" />
      {routing.locales.map((loc) => {
        const isActive = loc === locale
        return (
          <button
            key={loc}
            type="button"
            onClick={() => switchTo(loc)}
            disabled={isPending && !isActive}
            aria-pressed={isActive}
            title={localeLabels[loc]}
            className={cn(
              'rounded-full px-2 py-0.5 font-mono text-caption uppercase tracking-[0.18em] transition',
              isActive
                ? 'text-forge-orange'
                : 'text-text-muted hover:text-text-primary',
            )}
          >
            {loc === 'zh' ? '中' : 'EN'}
          </button>
        )
      })}
    </div>
  )
}
