/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@forgely/design-tokens', '@forgely/ui'],
  experimental: {
    typedRoutes: true,
    instrumentationHook: true,
  },
}

let exportedConfig = nextConfig

if (process.env.SENTRY_DSN) {
  const { withSentryConfig } = await import('@sentry/nextjs')
  exportedConfig = withSentryConfig(nextConfig, {
    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT,
    authToken: process.env.SENTRY_AUTH_TOKEN,
    silent: !process.env.CI,
    widenClientFileUpload: true,
    hideSourceMaps: true,
    disableLogger: true,
    automaticVercelMonitors: false,
  })
}

export default exportedConfig
