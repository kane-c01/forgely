/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@forgely/design-tokens', '@forgely/ui'],
  experimental: {
    typedRoutes: true,
  },
}

export default nextConfig
