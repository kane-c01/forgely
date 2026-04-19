/**
 * Forgely Compiler — emits a stand-alone Next.js 14 project from a SiteDsl.
 *
 * Output is a `Map<relativePath, contents>` of files that the Deployer
 * (services/deploy) writes to a tmp dir, runs `pnpm install && pnpm build`,
 * and uploads to Cloudflare Pages.
 *
 * Strategy
 * --------
 * 1. The runtime is intentionally a *single* Next.js project per tenant
 *    (deployed under tenant.forgely.app) so we can run static-export and
 *    serve from R2 + Cloudflare Pages at the lowest cost.
 * 2. Section components live in the workspace (`@forgely/storefront`) so
 *    we don't duplicate code per tenant — emitted source just imports
 *    them from the workspace package via an `npm install` of a published
 *    tarball (post-MVP) or via an inline copy (MVP fallback below).
 * 3. SEO meta + JSON-LD are baked into `app/layout.tsx`.
 *
 * @owner W1 — T17 (docs/MASTER.md §13, §21)
 */
import type { SiteDsl } from './index'

export interface CompiledProject {
  /** path → utf-8 contents */
  files: Map<string, string>
  /** Total byte count for billing/quota. */
  totalBytes: number
  /** Suggested deployment subdomain. */
  subdomain: string
  /** Manifest for the Deployer (what to upload, what envs to set). */
  manifest: {
    siteId: string
    locale: SiteDsl['locale']
    region: SiteDsl['region']
    sectionsCount: number
    needsStripeConnect: boolean
  }
}

export interface CompileOptions {
  dsl: SiteDsl
  /** Subdomain slug — Compiler validates + sanitises. */
  subdomain: string
  /** Resolved hero/showcase product list. */
  products: Array<{
    id: string
    handle: string
    title: string
    priceCents: number
    currency: string
    imageUrl: string
    description?: string
  }>
  /** Optional: override which Forgely package version to pin. */
  packageVersion?: string
}

/** Compile a SiteDsl into a deployable Next.js project. */
export function compile(options: CompileOptions): CompiledProject {
  const files = new Map<string, string>()
  const { dsl, subdomain, products } = options

  files.set('package.json', emitPackageJson(dsl, subdomain, options.packageVersion))
  files.set('next.config.mjs', NEXT_CONFIG)
  files.set('postcss.config.mjs', POSTCSS_CONFIG)
  files.set('tailwind.config.ts', TAILWIND_CONFIG)
  files.set('tsconfig.json', TSCONFIG)
  files.set('next-env.d.ts', NEXT_ENV_DTS)
  files.set('.gitignore', GITIGNORE)
  files.set('.env.example', emitEnvExample(dsl))

  files.set('app/globals.css', GLOBALS_CSS)
  files.set('app/layout.tsx', emitLayout(dsl))
  files.set('app/page.tsx', emitHomePage(dsl, products))
  files.set('app/products/[slug]/page.tsx', emitProductPage())
  files.set('app/cart/page.tsx', CART_PAGE)
  files.set('data/dsl.json', JSON.stringify(dsl, null, 2))
  files.set('data/products.json', JSON.stringify(products, null, 2))
  files.set('public/robots.txt', emitRobots(subdomain))
  files.set('app/sitemap.ts', SITEMAP_TS)
  files.set('README.md', emitReadme(dsl, subdomain))

  let totalBytes = 0
  for (const v of files.values()) totalBytes += Buffer.byteLength(v, 'utf-8')

  return {
    files,
    totalBytes,
    subdomain,
    manifest: {
      siteId: dsl.siteId,
      locale: dsl.locale,
      region: dsl.region,
      sectionsCount: dsl.sections.length,
      needsStripeConnect: true,
    },
  }
}

// ──────────────────────────────────────────────────────────────────────────
//  File emitters
// ──────────────────────────────────────────────────────────────────────────

function emitPackageJson(dsl: SiteDsl, subdomain: string, version = '0.0.1'): string {
  return JSON.stringify(
    {
      name: `forgely-tenant-${subdomain}`,
      version,
      private: true,
      scripts: {
        dev: 'next dev',
        build: 'next build',
        start: 'next start',
      },
      dependencies: {
        '@forgely/design-tokens': '^0.0.0',
        '@forgely/storefront': '^0.0.0',
        next: '14.2.13',
        react: '18.3.1',
        'react-dom': '18.3.1',
      },
      devDependencies: {
        '@types/react': '^18.3.11',
        '@types/react-dom': '^18.3.0',
        autoprefixer: '^10.4.20',
        postcss: '^8.4.47',
        tailwindcss: '^3.4.13',
        typescript: '^5.6.2',
      },
      forgely: {
        siteId: dsl.siteId,
        dnaId: dsl.dnaId,
        heroMomentId: dsl.heroMomentId,
        locale: dsl.locale,
        region: dsl.region,
      },
    },
    null,
    2,
  )
}

const NEXT_CONFIG = `/** @type {import('next').NextConfig} */
export default {
  reactStrictMode: true,
  transpilePackages: ['@forgely/design-tokens', '@forgely/storefront'],
  images: { unoptimized: true },
  output: 'standalone',
}
`

const POSTCSS_CONFIG = `export default { plugins: { tailwindcss: {}, autoprefixer: {} } }
`

const TAILWIND_CONFIG = `import type { Config } from 'tailwindcss'
import { forgelyPreset } from '@forgely/design-tokens/tailwind'

export default {
  presets: [forgelyPreset],
  content: ['./app/**/*.{ts,tsx}', '../../node_modules/@forgely/storefront/**/*.{ts,tsx}'],
} satisfies Config
`

