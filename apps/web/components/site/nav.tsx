'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Menu, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Link as IntlLink } from '@/i18n/navigation'
import { buttonClasses } from '@/components/ui/button'
import { LocaleSwitcher } from '@/components/site/locale-switcher'
import { siteConfig } from '@/lib/site'
import { cn } from '@/lib/cn'

export function SiteNav() {
  const t = useTranslations('nav')
  const tc = useTranslations('common')
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  const navLinks = [
    { href: '#how-it-works', label: t('howItWorks') },
    { href: '#pricing', label: t('pricing') },
    { href: '#showcase', label: t('showcase') },
    { href: '#faq', label: t('faq') },
  ]

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={cn(
        'sticky top-0 z-40 w-full transition duration-medium ease-standard',
        scrolled
          ? 'border-b border-border-subtle bg-bg-void/85 backdrop-blur-md'
          : 'border-b border-transparent bg-transparent',
      )}
    >
      <div className="container-page flex h-16 items-center justify-between">
        <IntlLink
          href="/"
          className="flex items-center gap-2.5"
          aria-label={siteConfig.name}
        >
          <span
            aria-hidden="true"
            className="grid h-8 w-8 place-items-center rounded-md bg-gradient-to-br from-forge-amber via-forge-orange to-forge-ember shadow-glow-forge"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-4 w-4 text-bg-void"
              aria-hidden="true"
            >
              <path
                d="M5 14L12 3l7 11-7 7-7-7zm7-7l-3 5h6l-3-5z"
                fill="currentColor"
              />
            </svg>
          </span>
          <span className="font-display text-h3 tracking-tight text-text-primary">
            {siteConfig.name}
          </span>
        </IntlLink>

        <nav
          className="hidden items-center gap-8 md:flex"
          aria-label={tc('primaryNav')}
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-small text-text-secondary transition hover:text-text-primary"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <LocaleSwitcher />
          <Link
            href={siteConfig.appUrl}
            className="text-small text-text-secondary hover:text-text-primary"
          >
            {t('signIn')}
          </Link>
          <Link href="#waitlist" className={buttonClasses({ size: 'sm' })}>
            {t('startForging')}
          </Link>
        </div>

        <button
          type="button"
          className="grid h-10 w-10 place-items-center rounded-md border border-border-subtle text-text-primary md:hidden"
          aria-label={open ? tc('closeMenu') : tc('openMenu')}
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open ? (
        <nav
          id="mobile-nav"
          aria-label={tc('mobileNav')}
          className="border-t border-border-subtle bg-bg-deep md:hidden"
        >
          <div className="container-page flex flex-col gap-4 py-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="text-body text-text-secondary hover:text-text-primary"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href={siteConfig.appUrl}
              onClick={() => setOpen(false)}
              className="text-body text-text-secondary hover:text-text-primary"
            >
              {t('signIn')}
            </Link>
            <div className="pt-2">
              <LocaleSwitcher
                variant="inline"
                onSwitch={() => setOpen(false)}
              />
            </div>
            <Link
              href="#waitlist"
              onClick={() => setOpen(false)}
              className={buttonClasses({ size: 'md' })}
            >
              {t('startForging')}
            </Link>
          </div>
        </nav>
      ) : null}
    </header>
  )
}
