import { ZhNav } from '@/components/site/zh/zh-nav'
import { ZhHero } from '@/components/site/zh/zh-hero'
import {
  ZhFaq,
  ZhFinalCta,
  ZhHowItWorks,
  ZhPricing,
  ZhValueProps,
} from '@/components/site/zh/zh-sections'
import { ZhFooter } from '@/components/site/zh/zh-footer'
import { siteConfig } from '@/lib/site'
import { getMessages } from '@/lib/messages'
import { buildMetadata } from '@/lib/seo'

const t = getMessages('zh-CN').meta

export const metadata = buildMetadata({
  title: t.title,
  description: t.description,
  path: '/zh',
  ogLocale: 'zh_CN',
  ogAlternateLocales: ['en_US'],
  hreflang: {
    en: siteConfig.url,
    'zh-CN': `${siteConfig.url}/zh`,
    'x-default': siteConfig.url,
  },
})

export default function ZhHomePage() {
  return (
    <>
      <ZhNav />
      <main id="main">
        <ZhHero />
        <ZhHowItWorks />
        <ZhValueProps />
        <ZhPricing />
        <ZhFaq />
        <ZhFinalCta />
      </main>
      <ZhFooter />
    </>
  )
}
