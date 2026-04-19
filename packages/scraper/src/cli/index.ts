import { writeFile } from 'node:fs/promises'

import { ScraperError } from '../errors.js'
import { buildDefaultScraperRegistry } from '../index.js'
import { InMemoryAssetStorage } from '../storage/memory.js'
import type { ScrapeOptions, ScrapedData } from '../types.js'

import { getHelp, parseArgs, type CliArgs } from './args.js'
import { formatJson, formatMarkdown, formatTable, paint } from './format.js'

export interface CliRunResult {
  exitCode: number
}

const VERSION = '0.0.0'

/**
 * Pure CLI entrypoint. Tests invoke this directly with mocked I/O.
 */
export async function runCli(
  argv: string[],
  io: {
    stdout: (text: string) => void
    stderr: (text: string) => void
    env?: Record<string, string | undefined>
    /** Inject a registry for testing (defaults to buildDefaultScraperRegistry). */
    scrape?: (url: string, options: ScrapeOptions) => Promise<ScrapedData>
    write?: (path: string, data: string) => Promise<void>
  },
): Promise<CliRunResult> {
  const parsed = parseArgs(argv)
  if (!parsed.ok) {
    io.stderr(`error: ${parsed.error}\n\nRun with --help for usage.\n`)
    return { exitCode: 2 }
  }
  const args = parsed.args

  if (args.showHelp) {
    io.stdout(getHelp())
    return { exitCode: 0 }
  }
  if (args.showVersion) {
    io.stdout(`forgely-scrape ${VERSION}\n`)
    return { exitCode: 0 }
  }

  const env = io.env ?? {}
  const scraperApiKey = args.scraperApiKey ?? env['SCRAPERAPI_KEY']

  let scrape = io.scrape
  if (!scrape) {
    const storage = args.mirror ? new InMemoryAssetStorage() : undefined
    const registry = buildDefaultScraperRegistry({
      ...(scraperApiKey
        ? {
            scraperApi: {
              apiKey: scraperApiKey,
              ...(args.countryCode ? { countryCode: args.countryCode } : {}),
            },
          }
        : args.countryCode
          ? { scraperApi: { countryCode: args.countryCode } }
          : {}),
      ...(storage ? { storage } : {}),
    })
    scrape = registry.scrape.bind(registry)
  }

  const scrapeOptions: ScrapeOptions = {
    skipScreenshots: args.skipScreenshots,
    mirrorImages: args.mirror,
  }
  if (args.maxProducts !== undefined) scrapeOptions.maxProducts = args.maxProducts
  if (args.siteId !== undefined) scrapeOptions.siteId = args.siteId

  const startedAt = Date.now()
  let data: ScrapedData
  try {
    data = await scrape(args.url, scrapeOptions)
  } catch (err) {
    return reportError(err, io, args)
  }
  const durationMs = Date.now() - startedAt

  const output = renderOutput(data, args)
  if (args.output) {
    const writer = io.write ?? writeFile
    await writer(args.output, output)
    const sizeKb = Math.round(Buffer.byteLength(output, 'utf-8') / 1024)
    io.stdout(
      `${paint('✓', 'green', { useColor: !args.noColor })} ${args.format.toUpperCase()} written to ${paint(args.output, 'cyan', { useColor: !args.noColor })} (${sizeKb} KB) in ${durationMs}ms\n`,
    )
  } else {
    io.stdout(`${output}\n`)
    io.stdout(`\n${paint(`done in ${durationMs}ms`, 'dim', { useColor: !args.noColor })}\n`)
  }

  return { exitCode: 0 }
}

function renderOutput(data: ScrapedData, args: CliArgs): string {
  switch (args.format) {
    case 'json':
      return formatJson(data)
    case 'md':
      return formatMarkdown(data)
    case 'table':
    default:
      return formatTable(data, { useColor: !args.noColor })
  }
}

function reportError(
  err: unknown,
  io: { stderr: (text: string) => void },
  args: CliArgs,
): CliRunResult {
  const useColor = !args.noColor
  if (err instanceof ScraperError) {
    io.stderr(
      `${paint('✗', 'red', { useColor })} ${err.code} — ${err.message}${
        err.retryable ? paint(' (retryable)', 'dim', { useColor }) : ''
      }\n`,
    )
    return { exitCode: err.code === 'UNAUTHORIZED' ? 3 : 1 }
  }
  const msg = err instanceof Error ? err.message : String(err)
  io.stderr(`${paint('✗', 'red', { useColor })} ${msg}\n`)
  return { exitCode: 1 }
}
