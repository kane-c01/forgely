import Link from 'next/link'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { ScrollActs } from '@/components/scroll/scroll-acts'
import { forgeReelActs } from '@/lib/forge-reel'
import { buttonClasses } from '@/components/ui/button'
import { buildMetadata } from '@/lib/seo'

export const metadata = buildMetadata({
  title: 'The Forge — six-act preview',
  description:
    'Preview of the six-act cinematic scroll experience that will replace the marketing homepage in T27.',
  path: '/the-forge',
  noIndex: true,
})

export default function TheForgePage() {
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
          T27a · scroll foundation · preview
        </span>
        <Link href="#act-6-cta" className={buttonClasses({ size: 'sm', variant: 'secondary' })}>
          Skip to CTA
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </header>

      <main id="main">
        <ScrollActs acts={forgeReelActs} />

        <section className="border-border-subtle bg-bg-deep border-t py-16">
          <div className="container-page flex flex-col items-start gap-4">
            <span className="text-caption text-forge-orange font-mono uppercase tracking-[0.22em]">
              T27 roadmap
            </span>
            <h2 className="font-display text-h1 text-text-primary max-w-3xl font-light">
              This page is the foundation. The film comes next.
            </h2>
            <ul className="grid w-full grid-cols-1 gap-4 pt-4 md:grid-cols-3">
              {[
                {
                  pr: 'T27a (this PR)',
                  body: 'Lenis smooth scroll · 6-act ScrollTrigger structure · placeholder gradients · /the-forge preview route.',
                },
                {
                  pr: 'T27b',
                  body: 'R3F + Drei + Theatre.js Hero workshop scene OR Kling-rendered AV1 hero loop · per-act video bridges.',
                },
                {
                  pr: 'T27c',
                  body: 'Showcase grid w/ hover-play videos · interactive AI demo · testimonials masonry · final polish + Lighthouse 95+/85+.',
                },
              ].map((step) => (
                <li
                  key={step.pr}
                  className="border-border-strong bg-bg-elevated text-small text-text-secondary rounded-2xl border p-6"
                >
                  <div className="text-caption text-forge-orange mb-3 font-mono uppercase tracking-[0.22em]">
                    {step.pr}
                  </div>
                  {step.body}
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>
    </>
  )
}
