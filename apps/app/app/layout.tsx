import type { Metadata, Viewport } from 'next'
import { Fraunces, Inter, JetBrains_Mono } from 'next/font/google'

import { PosthogProvider } from '@/components/analytics/posthog-provider'
import './globals.css'

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['200', '400'],
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
})

const interHeading = Inter({
  subsets: ['latin'],
  variable: '--font-heading',
  weight: ['500', '600', '700', '800'],
  display: 'swap',
})

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '500'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Forgely · App',
  description: 'Forgely user dashboard + /super super-admin (app.forgely.com).',
}

export const viewport: Viewport = {
  themeColor: '#08080a',
  colorScheme: 'dark',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${inter.variable} ${interHeading.variable} ${jetbrains.variable}`}
    >
      <body className="bg-bg-void font-body text-text-primary min-h-screen antialiased">
        <PosthogProvider>{children}</PosthogProvider>
      </body>
    </html>
  )
}
