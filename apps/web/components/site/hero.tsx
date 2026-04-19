import Link from 'next/link'
import { ArrowDownRight } from 'lucide-react'
import { Badge } from '@forgely/ui'
import { WaitlistForm } from './waitlist-form'

/**
 * Hero – T07 MVP version.
 * 视觉占位：CSS 渐变 + 网格 + 锻造光斑。T27 时替换为 R3F 3D 工坊或预渲染视频。
 */
export function Hero() {
  return (
    <section
      id="waitlist"
      className="border-border-subtle relative isolate overflow-hidden border-b"
      aria-label="Hero"
    >
      <ForgeBackdrop />

      <div className="container-page relative z-10 flex min-h-[88vh] flex-col justify-center gap-12 py-24 lg:py-32">
        <div className="flex flex-col gap-8 lg:max-w-4xl">
          <Badge variant="forge" className="gap-1.5 self-start">
            <span
              className="bg-forge-orange shadow-glow-forge h-1.5 w-1.5 rounded-full"
              aria-hidden="true"
            />
            Private beta · forging now
          </Badge>

          <h1 className="font-display text-hero-mega text-text-primary font-light leading-[0.95] tracking-tight">
            Brand operating system
            <br />
            <span className="text-gradient-forge italic">for the AI era.</span>
          </h1>

          <p className="text-body-lg text-text-secondary max-w-2xl md:text-xl">
            Forge cinematic brand sites from a single link. Forgely turns any product URL into a
            fully-stocked store with motion, voice, and commerce — designed by AI, hosted on us,
            ready to sell in 5 minutes.
          </p>
        </div>

        <WaitlistForm />

        <div className="text-small text-text-muted flex flex-wrap items-center gap-x-8 gap-y-3">
          <span className="font-mono uppercase tracking-[0.18em]">
            Trusted by 2,000+ brands on the waitlist
          </span>
          <Link
            href="#how-it-works"
            className="text-text-secondary hover:text-forge-orange inline-flex items-center gap-1.5 transition"
          >
            See how it works
            <ArrowDownRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  )
}

function ForgeBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
      <div className="bg-bg-void absolute inset-0" />
      <div className="bg-grid-subtle absolute inset-0 opacity-60" />
      <div
        className="absolute -top-32 left-1/2 h-[640px] w-[640px] -translate-x-1/2 rounded-full opacity-70 blur-3xl"
        style={{
          background:
            'radial-gradient(circle, rgba(255,107,26,0.45) 0%, rgba(199,74,10,0.18) 35%, transparent 70%)',
        }}
      />
      <div
        className="absolute -bottom-40 right-[-10%] h-[560px] w-[560px] rounded-full opacity-50 blur-3xl"
        style={{
          background: 'radial-gradient(circle, rgba(255,209,102,0.25) 0%, transparent 65%)',
        }}
      />
      <div
        className="absolute inset-x-0 bottom-0 h-px"
        style={{
          background:
            'linear-gradient(90deg, transparent 0%, rgba(255,107,26,0.5) 50%, transparent 100%)',
        }}
      />
    </div>
  )
}
