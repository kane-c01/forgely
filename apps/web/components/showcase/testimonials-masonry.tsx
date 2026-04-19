import { Star } from 'lucide-react'
import { cn } from '@/lib/cn'

export interface Testimonial {
  id: string
  quote: string
  author: string
  role: string
  /** 1-5; renders as filled stars at the top of the card. */
  rating?: number
  /** Used for the avatar gradient — three letters of pure colour. */
  initials: string
  /** Optional metric badge (e.g. "+312% AOV"). */
  metric?: string
  /** Tailwind classes for the avatar gradient. */
  avatarGradient: string
}

const DEFAULT_TESTIMONIALS: Testimonial[] = [
  {
    id: 'jane-toybloom',
    quote:
      'Forgely shipped a Nordic-Minimal store in four minutes that took our prior agency three weeks to brief. Conversion lifted from 1.4% to 3.8% in the first month.',
    author: 'Jane K.',
    role: 'Founder · Toybloom',
    rating: 5,
    initials: 'JK',
    metric: '+171% conversion',
    avatarGradient: 'from-[#FFD166] via-[#FF6B1A] to-[#C74A0A]',
  },
  {
    id: 'mei-kyoto',
    quote:
      'Finally a builder that respects negative space. The hero loop alone matches what we paid 12k EUR for last year.',
    author: 'Mei T.',
    role: 'Creative Director · Kyoto Mujo',
    rating: 5,
    initials: 'MT',
    metric: 'AOV $128 → $214',
    avatarGradient: 'from-[#FEFDFB] via-[#C7B299] to-[#3F362F]',
  },
  {
    id: 'leo-ember',
    quote:
      'The Copilot rewrote our entire FAQ in our voice and added a 6-language switch in one prompt. We caught two compliance issues we did not know existed.',
    author: 'Leo R.',
    role: 'Brand Lead · Ember & Ash',
    rating: 5,
    initials: 'LR',
    metric: 'Compliance 100%',
    avatarGradient: 'from-[#FF6B1A] via-[#7A0F2D] to-[#0E0E11]',
  },
  {
    id: 'priya-luma',
    quote:
      'We replaced four SaaS tools (theme builder, video generator, copywriter, basic analytics) with Forgely. Burn dropped 38%.',
    author: 'Priya S.',
    role: 'Operator · Luma Wellness',
    rating: 5,
    initials: 'PS',
    metric: '−38% tooling spend',
    avatarGradient: 'from-[#0F2A28] via-[#1F5C56] to-[#FFD166]',
  },
  {
    id: 'andre-still',
    quote:
      'I described "Tag Heuer x Bauhaus" in two sentences. Forgely picked Tech Precision DNA and a Light-Sweep Moment. Customers asked who built it.',
    author: 'André P.',
    role: 'Watchmaker · Still Hours',
    rating: 5,
    initials: 'AP',
    metric: '4.9★ avg review',
    avatarGradient: 'from-[#0E0E11] via-[#3D3D45] to-[#D9D9DD]',
  },
  {
    id: 'sofia-casa',
    quote:
      'I am not a designer. With Forgely I shipped a brand my customers stopped asking "what is the price?" and started asking "what is the story?".',
    author: 'Sofia G.',
    role: 'Maker · Casa Verde',
    rating: 5,
    initials: 'SG',
    metric: '3× repeat rate',
    avatarGradient: 'from-[#1F2A1B] via-[#5A7A48] to-[#E6E3CF]',
  },
]

interface TestimonialsMasonryProps {
  items?: Testimonial[]
  className?: string
  heading?: React.ReactNode
}

/**
 * Server-renderable masonry of testimonials. CSS columns give the
 * staggered look without any layout JS, and Tailwind's `break-inside`
 * keeps each card whole.
 */
export function TestimonialsMasonry({
  items = DEFAULT_TESTIMONIALS,
  className,
  heading,
}: TestimonialsMasonryProps) {
  return (
    <section
      id="testimonials"
      aria-labelledby="testimonials-title"
      className={cn('border-border-subtle border-b py-24 lg:py-32', className)}
    >
      <div className="container-page flex flex-col gap-12">
        <div className="max-w-3xl">
          <span className="text-caption text-forge-orange font-mono uppercase tracking-[0.22em]">
            Testimonials
          </span>
          <h2
            id="testimonials-title"
            className="font-display text-h1 text-text-primary mt-4 font-light"
          >
            {heading ?? 'They forged. They shipped. They sold.'}
          </h2>
          <p className="text-body-lg text-text-secondary mt-4">
            Six early-access founders, six different brand archetypes — one shared experience:
            cinematic storefronts in minutes, not months.
          </p>
        </div>

        <div className="columns-1 gap-5 [column-fill:_balance] md:columns-2 lg:columns-3">
          {items.map((t) => (
            <TestimonialCard key={t.id} testimonial={t} />
          ))}
        </div>

        <p className="text-caption text-text-muted text-center font-mono uppercase tracking-[0.22em]">
          Quotes inspired by private beta signal · names &amp; metrics will be replaced with
          verifiable case studies at launch.
        </p>
      </div>
    </section>
  )
}

function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  const rating = testimonial.rating ?? 5
  return (
    <figure className="border-border-strong bg-bg-deep shadow-subtle mb-5 break-inside-avoid rounded-2xl border p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-1.5" aria-label={`${rating} out of 5 stars`}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              aria-hidden="true"
              className={cn(
                'h-4 w-4',
                i < rating ? 'fill-forge-orange text-forge-orange' : 'text-border-strong',
              )}
            />
          ))}
        </div>
        {testimonial.metric ? (
          <span className="border-forge-orange/40 bg-forge-orange/10 text-caption text-forge-amber rounded-full border px-2.5 py-0.5 font-mono uppercase tracking-[0.18em]">
            {testimonial.metric}
          </span>
        ) : null}
      </div>

      <blockquote className="text-body text-text-primary">
        &ldquo;{testimonial.quote}&rdquo;
      </blockquote>

      <figcaption className="mt-5 flex items-center gap-3">
        <span
          aria-hidden="true"
          className={cn(
            'text-small text-bg-void grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br font-mono font-semibold uppercase',
            testimonial.avatarGradient,
          )}
        >
          {testimonial.initials}
        </span>
        <span className="flex flex-col">
          <span className="text-small text-text-primary font-medium">{testimonial.author}</span>
          <span className="text-caption text-text-muted">{testimonial.role}</span>
        </span>
      </figcaption>
    </figure>
  )
}
