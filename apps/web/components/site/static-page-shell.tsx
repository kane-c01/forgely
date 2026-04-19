import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { SiteNav } from '@/components/site/nav'
import { SiteFooter } from '@/components/site/footer'

interface StaticPageShellProps {
  eyebrow: string
  title: string
  intro?: string
  /** ISO date string for the "last updated" stamp on legal pages. */
  updated?: string
  children: React.ReactNode
}

/**
 * Shared chrome for static / legal / placeholder pages.
 * Re-uses the marketing nav + footer so the brand stays consistent
 * outside of the homepage. Body content is rendered inside a
 * `prose`-like flow with comfortable max-width.
 */
export function StaticPageShell({
  eyebrow,
  title,
  intro,
  updated,
  children,
}: StaticPageShellProps) {
  return (
    <>
      <SiteNav />
      <main id="main" className="border-border-subtle border-b">
        <header className="container-page flex flex-col gap-6 pb-12 pt-16 lg:pb-16 lg:pt-24">
          <Link
            href="/"
            className="text-caption text-text-secondary hover:text-forge-orange inline-flex items-center gap-2 self-start font-mono uppercase tracking-[0.22em] transition"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to forgely.com
          </Link>
          <span className="text-caption text-forge-orange font-mono uppercase tracking-[0.22em]">
            {eyebrow}
          </span>
          <h1 className="font-display text-display text-text-primary font-light leading-[1] tracking-tight">
            {title}
          </h1>
          {intro ? <p className="text-body-lg text-text-secondary max-w-2xl">{intro}</p> : null}
          {updated ? (
            <p className="text-caption text-text-muted font-mono uppercase tracking-[0.18em]">
              Last updated {updated}
            </p>
          ) : null}
        </header>

        <div className="container-page pb-24">
          <article className="prose-forgely max-w-3xl">{children}</article>
        </div>
      </main>
      <SiteFooter />
    </>
  )
}
