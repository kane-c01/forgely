import type { SectionOf } from '@forgely/dsl'

interface Props {
  config: SectionOf<'Faq'>['config']
}

export function Faq({ config }: Props) {
  return (
    <section className="relative w-full bg-bg-deep px-6 py-24">
      <div className="mx-auto max-w-3xl">
        {config.headline ? (
          <h2 className="mb-12 font-display text-h1 text-text-primary">{config.headline}</h2>
        ) : null}
        <dl className="divide-y divide-border-subtle">
          {config.items.map((item) => (
            <details key={item.q} className="group py-6 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer items-center justify-between gap-4 text-left">
                <dt className="font-heading text-body-lg text-text-primary">{item.q}</dt>
                <span className="text-text-muted transition-transform duration-short ease-standard group-open:rotate-180">▾</span>
              </summary>
              <dd className="mt-4 whitespace-pre-line text-body text-text-secondary">{item.a}</dd>
            </details>
          ))}
        </dl>
      </div>
    </section>
  )
}
