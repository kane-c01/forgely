import type { SectionOf } from '@forgely/dsl'

interface Props {
  config: SectionOf<'SocialProof'>['config']
}

export function SocialProof({ config }: Props) {
  return (
    <section className="relative w-full bg-bg-void px-6 py-24">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-6 md:grid-cols-3">
          {config.quotes.map((q, i) => (
            <figure
              key={`${q.author}-${i}`}
              className="rounded-xl border border-border-subtle bg-bg-elevated p-6 shadow-subtle"
            >
              <blockquote className="text-body-lg text-text-primary">&ldquo;{q.body}&rdquo;</blockquote>
              <figcaption className="mt-6 flex items-center gap-3">
                {q.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={q.avatarUrl} alt="" className="h-10 w-10 rounded-full object-cover" />
                ) : (
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-forge-orange/20 font-mono text-small text-forge-amber">
                    {q.author[0]}
                  </span>
                )}
                <div>
                  <div className="font-heading text-small text-text-primary">{q.author}</div>
                  {q.role ? <div className="text-caption text-text-muted">{q.role}</div> : null}
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
        {config.pressLogos && config.pressLogos.length > 0 ? (
          <div className="mt-16 flex flex-wrap items-center justify-center gap-8 opacity-50">
            {config.pressLogos.map((logo) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={logo} src={logo} alt="" className="h-8 object-contain" />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  )
}
