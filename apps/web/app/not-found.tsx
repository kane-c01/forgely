import Link from 'next/link'
import { ArrowRight, Home } from 'lucide-react'
import { SiteNav } from '@/components/site/nav'
import { SiteFooter } from '@/components/site/footer'
import { buttonClasses } from '@/components/ui/button'

export default function NotFound() {
  return (
    <>
      <SiteNav />
      <main id="main" className="border-border-subtle border-b">
        <section className="container-page flex min-h-[70vh] flex-col items-center justify-center gap-8 py-24 text-center">
          <span className="text-caption text-forge-orange font-mono uppercase tracking-[0.24em]">
            404 · cold forge
          </span>
          <h1 className="font-display text-display text-text-primary font-light leading-[0.95] tracking-tight">
            Nothing forged
            <br />
            <span className="text-gradient-forge italic">at this address.</span>
          </h1>
          <p className="text-body-lg text-text-secondary max-w-xl">
            The page you tried to reach does not exist or has moved. Head back to the homepage, or
            jump straight to the things people usually look for.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/" className={buttonClasses({ variant: 'forge' })}>
              <Home className="-ml-1 h-4 w-4" aria-hidden="true" />
              Back to home
            </Link>
            <Link href="/#pricing" className={buttonClasses({ variant: 'outline' })}>
              See pricing
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link href="/the-forge" className={buttonClasses({ variant: 'outline' })}>
              The forge preview
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  )
}