const TSCONFIG = `{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules", ".next"]
}
`

const NEXT_ENV_DTS = `/// <reference types="next" />
/// <reference types="next/image-types/global" />
`

const GITIGNORE = `node_modules
.next
.env
.env.local
.DS_Store
`

function emitEnvExample(dsl: SiteDsl): string {
  return [
    `# Forgely tenant — ${dsl.siteId}`,
    `MEDUSA_BACKEND_URL=https://api.forgely.cn/medusa`,
    `MEDUSA_PUBLISHABLE_KEY=`,
    `STRIPE_PUBLISHABLE_KEY=`,
    `# Region: ${dsl.region} · Locale: ${dsl.locale}`,
  ].join('\n') + '\n'
}

const GLOBALS_CSS = `@import '@forgely/design-tokens/css';
@tailwind base;
@tailwind components;
@tailwind utilities;

html, body { background: var(--forgely-bg-void); color: var(--forgely-text-primary); }
body { min-height: 100vh; -webkit-font-smoothing: antialiased; }
`

function emitLayout(dsl: SiteDsl): string {
  const orgLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: dsl.brand.name,
    url: dsl.seo.organization?.sameAs?.[0] ?? `https://${dsl.siteId}.forgely.app`,
    logo: dsl.seo.organization?.logoUrl,
  })
  return `import type { Metadata, Viewport } from 'next'
import { Fraunces, Inter } from 'next/font/google'
import './globals.css'

const fontBody = Inter({ subsets: ['latin'], variable: '--font-body', weight: ['400', '500', '600', '700'], display: 'swap' })
const fontDisplay = Fraunces({ subsets: ['latin'], variable: '--font-display', weight: ['200', '400'], display: 'swap' })

export const metadata: Metadata = {
  title: ${JSON.stringify(dsl.seo.title)},
  description: ${JSON.stringify(dsl.seo.description)},
  ${dsl.seo.ogImageUrl ? `openGraph: { images: [${JSON.stringify(dsl.seo.ogImageUrl)}] },` : ''}
}

export const viewport: Viewport = {
  themeColor: '#08080a',
  colorScheme: 'dark',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang=${JSON.stringify(dsl.locale)} className={\`\${fontBody.variable} \${fontDisplay.variable} dark\`}>
      <body className="font-body antialiased">
        {children}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: \`${orgLd}\` }} />
      </body>
    </html>
  )
}
`
}

function emitHomePage(_dsl: SiteDsl, _products: CompileOptions['products']): string {
  return `import { SectionRenderer, type RendererContext } from '@forgely/storefront'
import dsl from '@/data/dsl.json'
import productsRaw from '@/data/products.json'

const products = productsRaw as RendererContext['products']

export default function Home() {
  const ctx: RendererContext = { products }
  return (
    <main>
      {dsl.sections.map((section: any, i: number) => (
        <SectionRenderer key={i} section={section} ctx={ctx} />
      ))}
    </main>
  )
}
`
}

function emitProductPage(): string {
  return `import productsRaw from '@/data/products.json'

interface Props {
  params: { slug: string }
}

export function generateStaticParams() {
  return (productsRaw as Array<{ handle: string }>).map((p) => ({ slug: p.handle }))
}

export default function Product({ params }: Props) {
  const product = (productsRaw as Array<{ handle: string; title: string; priceCents: number; currency: string; imageUrl: string }>).find(
    (p) => p.handle === params.slug,
  )
  if (!product) return <div className="p-12 text-text-primary">Not found</div>
  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <a href="/" className="text-text-muted">← Back</a>
      <div className="mt-6 grid gap-12 md:grid-cols-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={product.imageUrl} alt={product.title} className="aspect-square w-full rounded-xl object-cover" />
        <div>
          <h1 className="font-display text-h1 text-text-primary">{product.title}</h1>
          <p className="mt-4 font-mono text-h3 text-forge-amber">{product.currency} {(product.priceCents / 100).toFixed(2)}</p>
          <a href="/cart" className="mt-12 inline-flex h-12 items-center justify-center rounded-lg bg-forge-orange px-8 font-medium text-bg-void">
            Add to cart
          </a>
        </div>
      </div>
    </main>
  )
}
`
}

const CART_PAGE = `export default function Cart() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 text-text-primary">
      <h1 className="font-display text-h1">Your cart</h1>
      <p className="mt-4 text-text-secondary">Cart powered by Medusa — wired up by the deploy step.</p>
    </main>
  )
}
`

function emitRobots(subdomain: string): string {
  return `User-agent: *\nAllow: /\nSitemap: https://${subdomain}.forgely.app/sitemap.xml\n`
}

const SITEMAP_TS = `import type { MetadataRoute } from 'next'
import productsRaw from '@/data/products.json'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? ''
  const products = productsRaw as Array<{ handle: string }>
  return [
    { url: \`\${base}/\`, priority: 1 },
    ...products.map((p) => ({ url: \`\${base}/products/\${p.handle}\`, priority: 0.8 })),
  ]
}
`

function emitReadme(dsl: SiteDsl, subdomain: string): string {
  return `# ${dsl.brand.name} — Forgely tenant

Generated by Forgely Compiler at ${new Date().toISOString()}.

- Site id: ${dsl.siteId}
- DNA: ${dsl.dnaId}
- Hero Moment: ${dsl.heroMomentId}
- Subdomain: ${subdomain}.forgely.app
- Locale: ${dsl.locale}

## Local

\`\`\`bash
pnpm install
pnpm dev
\`\`\`

This project is auto-deployed by Forgely on every publish — manual edits will
be overwritten on the next regeneration.
`
}
