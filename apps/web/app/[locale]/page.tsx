import { getTranslations, setRequestLocale } from 'next-intl/server'
import { hasLocale } from 'next-intl'
import { notFound } from 'next/navigation'
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
import { getFaqItems } from '@/lib/faq'
import { faqSchema, jsonLd } from '@/lib/schema'
import { buildMetadata } from '@/lib/seo'
import { routing, type Locale } from '@/i18n/routing'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) return {}
  const t = await getTranslations({ locale, namespace: 'metadata.home' })
  return buildMetadata({
    locale: locale as Locale,
    title: t('title'),
    description: t('description'),
  })
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) {
    notFound()
  }
  setRequestLocale(locale)

  const faqItems = await getFaqItems(locale as Locale)

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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(faqSchema(faqItems)) }}
      />
    </>
  )
}
