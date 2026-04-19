import type { ReactNode } from 'react'
import type { Viewport } from 'next'
import { Inter, Fraunces, JetBrains_Mono } from 'next/font/google'
import { Toaster } from 'sonner'
import { buildMetadata } from '@/lib/seo'
import { jsonLd, organizationSchema, softwareApplicationSchema } from '@/lib/schema'
import { ConsentProvider } from '@/components/consent/consent-provider'
import { CookieConsent } from '@/components/consent/cookie-consent'
import { PlausibleAnalytics } from '@/components/analytics/plausible'
import { WebVitalsReporter } from '@/components/analytics/web-vitals-reporter'
import './globals.css'

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

export const metadata = buildMetadata()

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#08080A' },
    { media: '(prefers-color-scheme: light)', color: '#08080A' },
  ],
  width: 'device-width',
  initialScale: 1,
  colorScheme: 'dark',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${fontBody.variable} ${fontHeading.variable} ${fontDisplay.variable} ${fontMono.variable} dark`}
      suppressHydrationWarning
    >
      <body className="bg-bg-void text-text-primary font-body antialiased">
        <a
          href="#main"
          className="focus:bg-forge-orange focus:text-bg-void sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:px-4 focus:py-2"
        >
          Skip to content
        </a>
        <ConsentProvider>
          {children}
          <CookieConsent />
          <PlausibleAnalytics />
          <WebVitalsReporter />
        </ConsentProvider>
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
          dangerouslySetInnerHTML={{ __html: jsonLd(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd(softwareApplicationSchema) }}
        />
      </body>
    </html>
  )
}
