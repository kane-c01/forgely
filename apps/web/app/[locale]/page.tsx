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
import { siteConfig } from '@/lib/site'

export const metadata = buildMetadata({
  title: 'Brand operating system for the AI era',
  description:
    'Forgely turns any product link into a cinematic, fully-stocked brand site — designed by AI, hosted on us, ready to sell in 5 minutes.',
  ogAlternateLocales: ['zh_CN'],
  hreflang: {
    en: siteConfig.url,
    'zh-CN': `${siteConfig.url}/zh`,
    'x-default': siteConfig.url,
  },
})

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
