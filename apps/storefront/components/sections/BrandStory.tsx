import type { SectionOf } from '@forgely/dsl'

interface Props {
  config: SectionOf<'BrandStory'>['config']
}

export function BrandStory({ config }: Props) {
  return (
    <section className="relative w-full bg-bg-deep px-6 py-24">
      <div className="mx-auto grid max-w-7xl gap-12 md:grid-cols-2">
        {config.videoUrl ? (
          <video
            src={config.videoUrl}
            poster={config.posterUrl}
            autoPlay
            loop
            muted
            playsInline
            className="aspect-[4/3] w-full rounded-xl object-cover"
          />
        ) : config.posterUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={config.posterUrl} alt="" className="aspect-[4/3] w-full rounded-xl object-cover" />
        ) : null}
        <div className="flex flex-col justify-center">
          {config.headline ? (
            <h2 className="mb-6 font-display text-h1 text-text-primary">{config.headline}</h2>
          ) : null}
          <p className="whitespace-pre-line text-body-lg leading-relaxed text-text-secondary">{config.body}</p>
        </div>
      </div>
    </section>
  )
}
