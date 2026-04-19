export interface CliArgs {
  url: string
  format: 'table' | 'json' | 'md'
  output?: string
  maxProducts?: number
  siteId?: string
  mirror: boolean
  skipScreenshots: boolean
  countryCode?: string
  scraperApiKey?: string
  noColor: boolean
  showHelp: boolean
  showVersion: boolean
}

export interface ParsedResult {
  ok: true
  args: CliArgs
}

export interface ParseError {
  ok: false
  error: string
}

const HELP = `forgely-scrape — point-and-shoot e-commerce scraper

USAGE
  forgely-scrape <url> [options]

OPTIONS
  --format <table|json|md>   Output format (default: table)
  --output <file>            Write output to file instead of stdout
  --max-products <n>         Cap products fetched (saves API credits)
  --site-id <id>             Tag mirrored assets under this site folder
  --mirror                   Mirror images into local storage (default: off in CLI)
  --with-screenshots         Capture screenshots via @forgely/scraper-playwright
                              (requires playwright browsers — run "pnpm exec playwright install chromium" once)
  --skip-screenshots         Skip browser screenshots (default)
  --country <cc>             ScraperAPI country override (e.g. cn, us, de)
  --api-key <key>            ScraperAPI key (or set SCRAPERAPI_KEY env)
  --no-color                 Disable ANSI colors
  -h, --help                 Show help
  -v, --version              Show version

EXAMPLES
  # Free Shopify store, instant table
  forgely-scrape https://forgely-demo.myshopify.com

  # WooCommerce with the storefront API, write JSON to disk
  forgely-scrape https://woo.example.com --format json --output woo.json

  # 1688 with ScraperAPI (China region)
  SCRAPERAPI_KEY=xxx forgely-scrape https://detail.1688.com/offer/12345.html --country cn

  # Amazon single product, capped, markdown report for customer email
  forgely-scrape https://www.amazon.com/dp/B0FORGE001 --format md --output report.md
`

export function getHelp(): string {
  return HELP
}

export function parseArgs(argv: string[]): ParsedResult | ParseError {
  const args: CliArgs = {
    url: '',
    format: 'table',
    mirror: false,
    skipScreenshots: true,
    noColor: false,
    showHelp: false,
    showVersion: false,
  }

  for (let i = 0; i < argv.length; i++) {
    const tok = argv[i]
    if (tok === undefined) continue
    if (tok === '-h' || tok === '--help') {
      args.showHelp = true
      continue
    }
    if (tok === '-v' || tok === '--version') {
      args.showVersion = true
      continue
    }
    if (tok === '--no-color') {
      args.noColor = true
      continue
    }
    if (tok === '--mirror') {
      args.mirror = true
      continue
    }
    if (tok === '--skip-screenshots') {
      args.skipScreenshots = true
      continue
    }
    if (tok === '--with-screenshots') {
      args.skipScreenshots = false
      continue
    }
    if (tok === '--format') {
      const value = argv[++i]
      if (value !== 'table' && value !== 'json' && value !== 'md') {
        return {
          ok: false,
          error: `--format must be one of: table | json | md (got: ${value ?? 'nothing'})`,
        }
      }
      args.format = value
      continue
    }
    if (tok === '--output') {
      const value = argv[++i]
      if (!value) return { ok: false, error: '--output requires a file path' }
      args.output = value
      continue
    }
    if (tok === '--max-products') {
      const value = argv[++i]
      const n = Number.parseInt(value ?? '', 10)
      if (!Number.isFinite(n) || n <= 0) {
        return { ok: false, error: '--max-products requires a positive integer' }
      }
      args.maxProducts = n
      continue
    }
    if (tok === '--site-id') {
      const value = argv[++i]
      if (!value) return { ok: false, error: '--site-id requires a value' }
      args.siteId = value
      continue
    }
    if (tok === '--country') {
      const value = argv[++i]
      if (!value) return { ok: false, error: '--country requires a value' }
      args.countryCode = value
      continue
    }
    if (tok === '--api-key') {
      const value = argv[++i]
      if (!value) return { ok: false, error: '--api-key requires a value' }
      args.scraperApiKey = value
      continue
    }
    if (tok.startsWith('-')) {
      return { ok: false, error: `Unknown option: ${tok}` }
    }
    if (!args.url) {
      args.url = tok
      continue
    }
    return { ok: false, error: `Unexpected positional argument: ${tok}` }
  }

  if (!args.showHelp && !args.showVersion && !args.url) {
    return { ok: false, error: 'A URL is required. Use --help for usage.' }
  }

  return { ok: true, args }
}
