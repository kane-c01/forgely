import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { SectionHeading } from '@/components/ui/section-heading'
import { cn } from '@/lib/cn'

interface ShowcaseCard {
  brand: string
  category: string
  dna: string
  moment: string
  /** Tailwind gradient classes for the placeholder visual (replaced with real video in T27). */
  gradient: string
  href?: string
}

const cards: ShowcaseCard[] = [
  {
    brand: 'Toybloom',
    category: 'Wooden toys',
    dna: 'Nordic Minimal',
    moment: 'M04 Breathing Still',
    gradient: 'from-[#E8E2D9] via-[#A89880] to-[#3F362F]',
  },
  {
    brand: 'Kyoto Mujo',
    category: 'Ceramic teaware',
    dna: 'Kyoto Ceramic',
    moment: 'M05 Droplet Ripple',
    gradient: 'from-[#FEFDFB] via-[#C7B299] to-[#2D2A26]',
  },
  {
    brand: 'Ember & Ash',
    category: 'Fragrance',
    dna: 'Bold Rebellious',
    moment: 'M06 Mist Emergence',
    gradient: 'from-[#FF6B1A] via-[#7A0F2D] to-[#0E0E11]',
  },
  {
    brand: 'Luma Wellness',
    category: 'Supplements',
    dna: 'Clinical Wellness',
    moment: 'M08 Ingredient Ballet',
    gradient: 'from-[#0F2A28] via-[#1F5C56] to-[#FFD166]',
  },
  {
    brand: 'Still Hours',
    category: 'Watches',
    dna: 'Tech Precision',
    moment: 'M03 Light Sweep',
    gradient: 'from-[#0E0E11] via-[#3D3D45] to-[#D9D9DD]',
  },
  {
    brand: 'Casa Verde',
    category: 'Organic tableware',
    dna: 'Organic Garden',
    moment: 'M10 Environmental Embed',
    gradient: 'from-[#1F2A1B] via-[#5A7A48] to-[#E6E3CF]',
  },
]

export function Showcase() {
  return (
    <section
      id="showcase"
      aria-labelledby="showcase-title"
      className="border-b border-border-subtle py-24 lg:py-32"
    >
      <div className="container-page flex flex-col gap-12">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            eyebrow="Showcase"
            title={<span id="showcase-title">10 visual DNAs · 10 product moments.</span>}
            description="One hundred fully-coherent looks, before you even touch the editor. Real client builds will replace these previews when private beta opens."
          />
          <Link
            href="#waitlist"
            className="inline-flex items-center gap-1.5 self-start rounded-full border border-border-strong px-4 py-2 text-small text-text-secondary transition hover:border-forge-orange/60 hover:text-forge-orange"
          >
            Forge yours
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <article
              key={card.brand}
              className="group relative flex aspect-[4/5] flex-col justify-between overflow-hidden rounded-2xl border border-border-strong bg-bg-deep p-6 transition hover:border-forge-orange/40"
            >
              <div
                aria-hidden="true"
                className={cn(
                  'absolute inset-0 -z-10 bg-gradient-to-br opacity-80 transition duration-cinematic group-hover:opacity-100',
                  card.gradient,
                )}
              />
              <div
                aria-hidden="true"
                className="absolute inset-0 -z-10 bg-gradient-to-t from-bg-void via-bg-void/40 to-transparent"
              />

              <div className="flex items-start justify-between">
                <Badge tone="default">{card.dna}</Badge>
                <Badge tone="forge">{card.moment}</Badge>
              </div>

              <div className="flex flex-col gap-1.5">
                <h3 className="font-display text-h2 font-light text-text-primary">
                  {card.brand}
                </h3>
                <p className="font-mono text-caption uppercase tracking-[0.2em] text-text-secondary">
                  {card.category}
                </p>
              </div>
            </article>
          ))}
        </div>

        <p className="text-center font-mono text-caption uppercase tracking-[0.22em] text-text-muted">
          Previews are stylized placeholders · real cinematic videos arrive with the Terminal upgrade (T27).
        </p>
      </div>
    </section>
  )
}
