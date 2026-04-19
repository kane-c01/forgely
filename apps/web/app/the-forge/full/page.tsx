import Link from 'next/link'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { ScrollActs } from '@/components/scroll/scroll-acts'
import { ShowcaseGrid } from '@/components/showcase/showcase-grid'
import { InteractiveDemo } from '@/components/showcase/interactive-demo'
import { TestimonialsMasonry } from '@/components/showcase/testimonials-masonry'
import { forgeReelActs } from '@/lib/forge-reel'
import { showcaseItems } from '@/lib/showcase'
import { buttonClasses } from '@/components/ui/button'
import { buildMetadata } from '@/lib/seo'

export const metadata = buildMetadata({
  title: 'The Forge — full Terminal preview',
  description:
    'Complete T27 preview: cinematic six-act reel + showcase + interactive demo + testimonials.',
  path: '/the-forge/full',
  noIndex: true,
})

export default function TheForgeFullPage() {
  return (
    <>
      <header className="container-page border-border-subtle bg-bg-void/80 sticky top-0 z-40 flex items-center justify-between gap-4 border-b py-4 backdrop-blur-md">
        <Link
          href="/"
          className="text-caption text-text-secondary hover:text-forge-orange inline-flex items-center gap-2 font-mono uppercase tracking-[0.22em] transition"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to forgely.com
        </Link>
        <span className="text-caption text-text-muted font-mono uppercase tracking-[0.24em]">
          T27 · full Terminal preview · staging
        </span>
        <Link href="#waitlist" className={buttonClasses({ size: 'sm', variant: 'outline' })}>
          Waitlist
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </header>

      <main id="main">
        <ScrollActs acts={forgeReelActs} />

        <ShowcaseGrid items={showcaseItems} />

        <InteractiveDemo />

        <TestimonialsMasonry />

        <section
          id="waitlist"
          aria-labelledby="forge-final-cta"
          className="border-border-subtle bg-bg-deep relative isolate overflow-hidden border-t py-24 lg:py-32"
        >
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
            <div className="bg-bg-void absolute inset-0" />
            <div
              className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-60 blur-3xl"
              style={{
                background:
                  'radial-gradient(circle, rgba(255,107,26,0.55) 0%, rgba(199,74,10,0.18) 35%, transparent 70%)',
              }}
            />
          </div>

          <div className="container-page flex flex-col items-center gap-8 text-center">
            <h2
              id="forge-final-cta"
              className="font-display text-display text-text-primary font-light leading-[0.95] tracking-tight"
            >
              That is the Terminal-level <span className="text-gradient-forge italic">forge</span>.
            </h2>
            <p className="text-body-lg text-text-secondary max-w-2xl">
              When this preview merges into <code className="text-text-primary font-mono">/</code>,
              every visitor lands here. Until then, click back to the live MVP and join the waitlist
              to get a generation invite.
            </p>
            <Link href="/" className={buttonClasses({ variant: 'forge', size: 'lg' })}>
              Back to live homepage
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </Link>
          </div>
        </section>
      </main>
    </>
  )
}
