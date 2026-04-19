#!/usr/bin/env node
// Bootstrap shim for the forgely-scrape CLI. Uses tsx to run TypeScript
// sources directly so consumers don't need a build step.
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const cliEntry = resolve(__dirname, '..', 'src', 'cli.ts')

const result = spawnSync(
  process.execPath,
  [
    '--import',
    'tsx',
    cliEntry,
    ...process.argv.slice(2),
  ],
  { stdio: 'inherit' },
)

process.exit(result.status ?? 1)
