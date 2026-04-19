import { SectionHeading } from '@/components/ui/section-heading'

// Pure presentational; no client interactivity / no @forgely/ui dependency.
interface Step {
  index: string
  title: string
  body: string
  duration: string
}

const steps: Step[] = [
  {
    index: '01',
    title: 'Drop a link or describe a brand',
    body: 'Paste any Shopify, WooCommerce, Etsy or Amazon URL — or just type the idea. Forgely scrapes products, screenshots, copy, prices and intent.',
    duration: '~10s',
  },
  {
    index: '02',
    title: 'Forgely directs the film',
    body: 'A multi-agent crew (Analyzer, Director, Planner, Copywriter, Artist) picks a Visual DNA and Product Moment, then writes the shot list.',
    duration: '~30s',
  },
  {
    index: '03',
    title: 'Cinematic assets are forged',
    body: 'Hero loop, 3 micro-videos, brand story, product showcase and logos generate in parallel via Kling, Flux and Ideogram with auto-fallback.',
    duration: '2–4 min',
  },
  {
    index: '04',
    title: 'Compliance + SEO + storefront',
    body: 'FTC / GDPR / FDA rules sweep, structured data, llms.txt and a Medusa storefront are wired up automatically.',
    duration: '~30s',
  },
  {
    index: '05',
    title: 'Live in 5 minutes',
    body: 'Your site ships to Cloudflare with SSL on .forgely.app or a custom domain. Tweak with the visual editor or just talk to the AI Copilot.',
    duration: 'forever',
  },
]

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      aria-labelledby="how-title"
      className="border-border-subtle border-b py-24 lg:py-32"
    >
      <div className="container-page flex flex-col gap-14">
        <SectionHeading
          eyebrow="How it works"
          title={<span id="how-title">From a single link to a full brand.</span>}
          description="Five quiet steps, zero rituals. You stay the creative director. Forgely takes care of the production crew."
        />

        <ol className="border-border-strong bg-border-subtle grid gap-px overflow-hidden rounded-2xl border md:grid-cols-2 lg:grid-cols-5">
          {steps.map((step) => (
            <li key={step.index} className="bg-bg-deep flex flex-col gap-4 p-6 lg:p-7">
              <div className="flex items-baseline justify-between">
                <span className="text-caption text-forge-orange font-mono uppercase tracking-[0.22em]">
                  Step {step.index}
                </span>
                <span className="text-caption text-text-muted font-mono uppercase tracking-[0.18em]">
                  {step.duration}
                </span>
              </div>
              <h3 className="font-display text-h3 text-text-primary font-light">{step.title}</h3>
              <p className="text-small text-text-secondary">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
