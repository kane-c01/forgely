import type { MetadataRoute } from 'next'
import { siteConfig } from '@/lib/site'

/**
 * apps/web sitemap.
 *
 * Default locale (`zh`) is served at `/`; the secondary locale (`en`)
 * is served at `/en`. We surface both as `alternates.languages` so
 * search engines treat them as locale variants of the same canonical
 * resource. Locale-agnostic surfaces (legal / static pages) appear
 * once, without alternates.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  const localeAlternates = {
    en: `${siteConfig.url}/en`,
    'zh-CN': siteConfig.url,
    'x-default': siteConfig.url,
  }

  const localised: MetadataRoute.Sitemap = [
    {
      url: siteConfig.url,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1,
      alternates: { languages: localeAlternates },
    },
    {
      url: `${siteConfig.url}/en`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.95,
      alternates: { languages: localeAlternates },
    },
  ]

  const anchors: MetadataRoute.Sitemap = (
    [
      ['/#pricing', 0.8],
      ['/#how-it-works', 0.7],
      ['/#showcase', 0.6],
      ['/#faq', 0.6],
    ] as const
  ).map(([path, priority]) => ({
    url: `${siteConfig.url}${path}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority,
  }))

  const staticPages: MetadataRoute.Sitemap = (
    [
      ['/about', 0.5],
      ['/manifesto', 0.5],
      ['/changelog', 0.6],
      ['/careers', 0.5],
      ['/legal/terms', 0.4],
      ['/legal/privacy', 0.5],
      ['/legal/refunds', 0.4],
      ['/legal/dsa', 0.4],
    ] as const
  ).map(([path, priority]) => ({
    url: `${siteConfig.url}${path}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority,
  }))

  return [...localised, ...anchors, ...staticPages]
}
