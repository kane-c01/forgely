import Link from 'next/link'
import { ArrowDownRight } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Badge } from '@/components/ui/badge'
import { WaitlistForm } from './waitlist-form'

/**
 * Hero – T07 MVP version.
 * 视觉占位：CSS 渐变 + 网格 + 锻造光斑。T27 时替换为 R3F 3D 工坊或预渲染视频。
 */
export function Hero() {
  const t = useTranslations('hero')
  return (
    <section
      id="waitlist"
      className="relative isolate overflow-hidden border-b border-border-subtle"
      aria-label={t('ariaLabel')}
    >
      <ForgeBackdrop />

      <div className="container-page relative z-10 flex min-h-[88vh] flex-col justify-center gap-12 py-24 lg:py-32">
        <div className="flex flex-col gap-8 lg:max-w-4xl">
          <Badge tone="forge" className="self-start">
            <span
              className="h-1.5 w-1.5 rounded-full bg-forge-orange shadow-glow-forge"
              aria-hidden="true"
            />
            {t('badge')}
          </Badge>

          <h1 className="font-display text-hero-mega font-light leading-[0.95] tracking-tight text-text-primary">
            {t('titleLine1')}
            <br />
            <span className="text-gradient-forge italic">{t('titleLine2')}</span>
          </h1>

          <p className="max-w-2xl text-body-lg text-text-secondary md:text-xl">
            {t('description')}
          </p>
        </div>

        <WaitlistForm />

        <div className="flex flex-wrap items-center gap-x-8 gap-y-3 text-small text-text-muted">
          <span className="font-mono uppercase tracking-[0.18em]">
            {t('trustedBy')}
          </span>
          <Link
            href="#how-it-works"
            className="inline-flex items-center gap-1.5 text-text-secondary transition hover:text-forge-orange"
          >
            {t('seeHowItWorks')}
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
      <div className="absolute inset-0 bg-bg-void" />
      <div className="absolute inset-0 bg-grid-subtle opacity-60" />
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
          background:
            'radial-gradient(circle, rgba(255,209,102,0.25) 0%, transparent 65%)',
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
