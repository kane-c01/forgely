import type { SectionOf } from '@forgely/dsl'

interface Props {
  config: SectionOf<'ValueProps'>['config']
}

export function ValueProps({ config }: Props) {
  return (
    <section className="relative w-full bg-bg-deep px-6 py-24">
      <div className="mx-auto max-w-7xl">
        {config.headline ? (
          <h2 className="mb-16 max-w-3xl font-display text-h1 text-text-primary">{config.headline}</h2>
        ) : null}
        <div className={`grid gap-10 ${config.items.length >= 3 ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
          {config.items.map((item, i) => (
            <div
              key={`${item.title}-${i}`}
              className="rounded-xl border border-border-subtle bg-bg-elevated p-8 shadow-subtle"
            >
              {item.iconUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.iconUrl} alt="" className="mb-4 h-10 w-10" />
              ) : null}
              <h3 className="mb-3 font-heading text-h3 text-text-primary">{item.title}</h3>
              <p className="text-body text-text-secondary">{item.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
