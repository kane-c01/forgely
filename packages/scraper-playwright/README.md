# @forgely/scraper-playwright

Playwright-backed `BrowserAdapter` for [`@forgely/scraper`](../scraper). Opt-in
because Playwright pulls ~120 MB of browser binaries; the core scraper
stays Worker / Lambda-friendly without it.

```bash
pnpm add @forgely/scraper-playwright
pnpm exec playwright install chromium  # one-time browser download
```

```ts
import { Alibaba1688Adapter } from '@forgely/scraper'
import { PlaywrightBrowserAdapter } from '@forgely/scraper-playwright'

const browser = new PlaywrightBrowserAdapter({
  launchOptions: {
    proxy: process.env.PROXY_POOL_CN_URL ? { server: process.env.PROXY_POOL_CN_URL } : undefined,
  },
})
try {
  const adapter = new Alibaba1688Adapter({ browser })
  const data = await adapter.scrape('https://detail.1688.com/offer/12345.html')
  console.info(`Scraped ${data.products.length} products from 1688`)
} finally {
  await browser.close()
}
```

## Why a separate package?

`@forgely/scraper` MUST stay light enough to run inside Cloudflare Workers and
short-lived Lambda functions (where bundling Playwright is a non-starter).
`@forgely/scraper-playwright` only ships in our queue worker (Railway / Fly)
where binary size is fine. The core package depends on the structural
`BrowserAdapter` contract, not Playwright itself, so this seam is
zero-cost for non-browser consumers.
