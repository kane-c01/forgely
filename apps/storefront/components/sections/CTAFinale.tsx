import type { SectionOf } from '@forgely/dsl'

interface Props {
  config: SectionOf<'CTAFinale'>['config']
}

export function CTAFinale({ config }: Props) {
  return (
    <section className="relative isolate w-full overflow-hidden bg-bg-void px-6 py-32 text-center">
      {config.backgroundVideoUrl ? (
        <video
          src={config.backgroundVideoUrl}
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 -z-10 h-full w-full object-cover opacity-30"
        />
      ) : null}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-bg-void/70 to-bg-void" />
      <h2 className="mx-auto max-w-4xl font-display text-display leading-[1.1] text-text-primary">
        {config.headline}
      </h2>
      {config.body ? (
        <p className="mx-auto mt-6 max-w-2xl text-body-lg text-text-secondary">{config.body}</p>
      ) : null}
      <a
        href={config.cta.href}
        className="mt-12 inline-flex h-14 items-center justify-center rounded-lg bg-forge-orange px-10 text-body-lg font-medium text-bg-void shadow-elevated transition-colors hover:bg-forge-amber"
      >
        {config.cta.label}
      </a>
    </section>
  )
}
