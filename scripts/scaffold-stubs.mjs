#!/usr/bin/env node
/**
 * One-shot scaffold for empty packages/services in the Forgely monorepo.
 *
 * Generates a minimal `package.json`, `src/index.ts` and `tsconfig.json`
 * for every entry below. Existing files are NEVER overwritten so this is
 * safe to re-run.
 *
 * Usage: `node scripts/scaffold-stubs.mjs`
 */
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT = path.resolve(__dirname, '..')

const PACKAGES = [
  { dir: 'packages/icons', desc: 'Forgely icon set wrappers (lucide + custom)' },
  { dir: 'packages/charts', desc: 'Tremor + recharts wrappers' },
  { dir: 'packages/3d', desc: 'Shared React Three Fiber components' },
  { dir: 'packages/animations', desc: 'Framer Motion + GSAP presets' },
  { dir: 'packages/api-client', desc: 'tRPC typed client for the three apps' },
  { dir: 'packages/scraper', desc: 'Multi-source scraper adapters' },
  { dir: 'packages/ai-agents', desc: 'AI Agent orchestration (Scraper, Analyzer, Director, Planner, Copywriter, Artist, Compliance)' },
  { dir: 'packages/visual-dna', desc: '10 preset Visual DNAs' },
  { dir: 'packages/product-moments', desc: '10 Product Moment prompt templates' },
  { dir: 'packages/compliance', desc: 'Compliance rule library (FTC / FDA / GDPR / DSA / CPSIA / Prop65)' },
  { dir: 'packages/seo', desc: 'SEO + GEO toolkit (sitemap, schema.org, llms.txt)' },
  { dir: 'packages/dsl', desc: 'SiteDSL schema + compiler' },
]

const SERVICES = [
  { dir: 'services/medusa', desc: 'Medusa v2 commerce backend' },
  { dir: 'services/worker', desc: 'BullMQ queue workers' },
  { dir: 'services/deploy', desc: 'Cloudflare Pages deployer' },
]

function pkgJson(name, description) {
  return {
    name: `@forgely/${name}`,
    version: '0.0.0',
    private: true,
    description,
    type: 'module',
    main: './src/index.ts',
    types: './src/index.ts',
    exports: {
      '.': {
        types: './src/index.ts',
        import: './src/index.ts',
        default: './src/index.ts',
      },
    },
    scripts: {
      lint: 'eslint src --ext .ts,.tsx',
      typecheck: 'tsc --noEmit',
      test: 'echo "no tests yet" && exit 0',
    },
    devDependencies: {
      typescript: '^5.6.2',
    },
  }
}

const TSCONFIG = {
  extends: '../../tsconfig.base.json',
  compilerOptions: {
    outDir: 'dist',
    rootDir: 'src',
    composite: false,
    noEmit: true,
  },
  include: ['src/**/*'],
  exclude: ['node_modules', 'dist'],
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

async function scaffold(entries) {
  for (const { dir, desc } of entries) {
    const name = dir.split('/').pop()
    const abs = path.join(ROOT, dir)
    await ensure(
      path.join(abs, 'package.json'),
      JSON.stringify(pkgJson(name, desc), null, 2) + '\n',
    )
    await ensure(
      path.join(abs, 'tsconfig.json'),
      JSON.stringify(TSCONFIG, null, 2) + '\n',
    )
    await ensure(
      path.join(abs, 'src/index.ts'),
      `export const __packageName = '@forgely/${name}'\n`,
    )
    await ensure(
      path.join(abs, 'README.md'),
      `# @forgely/${name}\n\n${desc}\n\n> Status: stub. Implementation will land in a later Task — see the root \`PROGRESS.md\`.\n`,
    )
  }
}

await scaffold(PACKAGES)
await scaffold(SERVICES)
console.info('\nscaffold complete.')
