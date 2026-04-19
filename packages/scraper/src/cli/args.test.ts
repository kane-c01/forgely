import { describe, expect, it } from 'vitest'

import { parseArgs } from './args.js'

describe('parseArgs', () => {
  it('returns help when no args', () => {
    const r = parseArgs([])
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toMatch(/URL is required/)
  })

  it('parses a URL with default options', () => {
    const r = parseArgs(['https://x.com'])
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.args.url).toBe('https://x.com')
      expect(r.args.format).toBe('table')
      expect(r.args.skipScreenshots).toBe(true)
      expect(r.args.mirror).toBe(false)
    }
  })

  it('parses --format json', () => {
    const r = parseArgs(['https://x.com', '--format', 'json'])
    if (!r.ok) throw new Error(r.error)
    expect(r.args.format).toBe('json')
  })

  it('rejects invalid --format', () => {
    const r = parseArgs(['https://x.com', '--format', 'xml'])
    expect(r.ok).toBe(false)
  })

  it('parses --max-products', () => {
    const r = parseArgs(['https://x.com', '--max-products', '20'])
    if (!r.ok) throw new Error(r.error)
    expect(r.args.maxProducts).toBe(20)
  })

  it('rejects non-positive --max-products', () => {
    const r = parseArgs(['https://x.com', '--max-products', '-3'])
    expect(r.ok).toBe(false)
  })

  it('parses --output and --site-id', () => {
    const r = parseArgs(['https://x.com', '--output', 'out.json', '--site-id', 'site_1'])
    if (!r.ok) throw new Error(r.error)
    expect(r.args.output).toBe('out.json')
    expect(r.args.siteId).toBe('site_1')
  })

  it('parses --no-color and --mirror flags', () => {
    const r = parseArgs(['https://x.com', '--no-color', '--mirror'])
    if (!r.ok) throw new Error(r.error)
    expect(r.args.noColor).toBe(true)
    expect(r.args.mirror).toBe(true)
  })

  it('reads --api-key and --country', () => {
    const r = parseArgs(['https://x.com', '--api-key', 'KEY', '--country', 'cn'])
    if (!r.ok) throw new Error(r.error)
    expect(r.args.scraperApiKey).toBe('KEY')
    expect(r.args.countryCode).toBe('cn')
  })

  it('rejects unknown flags', () => {
    const r = parseArgs(['https://x.com', '--unknown'])
    expect(r.ok).toBe(false)
  })

  it('handles --help and --version', () => {
    const help = parseArgs(['--help'])
    expect(help.ok).toBe(true)
    if (help.ok) expect(help.args.showHelp).toBe(true)
    const version = parseArgs(['-v'])
    expect(version.ok).toBe(true)
    if (version.ok) expect(version.args.showVersion).toBe(true)
  })
})
