import { WaitlistForm } from './waitlist-form'

export function FinalCta() {
  return (
    <section
      aria-labelledby="final-cta-title"
      className="relative isolate overflow-hidden border-b border-border-subtle py-24 lg:py-32"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-bg-void" />
        <div
          className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-60 blur-3xl"
          style={{
            background:
              'radial-gradient(circle, rgba(255,107,26,0.55) 0%, rgba(199,74,10,0.18) 35%, transparent 70%)',
          }}
        />
        <div className="absolute inset-0 bg-grid-subtle opacity-40" />
      </div>

      <div className="container-page flex flex-col items-center gap-10 text-center">
        <h2
          id="final-cta-title"
          className="font-display text-display font-light leading-[0.95] tracking-tight text-text-primary"
        >
          Your brand is one
          <br />
          <span className="text-gradient-forge italic">link away.</span>
        </h2>
        <p className="max-w-2xl text-body-lg text-text-secondary">
          Drop a store URL or your idea. Forgely will hand you back a cinematic,
          stockable, sellable brand site — usually in less than 5 minutes.
        </p>
        <WaitlistForm className="mx-auto" />
      </div>
    </section>
  )
}
