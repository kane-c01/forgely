import type { SectionOf } from '@forgely/dsl'

interface Props {
  config: SectionOf<'ProductShowcase'>['config']
  /** Resolved product details — passed in by the page (Compiler-injected loader). */
  products: Array<{
    id: string
    title: string
    priceCents: number
    currency: string
    imageUrl: string
    handle: string
  }>
}

export function ProductShowcase({ config, products }: Props) {
  const visible = products.filter((p) => config.productIds.includes(p.id))
  return (
    <section className="relative w-full bg-bg-void px-6 py-24">
      <div className="mx-auto max-w-7xl">
        {config.headline ? (
          <h2 className="mb-12 max-w-3xl font-display text-h1 text-text-primary">{config.headline}</h2>
        ) : null}
        <div
          className={`grid gap-6 ${
            config.layout === 'editorial'
              ? 'md:grid-cols-12'
              : config.layout === 'carousel'
                ? 'grid-flow-col auto-cols-[minmax(280px,1fr)] overflow-x-auto pb-4'
                : 'sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
          }`}
        >
          {visible.map((p) => (
            <a
              key={p.id}
              href={`/products/${p.handle}`}
              className={`group relative overflow-hidden rounded-xl border border-border-subtle bg-bg-elevated transition-colors hover:border-forge-orange ${config.layout === 'editorial' ? 'md:col-span-4' : ''}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.imageUrl}
                alt={p.title}
                className="aspect-square w-full object-cover transition-transform duration-medium ease-standard group-hover:scale-[1.03]"
              />
              <div className="flex items-center justify-between p-4">
                <span className="text-body text-text-primary">{p.title}</span>
                <span className="font-mono text-small text-forge-amber">
                  {p.currency} {(p.priceCents / 100).toFixed(2)}
                </span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
