import type { ReactNode } from 'react'
import type { Viewport } from 'next'
import { notFound } from 'next/navigation'
import { Inter, Fraunces, JetBrains_Mono } from 'next/font/google'
import { NextIntlClientProvider, hasLocale } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Toaster } from 'sonner'
import { PosthogProvider } from '@/components/analytics/posthog-provider'
import { buildMetadata } from '@/lib/seo'
import { jsonLd, organizationSchema, softwareApplicationSchema } from '@/lib/schema'
import { localeHtmlLang, routing, type Locale } from '@/i18n/routing'
import '../globals.css'

const fontBody = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-body',
  weight: ['400', '500', '600', '700'],
})

const fontHeading = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-heading',
  weight: ['500', '600', '700', '800'],
})

const fontDisplay = Fraunces({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-display',
  weight: ['300', '400', '500'],
  style: ['normal', 'italic'],
})

const fontMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono',
  weight: ['400', '500', '600'],
})

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) return {}
  return buildMetadata({ locale: locale as Locale })
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#08080A' },
    { media: '(prefers-color-scheme: light)', color: '#08080A' },
  ],
  width: 'device-width',
  initialScale: 1,
  colorScheme: 'dark',
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) {
    notFound()
  }

  setRequestLocale(locale)

  const [t, orgSchema, softwareSchema] = await Promise.all([
    getTranslations({ locale, namespace: 'common' }),
    organizationSchema(locale as Locale),
    softwareApplicationSchema(locale as Locale),
  ])

  return (
    <html
      lang={localeHtmlLang[locale as Locale]}
      className={`${fontBody.variable} ${fontHeading.variable} ${fontDisplay.variable} ${fontMono.variable} dark`}
      suppressHydrationWarning
    >
      <body className="bg-bg-void text-text-primary font-body antialiased">
        <a
          href="#main"
          className="focus:bg-forge-orange focus:text-bg-void sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:px-4 focus:py-2"
        >
          {t('skipToContent')}
        </a>
        <NextIntlClientProvider>
          <PosthogProvider>{children}</PosthogProvider>
        </NextIntlClientProvider>
        <Toaster
          position="bottom-right"
          theme="dark"
          toastOptions={{
            classNames: {
              toast: 'bg-bg-elevated border border-border-strong text-text-primary',
            },
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd(orgSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd(softwareSchema) }}
        />
      </body>
    </html>
  )
}
