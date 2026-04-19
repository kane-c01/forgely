import { Aperture, Cpu, Sparkles } from 'lucide-react'
import { SectionHeading } from '@/components/ui/section-heading'

interface ValueProp {
  icon: React.ReactNode
  title: string
  body: string
  meta: string
}

const values: ValueProp[] = [
  {
    icon: <Aperture className="h-5 w-5" />,
    title: 'Cinematic, end-to-end',
    body:
      "Hero, value props, brand story and product moments share one visual DNA — the way Aesop, Recess and Terminal feel, generated for you in minutes.",
    meta: '10 visual DNAs · 10 product moments',
  },
  {
    icon: <Cpu className="h-5 w-5" />,
    title: 'A real store, not a landing page',
    body:
      'Medusa v2 commerce is wired in from day one: products, cart, checkout, orders, inventory and Stripe. Code export when you outgrow us.',
    meta: 'Stripe · PayPal · NOWPayments',
  },
  {
    icon: <Sparkles className="h-5 w-5" />,
    title: 'AI Copilot that ships, not chats',
    body:
      'A tool-using agent lives in your dashboard. Ask it to rewrite copy, swap a hero video, ship a discount, or redesign a section — it does the work.',
    meta: '20+ admin tools · long-term memory',
  },
]

export function ValueProps() {
  return (
    <section
      id="how-it-works"
      aria-labelledby="value-props-title"
      className="border-b border-border-subtle py-24 lg:py-32"
    >
      <div className="container-page flex flex-col gap-16">
        <SectionHeading
          eyebrow="Why Forgely"
          title={
            <span id="value-props-title">
              Three <em className="font-display italic text-forge-orange">unfair</em> advantages
            </span>
          }
          description="A brand site is more than pretty pictures. Forgely co-designs the look, the sound, the structure and the storefront — then keeps shipping with you."
        />

        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-border-strong bg-border-subtle md:grid-cols-3">
          {values.map((v) => (
            <article
              key={v.title}
              className="relative flex flex-col gap-6 bg-bg-deep p-8 lg:p-10"
            >
              <span
                aria-hidden="true"
                className="grid h-11 w-11 place-items-center rounded-md border border-forge-orange/40 bg-forge-orange/10 text-forge-orange"
              >
                {v.icon}
              </span>
              <div className="flex flex-col gap-3">
                <h3 className="font-display text-h2 font-light text-text-primary">
                  {v.title}
                </h3>
                <p className="text-body text-text-secondary">{v.body}</p>
              </div>
              <div className="mt-auto pt-6 font-mono text-caption uppercase tracking-[0.18em] text-text-muted">
                {v.meta}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
