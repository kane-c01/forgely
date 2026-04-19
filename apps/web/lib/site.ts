/** B 端控制台根 URL（无尾斜杠）。未配置时：开发环境默认本机 3001，生产默认线上。 */
function resolveAppBaseUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_DASH_URL?.trim()
  if (fromEnv) {
    return fromEnv.replace(/\/$/, '')
  }
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3001'
  }
  return 'https://app.forgely.com'
}

const appBaseUrl = resolveAppBaseUrl()

/** 控制台域名展示用（如「在 app.forgely.com 登录」） */
const appHost = (() => {
  try {
    return new URL(appBaseUrl).host
  } catch {
    return appBaseUrl.replace(/^https?:\/\//, '')
  }
})()

export const siteConfig = {
  name: 'Forgely',
  brand: 'Forgely',
  domain: 'forgely.com',
  url: process.env.NEXT_PUBLIC_APP_URL ?? 'https://forgely.com',
  /** 控制台根路径（仪表盘入口等） */
  appUrl: appBaseUrl,
  /** 控制台主机名（文案展示） */
  appHost,
  /** 官网「登录 / Sign in」应指向此路径（apps/app 的 `/login`） */
  appLoginUrl: `${appBaseUrl}/login`,
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
