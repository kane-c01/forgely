/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    '@forgely/design-tokens',
    '@forgely/ui',
    '@forgely/api',
    '@forgely/ai-agents',
    '@forgely/compliance',
    '@forgely/seo',
    '@forgely/dsl',
  ],
  experimental: {
    typedRoutes: true,
    instrumentationHook: true,
    serverComponentsExternalPackages: [
      'argon2',
      '@prisma/client',
      'prisma',
      'bullmq',
      'ioredis',
      'jose',
      'next-auth',
      'stripe',
    ],
  },
  webpack(config, { isServer }) {
    config.resolve.extensionAlias = {
      ...(config.resolve.extensionAlias ?? {}),
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }
    if (isServer) {
      const externals = [
        'argon2',
        '@prisma/client',
        '.prisma/client',
        'prisma',
        'bullmq',
        'ioredis',
        'jose',
        'next-auth',
        'stripe',
        '@auth/core',
      ]
      config.externals = [
        ...(Array.isArray(config.externals) ? config.externals : [config.externals]).filter(Boolean),
        ({ request }, callback) => {
          if (request && externals.some((e) => request === e || request.startsWith(`${e}/`))) {
            return callback(null, `commonjs ${request}`)
          }
          callback()
        },
      ]
    }
    config.ignoreWarnings = [
      ...(config.ignoreWarnings ?? []),
      { module: /@opentelemetry\/instrumentation/ },
      { module: /require-in-the-middle/ },
      { module: /@prisma\/instrumentation/ },
      { message: /Critical dependency: the request of a dependency is an expression/ },
      { message: /Critical dependency: require function is used in a way/ },
    ]
    return config
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
