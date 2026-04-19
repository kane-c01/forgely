import Link from 'next/link'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { ForgePipelineRunner } from '@/components/generate/forge-pipeline-runner'
import { buttonClasses } from '@/components/ui/button'
import { buildMetadata } from '@/lib/seo'

export const metadata = buildMetadata({
  title: 'Generate · 12-step preview',
  description:
    'Watch a faithful front-end preview of the Forgely 12-step Agent pipeline — from Scraper to Deployer in under 90 seconds.',
  path: '/generate',
  noIndex: true,
})

export default function GeneratePage() {
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
          T27d · 12-step preview · staging
        </span>
        <Link
          href="https://app.forgely.com"
          className={buttonClasses({ size: 'sm', variant: 'outline' })}
          target="_blank"
          rel="noreferrer"
        >
          Open the real Copilot
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </header>

      <main id="main">
        <ForgePipelineRunner />

        <section className="border-border-subtle bg-bg-deep border-t py-16">
          <div className="container-page flex flex-col gap-4">
            <span className="text-caption text-forge-orange font-mono uppercase tracking-[0.22em]">
              How this matches production
            </span>
            <h2 className="font-display text-h1 text-text-primary max-w-3xl font-light">
              Same 12 events. Same agents. Same prompts. Real renders behind sign-in.
            </h2>
            <p className="text-body-lg text-text-secondary max-w-3xl">
              Every line you saw streamed above is taken from the actual
              <code className="text-text-primary px-1 font-mono">AgentEvent</code> bus that powers
              the Forgely runtime (docs §5.3 / §5.4). The marketing preview is locked to the
              toybloom.myshopify.com fixture so it always completes deterministically — the live
              pipeline plugs into your real Scraper output and Director script via{' '}
              <Link href="https://app.forgely.com" className="text-forge-orange hover:underline">
                app.forgely.com
              </Link>
              .
            </p>
          </div>
        </section>
      </main>
    </>
  )
}
