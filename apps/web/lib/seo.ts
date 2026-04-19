import type { Metadata } from 'next'
import { localeOgMap, routing, type Locale } from '@/i18n/routing'
import { siteConfig } from './site'

interface BuildMetadataOptions {
  title?: string
  description?: string
  path?: string
  /** Override the OG image. When omitted, Next.js auto-injects
   *  `app/opengraph-image.tsx` so we leave the field undefined. */
  image?: string
  noIndex?: boolean
  /** Optional locale alternates emitted as <link rel="alternate" hreflang>. */
  hreflang?: Record<string, string>
  /** Override the og:locale (default `en_US`). */
  ogLocale?: string
  /** Optional og:alternateLocale list (default omitted). */
  ogAlternateLocales?: string[]
  /**
   * When provided, the helper auto-fills `ogLocale`, `ogAlternateLocales`
   * and `hreflang` for every supported locale (mirroring the next-intl
   * routing config). Per-locale overrides above still win.
   */
  locale?: Locale
}

function autoHreflangFor(locale: Locale): Record<string, string> {
  const out: Record<string, string> = { 'x-default': siteConfig.url }
  for (const code of routing.locales) {
    const path = code === routing.defaultLocale ? '' : `/${code}`
    out[code === 'zh' ? 'zh-CN' : code] = `${siteConfig.url}${path}`
  }
  // Also expose the active locale so search engines see a self-reference.
  out[locale === 'zh' ? 'zh-CN' : locale] =
    locale === routing.defaultLocale ? siteConfig.url : `${siteConfig.url}/${locale}`
  return out
}

/**
 * Build a Next.js Metadata object based on Forgely's brand defaults.
 * Use on every page; pass page-specific overrides as needed.
 */
export function buildMetadata(options: BuildMetadataOptions = {}): Metadata {
  const {
    title,
    description,
    path = '/',
    image,
    noIndex = false,
    hreflang,
    ogLocale,
    ogAlternateLocales,
    locale,
  } = options

  const resolvedOgLocale = ogLocale ?? (locale ? localeOgMap[locale] : 'en_US')
  const resolvedOgAlternates =
    ogAlternateLocales ??
    (locale ? routing.locales.filter((c) => c !== locale).map((c) => localeOgMap[c]) : undefined)
  const resolvedHreflang = hreflang ?? (locale ? autoHreflangFor(locale) : undefined)

  const fullTitle = title
    ? `${title} — ${siteConfig.name}`
    : `${siteConfig.name} — ${siteConfig.tagline}`
  const desc = description ?? siteConfig.description
  const url = `${siteConfig.url}${path}`

  const overrideImage = image
    ? [{ url: image, width: 1200, height: 630, alt: siteConfig.slogan }]
    : undefined

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
      ...(resolvedHreflang ? { languages: resolvedHreflang } : {}),
    },
    openGraph: {
      type: 'website',
      locale: resolvedOgLocale,
      url,
      title: fullTitle,
      description: desc,
      siteName: siteConfig.name,
      ...(resolvedOgAlternates ? { alternateLocale: resolvedOgAlternates } : {}),
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
