import { hasLocale } from 'next-intl'
import { getTranslations } from 'next-intl/server'
import { SiteNav } from '@/components/site/nav'
import { Hero } from '@/components/site/hero'
import { SocialProof } from '@/components/site/social-proof'
import { ValueProps } from '@/components/site/value-props'
import { HowItWorks } from '@/components/site/how-it-works'
import { Showcase } from '@/components/site/showcase'
import { Pricing } from '@/components/site/pricing'
import { Faq } from '@/components/site/faq'
import { FinalCta } from '@/components/site/final-cta'
import { SiteFooter } from '@/components/site/footer'
// FAQ schema currently emitted from the locale-aware Faq component.
// `@/lib/faq` exports `getFaqItems(locale)` (async) post-T27f — we render
// it inside <Faq /> rather than computing it here.
import { buildMetadata } from '@/lib/seo'
import { routing, type Locale } from '@/i18n/routing'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const safeLocale: Locale = hasLocale(routing.locales, locale)
    ? (locale as Locale)
    : routing.defaultLocale
  const t = await getTranslations({ locale: safeLocale, namespace: 'metadata.home' })
  return buildMetadata({
    locale: safeLocale,
    title: t('title'),
    description: t('description'),
  })
}

export default function HomePage() {
  return (
    <>
      <SiteNav />
      <main id="main">
        <Hero />
        <SocialProof />
        <HowItWorks />
        <ValueProps />
        <Showcase />
        <Pricing />
        <Faq />
        <FinalCta />
      </main>
      <SiteFooter />
    </>
  )
}
