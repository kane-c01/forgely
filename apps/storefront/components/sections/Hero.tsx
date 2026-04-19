import type { SectionOf } from '@forgely/dsl'

interface Props {
  config: SectionOf<'Hero'>['config']
}

/** Forgely storefront Hero — supports video / 3D / image layouts. */
export function Hero({ config }: Props) {
  return (
    <section className="relative isolate flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-bg-void px-6 text-center">
      {config.layout === 'video' && config.videoUrl ? (
        <video
          src={config.videoUrl}
          poster={config.posterUrl}
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 -z-10 h-full w-full object-cover opacity-70"
        />
      ) : null}
      {config.layout === 'image' && config.posterUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- generated storefronts use signed CDN urls; next/image domain config not viable per-tenant
        <img
          src={config.posterUrl}
          alt=""
          className="absolute inset-0 -z-10 h-full w-full object-cover opacity-70"
        />
      ) : null}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-bg-void/30 via-bg-void/50 to-bg-void" />

      <h1 className="max-w-5xl font-display text-display leading-[1.05] tracking-tight text-text-primary">
        {config.title}
      </h1>
      {config.subtitle ? (
        <p className="mt-6 max-w-2xl text-body-lg text-text-secondary">{config.subtitle}</p>
      ) : null}
      <a
        href={config.cta.href}
        className="mt-12 inline-flex h-12 items-center justify-center rounded-lg bg-forge-orange px-8 text-body font-medium text-bg-void shadow-elevated transition-colors hover:bg-forge-amber"
      >
        {config.cta.label}
      </a>
    </section>
  )
}
