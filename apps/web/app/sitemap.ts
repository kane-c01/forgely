import type { MetadataRoute } from 'next'
import { siteConfig } from '@/lib/site'
import { routing, type Locale } from '@/i18n/routing'

function localizedUrl(locale: Locale, suffix = ''): string {
  if (locale === routing.defaultLocale) {
    return `${siteConfig.url}${suffix}` || siteConfig.url
  }
  return `${siteConfig.url}/${locale}${suffix}`
}

function buildAlternates(suffix = '') {
  const languages = Object.fromEntries(
    routing.locales.map((loc: Locale) => [
      loc === 'zh' ? 'zh-CN' : 'en',
      localizedUrl(loc, suffix),
    ]),
  )
  return { languages }
}

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  const sections: Array<{
    suffix: string
    priority: number
    freq: 'weekly' | 'monthly'
  }> = [
    { suffix: '', priority: 1, freq: 'weekly' },
    { suffix: '/#pricing', priority: 0.8, freq: 'monthly' },
    { suffix: '/#how-it-works', priority: 0.7, freq: 'monthly' },
    { suffix: '/#showcase', priority: 0.6, freq: 'monthly' },
    { suffix: '/#faq', priority: 0.6, freq: 'monthly' },
  ]

  return routing.locales.flatMap((locale: Locale) =>
    sections.map(({ suffix, priority, freq }) => ({
      url: localizedUrl(locale, suffix),
      lastModified: now,
      changeFrequency: freq,
      priority,
      alternates: buildAlternates(suffix),
    })),
  )
}
