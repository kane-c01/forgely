#!/usr/bin/env node
/**
 * Scaffold the three Next.js 14 App Router apps with the minimum surface
 * needed for `pnpm dev` to render a placeholder page on a unique port.
 *
 * Existing files are NEVER overwritten — re-runnable.
 *
 * Usage: `node scripts/scaffold-apps.mjs`
 */
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT = path.resolve(__dirname, '..')

const APPS = [
  {
    name: 'web',
    description: 'Forgely public marketing site (forgely.com).',
    port: 3000,
    title: 'Forgely',
    headline: 'Brand operating system for the AI era.',
    subline: 'Forge cinematic brand sites from a single link.',
  },
  {
    name: 'app',
    description: 'Forgely user dashboard + /super super-admin (app.forgely.com).',
    port: 3001,
    title: 'Forgely · App',
    headline: 'Your forge is ready.',
    subline: 'Sign in to manage sites, products and brand kits.',
  },
  {
    name: 'storefront',
    description: 'Generated tenant storefront template.',
    port: 3002,
    title: 'Forgely Storefront',
    headline: 'A storefront forged by Forgely.',
    subline: 'Tenant-driven content will render here.',
  },
]

const NEXT_VERSION = '14.2.13'
const REACT_VERSION = '18.3.1'
const TAILWIND_VERSION = '3.4.13'

function appPkg({ name, description, port }) {
  return {
    name: `@forgely/${name}`,
    version: '0.0.0',
    private: true,
    description,
    scripts: {
      dev: `next dev --port ${port}`,
      build: 'next build',
      start: `next start --port ${port}`,
      lint: 'next lint --max-warnings 0',
      typecheck: 'tsc --noEmit',
      test: 'echo "no tests yet" && exit 0',
    },
    dependencies: {
      '@forgely/design-tokens': 'workspace:*',
      '@forgely/ui': 'workspace:*',
      next: NEXT_VERSION,
      react: REACT_VERSION,
      'react-dom': REACT_VERSION,
    },
    devDependencies: {
      '@types/node': '^20.16.10',
      '@types/react': '^18.3.11',
      '@types/react-dom': '^18.3.0',
      autoprefixer: '^10.4.20',
      'eslint-config-next': NEXT_VERSION,
      postcss: '^8.4.47',
      tailwindcss: `^${TAILWIND_VERSION}`,
      typescript: '^5.6.2',
    },
  }
}

const APP_TSCONFIG = {
  extends: '../../tsconfig.base.json',
  compilerOptions: {
    plugins: [{ name: 'next' }],
    paths: {
      '@/*': ['./*'],
    },
    noEmit: true,
    jsx: 'preserve',
    incremental: true,
    module: 'esnext',
    moduleResolution: 'bundler',
  },
  include: ['next-env.d.ts', '**/*.ts', '**/*.tsx', '.next/types/**/*.ts'],
  exclude: ['node_modules', '.next'],
}

const NEXT_CONFIG = `/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@forgely/design-tokens', '@forgely/ui'],
  experimental: {
    typedRoutes: true,
  },
}

export default nextConfig
`

const POSTCSS_CONFIG = `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
`

const TAILWIND_CONFIG = `import type { Config } from 'tailwindcss'
import { forgelyPreset } from '@forgely/design-tokens/tailwind'

export default {
  presets: [forgelyPreset],
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
  ],
} satisfies Config
`

const GLOBALS_CSS = `@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    color-scheme: dark;
  }

  html,
  body {
    background-color: var(--forgely-bg-void, #08080a);
    color: var(--forgely-text-primary, #f4f4f7);
  }
}
`

const NEXT_ENV_DTS = `/// <reference types="next" />
/// <reference types="next/image-types/global" />

// NOTE: This file should not be edited
// see https://nextjs.org/docs/basic-features/typescript for more information.
`

const ESLINT_RC = JSON.stringify(
  {
    extends: ['next/core-web-vitals'],
  },
  null,
  2,
)

function rootLayout({ title, description }) {
  return `import type { Metadata, Viewport } from 'next'
import { Fraunces, Inter } from 'next/font/google'
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

export const metadata: Metadata = {
  title: '${title}',
  description: '${description}',
}

export const viewport: Viewport = {
  themeColor: '#08080a',
  colorScheme: 'dark',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={\`\${fraunces.variable} \${inter.variable}\`}>
      <body className="min-h-screen font-body antialiased">{children}</body>
    </html>
  )
}
`
}

function homePage({ headline, subline, name, port }) {
  return `import { Button } from '@forgely/ui'

export default function Page() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 px-6 text-center">
      <span className="rounded-full border border-border-strong bg-bg-elevated px-3 py-1 font-mono text-caption uppercase tracking-[0.2em] text-forge-amber">
        @forgely/${name} · :${port}
      </span>
      <h1 className="max-w-4xl font-display text-display leading-[1.05] tracking-tight">
        ${headline}
      </h1>
      <p className="max-w-2xl text-body-lg text-text-secondary">
        ${subline}
      </p>
      <div className="flex gap-3">
        <Button>Start Forging</Button>
        <Button variant="ghost">Learn more</Button>
      </div>
    </main>
  )
}
`
}

async function ensure(file, contents) {
  try {
    await fs.access(file)
    console.info(`skip   ${path.relative(ROOT, file)}`)
  } catch {
    await fs.mkdir(path.dirname(file), { recursive: true })
    await fs.writeFile(file, contents)
    console.info(`create ${path.relative(ROOT, file)}`)
  }
}

for (const app of APPS) {
  const abs = path.join(ROOT, 'apps', app.name)
  await ensure(path.join(abs, 'package.json'), JSON.stringify(appPkg(app), null, 2) + '\n')
  await ensure(path.join(abs, 'tsconfig.json'), JSON.stringify(APP_TSCONFIG, null, 2) + '\n')
  await ensure(path.join(abs, 'next.config.mjs'), NEXT_CONFIG)
  await ensure(path.join(abs, 'postcss.config.mjs'), POSTCSS_CONFIG)
  await ensure(path.join(abs, 'tailwind.config.ts'), TAILWIND_CONFIG)
  await ensure(path.join(abs, 'app/globals.css'), GLOBALS_CSS)
  await ensure(path.join(abs, 'next-env.d.ts'), NEXT_ENV_DTS)
  await ensure(path.join(abs, '.eslintrc.json'), ESLINT_RC)
  await ensure(
    path.join(abs, 'app/layout.tsx'),
    rootLayout({ title: app.title, description: app.description }),
  )
  await ensure(path.join(abs, 'app/page.tsx'), homePage(app))
}

console.info('\napps scaffold complete.')
