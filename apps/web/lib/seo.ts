import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { siteConfig } from './site'
import { localeOgMap, routing, type Locale } from '@/i18n/routing'

interface BuildMetadataOptions {
  locale?: Locale
  title?: string
  description?: string
  /** Path *within* the locale (e.g. '/pricing' for /zh/pricing). Defaults to '/'. */
  path?: string
  image?: string
  noIndex?: boolean
}

function localizedUrl(locale: Locale, path: string): string {
  const cleanPath = path === '/' ? '' : path
  if (locale === routing.defaultLocale) {
    return `${siteConfig.url}${cleanPath || '/'}`
  }
  return `${siteConfig.url}/${locale}${cleanPath}`
}

/**
 * Build a locale-aware Next.js Metadata object.
 */
export async function buildMetadata(
  options: BuildMetadataOptions = {},
): Promise<Metadata> {
  const {
    locale = routing.defaultLocale,
    title,
    description,
    path = '/',
    image,
    noIndex = false,
  } = options

  const t = await getTranslations({ locale, namespace: 'metadata.site' })
  const tagline = t('tagline')
  const slogan = t('slogan')
  const defaultDesc = t('description')

  const fullTitle = title
    ? `${title} — ${siteConfig.name}`
    : `${siteConfig.name} — ${tagline}`
  const desc = description ?? defaultDesc
  const url = localizedUrl(locale, path)

  const overrideImage = image
    ? [{ url: image, width: 1200, height: 630, alt: slogan }]
    : undefined

  const languageAlternates = Object.fromEntries(
    routing.locales.map((loc: Locale) => [
      loc === 'zh' ? 'zh-CN' : 'en',
      localizedUrl(loc, path),
    ]),
  )

  return {
    metadataBase: new URL(siteConfig.url),
    title: fullTitle,
    description: desc,
    keywords: [...siteConfig.keywords],
    authors: [{ name: siteConfig.name, url: siteConfig.url }],
    creator: siteConfig.name,
    publisher: siteConfig.name,
    alternates: {
      canonical: url,
      languages: {
        ...languageAlternates,
        'x-default': localizedUrl(routing.defaultLocale, path),
      },
    },
    openGraph: {
      type: 'website',
      locale: localeOgMap[locale],
      alternateLocale: routing.locales
        .filter((l: Locale) => l !== locale)
        .map((l: Locale) => localeOgMap[l]),
      url,
      title: fullTitle,
      description: desc,
      siteName: siteConfig.name,
      ...(overrideImage ? { images: overrideImage } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description: desc,
      site: siteConfig.twitter,
      creator: siteConfig.twitter,
      ...(overrideImage ? { images: overrideImage } : {}),
    },
    robots: noIndex
      ? { index: false, follow: false }
      : {
          index: true,
          follow: true,
          googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
        },
    icons: {
      icon: [
        { url: '/favicon.svg', type: 'image/svg+xml' },
        { url: '/favicon.ico', sizes: 'any' },
      ],
      apple: '/apple-touch-icon.png',
    },
    manifest: '/site.webmanifest',
    other: {
      'theme-color': '#08080A',
    },
  }
}
