import { getTranslations } from 'next-intl/server'
import { siteConfig } from './site'
import type { Locale } from '@/i18n/routing'

/**
 * Schema.org JSON-LD payloads for the marketing site.
 * Embed via <script type="application/ld+json"> in the relevant page/layout.
 */
export async function organizationSchema(locale: Locale) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteConfig.name,
    url: siteConfig.url,
    logo: `${siteConfig.url}/logo.svg`,
    sameAs: [
      siteConfig.github,
      `https://twitter.com/${siteConfig.twitter.replace('@', '')}`,
    ],
    contactPoint: [
      {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        email: siteConfig.contact,
        availableLanguage: locale === 'zh' ? ['Chinese', 'English'] : ['English'],
      },
    ],
  } as const
}

export async function softwareApplicationSchema(locale: Locale) {
  const t = await getTranslations({ locale, namespace: 'metadata.site' })
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: siteConfig.name,
    description: t('description'),
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    url: siteConfig.url,
    offers: [
      {
        '@type': 'Offer',
        name: 'Free',
        price: '0',
        priceCurrency: 'USD',
      },
      {
        '@type': 'Offer',
        name: 'Starter',
        price: '29',
        priceCurrency: 'USD',
        priceSpecification: {
          '@type': 'UnitPriceSpecification',
          billingDuration: 'P1M',
        },
      },
      {
        '@type': 'Offer',
        name: 'Pro',
        price: '99',
        priceCurrency: 'USD',
        priceSpecification: {
          '@type': 'UnitPriceSpecification',
          billingDuration: 'P1M',
        },
      },
      {
        '@type': 'Offer',
        name: 'Agency',
        price: '299',
        priceCurrency: 'USD',
        priceSpecification: {
          '@type': 'UnitPriceSpecification',
          billingDuration: 'P1M',
        },
      },
    ],
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.9',
      ratingCount: '218',
    },
  } as const
}

export const faqSchema = (
  items: Array<{ question: string; answer: string }>,
) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: items.map((item) => ({
    '@type': 'Question',
    name: item.question,
    acceptedAnswer: { '@type': 'Answer', text: item.answer },
  })),
})

export function jsonLd(data: object): string {
  return JSON.stringify(data).replace(/</g, '\\u003c')
}
