/**
 * Schema.org JSON-LD 构建器
 *
 * 覆盖 MASTER.md 16.1 必需类型: Organization / Product / FAQPage / BreadcrumbList / Review
 * 额外: WebSite (含 SearchAction) / SiteNavigationElement
 */

import type {
  BreadcrumbTrail,
  FaqPageMeta,
  OrganizationProfile,
  PageMeta,
  ProductPageMeta,
  SchemaObject,
  SiteMeta,
} from './types.js'
import { joinUrl } from './utils/url.js'

const CTX = 'https://schema.org' as const

export function organizationSchema(site: SiteMeta): SchemaObject {
  const org = site.organization
  const base: SchemaObject = {
    '@context': CTX,
    '@type': 'Organization',
    name: org?.legalName ?? site.brandName,
    url: site.baseUrl,
  }
  if (site.brandLogo) base.logo = joinUrl(site.baseUrl, site.brandLogo)
  if (org?.email) base.email = org.email
  if (org?.telephone) base.telephone = org.telephone
  if (org?.address) {
    base.address = {
      '@type': 'PostalAddress',
      streetAddress: org.address.streetAddress,
      addressLocality: org.address.addressLocality,
      addressRegion: org.address.addressRegion,
      postalCode: org.address.postalCode,
      addressCountry: org.address.addressCountry,
    }
  }
  const sameAs = [
    ...(org?.sameAs ?? []),
    site.social?.twitter && `https://twitter.com/${site.social.twitter.replace(/^@/, '')}`,
    site.social?.instagram && `https://instagram.com/${site.social.instagram.replace(/^@/, '')}`,
    site.social?.facebook && `https://facebook.com/${site.social.facebook}`,
    site.social?.youtube && `https://youtube.com/${site.social.youtube}`,
    site.social?.linkedin && `https://www.linkedin.com/company/${site.social.linkedin}`,
  ].filter(Boolean) as string[]
  if (sameAs.length > 0) base.sameAs = sameAs
  if (org?.foundingDate) base.foundingDate = org.foundingDate
  if (org?.founders && org.founders.length > 0) {
    base.founder = org.founders.map((f) => ({ '@type': 'Person', name: f }))
  }
  return base
}

export function websiteSchema(site: SiteMeta): SchemaObject {
  return {
    '@context': CTX,
    '@type': 'WebSite',
    name: site.brandName,
    url: site.baseUrl,
    inLanguage: site.defaultLocale,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${site.baseUrl}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  }
}

export function productSchema(site: SiteMeta, page: ProductPageMeta): SchemaObject {
  const p = page.product
  const obj: SchemaObject = {
    '@context': CTX,
    '@type': 'Product',
    name: p.name,
    description: p.description,
    image: p.images.map((src) => joinUrl(site.baseUrl, src)),
    brand: { '@type': 'Brand', name: p.brand ?? site.brandName },
    sku: p.sku,
    mpn: p.mpn,
    gtin: p.gtin,
    category: p.category,
    offers: buildOffers(site, page),
  }
  if (p.rating) {
    obj.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: p.rating.value,
      reviewCount: p.rating.count,
    }
  }
  if (p.reviews && p.reviews.length > 0) {
    obj.review = p.reviews.map((r) => ({
      '@type': 'Review',
      reviewRating: { '@type': 'Rating', ratingValue: r.rating, bestRating: 5 },
      author: { '@type': 'Person', name: r.author },
      name: r.title,
      reviewBody: r.body,
      datePublished: r.publishedAt,
    }))
  }
  return obj
}

function buildOffers(site: SiteMeta, page: ProductPageMeta): SchemaObject {
  const p = page.product
  return {
    '@context': CTX,
    '@type': 'Offer',
    url: joinUrl(site.baseUrl, page.path),
    priceCurrency: p.price.currency,
    price: p.price.amount.toFixed(2),
    availability: `https://schema.org/${p.availability}`,
    itemCondition: 'https://schema.org/NewCondition',
  }
}

export function faqSchema(page: FaqPageMeta): SchemaObject {
  return {
    '@context': CTX,
    '@type': 'FAQPage',
    mainEntity: page.faqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  }
}

export function breadcrumbSchema(site: SiteMeta, trail: BreadcrumbTrail): SchemaObject {
  return {
    '@context': CTX,
    '@type': 'BreadcrumbList',
    itemListElement: trail.items.map((it, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: it.name,
      item: joinUrl(site.baseUrl, it.url),
    })),
  }
}

/**
 * 主入口：根据 PageMeta 类型自动选择应输出的 schema 集合
 */
export function buildSchemasFor(
  site: SiteMeta,
  page: PageMeta,
  options: {
    breadcrumb?: BreadcrumbTrail
    includeSiteOrg?: boolean
  } = {},
): SchemaObject[] {
  const schemas: SchemaObject[] = [...(page.schema ?? [])]
  if (options.includeSiteOrg ?? page.path === '/') {
    schemas.unshift(organizationSchema(site))
    schemas.unshift(websiteSchema(site))
  }
  if (options.breadcrumb && options.breadcrumb.items.length > 0) {
    schemas.push(breadcrumbSchema(site, options.breadcrumb))
  }
  if (isProductPage(page)) {
    schemas.push(productSchema(site, page))
  }
  if (isFaqPage(page)) {
    schemas.push(faqSchema(page))
  }
  return schemas
}

function isProductPage(p: PageMeta): p is ProductPageMeta {
  return (p as ProductPageMeta).product !== undefined
}

function isFaqPage(p: PageMeta): p is FaqPageMeta {
  const arr = (p as FaqPageMeta).faqs
  return Array.isArray(arr)
}

export function organizationProfileFromSite(site: SiteMeta): OrganizationProfile {
  return {
    legalName: site.brandLegalName ?? site.brandName,
    url: site.baseUrl,
    logo: site.brandLogo ? joinUrl(site.baseUrl, site.brandLogo) : undefined,
    sameAs: site.organization?.sameAs,
  }
}
