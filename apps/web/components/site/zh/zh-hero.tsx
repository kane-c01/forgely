import Link from 'next/link'
import { ArrowDownRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { ZhWaitlistForm } from './zh-waitlist-form'
import { getMessages } from '@/lib/messages'

export function ZhHero() {
  const t = getMessages('zh-CN').hero
  return (
    <section
      id="waitlist"
      className="border-border-subtle relative isolate overflow-hidden border-b"
      aria-label="主视觉"
    >
      <ForgeBackdrop />

      <div className="container-page relative z-10 flex min-h-[88vh] flex-col justify-center gap-12 py-24 lg:py-32">
        <div className="flex flex-col gap-8 lg:max-w-4xl">
          <Badge tone="forge" className="self-start">
            <span
              className="bg-forge-orange shadow-glow-forge h-1.5 w-1.5 rounded-full"
              aria-hidden="true"
            />
            {t.badge}
          </Badge>

          <h1 className="font-display text-hero-mega text-text-primary font-light leading-[0.95] tracking-tight">
            {t.title[0]}
            <br />
            <span className="text-gradient-forge italic">{t.title[1]}</span>
          </h1>

          <p className="text-body-lg text-text-secondary max-w-2xl md:text-xl">{t.subtitle}</p>
        </div>

        <ZhWaitlistForm />

        <div className="text-small text-text-muted flex flex-wrap items-center gap-x-8 gap-y-3">
          <span className="font-mono uppercase tracking-[0.18em]">{t.socialProof}</span>
          <Link
            href="#how-it-works"
            className="text-text-secondary hover:text-forge-orange inline-flex items-center gap-1.5 transition"
          >
            {t.seeHow}
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
