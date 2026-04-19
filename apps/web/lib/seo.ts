import type { Metadata } from 'next'
import { siteConfig } from './site'

interface BuildMetadataOptions {
  title?: string
  description?: string
  path?: string
  /** Override the OG image. When omitted, Next.js auto-injects
   *  `app/opengraph-image.tsx` so we leave the field undefined. */
  image?: string
  noIndex?: boolean
}

/**
 * Build a Next.js Metadata object based on Forgely's brand defaults.
 * Use on every page; pass page-specific overrides as needed.
 */
export function buildMetadata(options: BuildMetadataOptions = {}): Metadata {
  const { title, description, path = '/', image, noIndex = false } = options

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
    },
    openGraph: {
      type: 'website',
      locale: 'en_US',
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
