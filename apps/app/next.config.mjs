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
    // Native bindings & heavy server-only deps must NOT be webpack-bundled
    // — let Node `require()` resolve them at runtime from node_modules.
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
    // services/api ships pure ESM with `.js` import suffixes (correct for
    // Node runtime). Next.js's webpack resolver doesn't apply
    // `extensionAlias`, so `from '../routers/index.js'` can't reach the
    // `.ts` source. Teach the resolver to fall back to `.ts` / `.tsx`.
    config.resolve.extensionAlias = {
      ...(config.resolve.extensionAlias ?? {}),
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }
    // Native + heavy server-only packages: keep them as runtime requires
    // so webpack doesn't try to bundle their `.node` binaries / large
    // platform-specific assets.
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
    return config
  },
}

export default nextConfig
