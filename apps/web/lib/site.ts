export const siteConfig = {
  name: 'Forgely',
  brand: 'Forgely',
  domain: 'forgely.com',
  url: process.env.NEXT_PUBLIC_APP_URL ?? 'https://forgely.com',
  appUrl: process.env.NEXT_PUBLIC_APP_DASH_URL ?? 'https://app.forgely.com',
  slogan: 'Brand operating system for the AI era.',
  tagline: 'Forge cinematic brand sites from a single link.',
  description:
    'Forgely turns any product link into a cinematic, fully-stocked brand site — designed by AI, hosted on us, ready to sell in 5 minutes.',
  keywords: [
    'AI website builder',
    'brand site generator',
    'AI ecommerce',
    'Shopify alternative',
    'AI brand operating system',
    'product video generator',
    'cinematic ecommerce',
  ],
  twitter: '@forgely',
  github: 'https://github.com/kane-c01/forgely',
  contact: 'hello@forgely.com',
  founded: 2026,
} as const

export type SiteConfig = typeof siteConfig

/** OG image is generated dynamically by `app/opengraph-image.tsx`.
 *  Keep this constant for places that want a static asset URL fallback. */
export const ogImagePath = '/opengraph-image'

