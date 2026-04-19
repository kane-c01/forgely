/**
 * CLI: write `openapi.json` for the current `appRouter`.
 *
 * Run via `pnpm --filter @forgely/api openapi:generate`.
 */
import { writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import { appRouter } from '../src/router/index.js'
import { buildOpenApi } from '../src/openapi/generate.js'

const main = async () => {
  const doc = buildOpenApi(appRouter)
  const outPath = resolve(process.cwd(), 'openapi.json')
  await writeFile(outPath, JSON.stringify(doc, null, 2) + '\n', 'utf8')
  console.info(`[openapi] wrote ${Object.keys(doc.paths).length} paths to ${outPath}`)
}

main().catch((err) => {
  console.error('[openapi] failed', err)
  process.exit(1)
})
