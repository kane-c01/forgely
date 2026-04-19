'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Menu, X } from 'lucide-react'
import { buttonClasses } from '@/components/ui/button'
import { siteConfig } from '@/lib/site'
import { getMessages } from '@/lib/messages'
import { cn } from '@/lib/cn'

export function ZhNav() {
  const t = getMessages('zh-CN').nav
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={cn(
        'duration-medium ease-standard sticky top-0 z-40 w-full transition',
        scrolled
          ? 'border-border-subtle bg-bg-void/85 border-b backdrop-blur-md'
          : 'border-b border-transparent bg-transparent',
      )}
    >
      <div className="container-page flex h-16 items-center justify-between">
        <Link href="/zh" className="flex items-center gap-2.5" aria-label={siteConfig.name}>
          <span
            aria-hidden="true"
            className="from-forge-amber via-forge-orange to-forge-ember shadow-glow-forge grid h-8 w-8 place-items-center rounded-md bg-gradient-to-br"
          >
            <svg viewBox="0 0 24 24" className="text-bg-void h-4 w-4" aria-hidden="true">
              <path d="M5 14L12 3l7 11-7 7-7-7zm7-7l-3 5h6l-3-5z" fill="currentColor" />
            </svg>
          </span>
          <span className="font-display text-h3 text-text-primary tracking-tight">
            {siteConfig.name}
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex" aria-label="主导航">
          {t.primary.map((link) => (
            <Link
              key={link.id}
              href={link.href}
              className="text-small text-text-secondary hover:text-text-primary transition"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            href={siteConfig.appUrl}
            className="text-small text-text-secondary hover:text-text-primary"
          >
            {t.signIn}
          </Link>
          <Link href="#waitlist" className={buttonClasses({ size: 'sm' })}>
            {t.cta}
          </Link>
        </div>

        <button
          type="button"
          className="border-border-subtle text-text-primary grid h-10 w-10 place-items-center rounded-md border md:hidden"
          aria-label={open ? t.closeMenu : t.openMenu}
          aria-expanded={open}
          aria-controls="zh-mobile-nav"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open ? (
        <nav
          id="zh-mobile-nav"
          aria-label="移动端导航"
          className="border-border-subtle bg-bg-deep border-t md:hidden"
        >
          <div className="container-page flex flex-col gap-4 py-6">
            {t.primary.map((link) => (
              <Link
                key={link.id}
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
              {t.signIn}
            </Link>
            <Link
              href="#waitlist"
              onClick={() => setOpen(false)}
              className={buttonClasses({ size: 'md' })}
            >
              {t.cta}
            </Link>
          </div>
        </nav>
      ) : null}
    </header>
  )
}
