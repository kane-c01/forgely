# @forgely/scraper-playwright

Playwright-backed `BrowserAdapter` for [`@forgely/scraper`](../scraper). Opt-in
because Playwright pulls ~120 MB of browser binaries.

```bash
pnpm add @forgely/scraper-playwright
pnpm exec playwright install chromium  # one-time browser download
```

```ts
import { ShopifyAdapter } from '@forgely/scraper'
import { PlaywrightBrowserAdapter } from '@forgely/scraper-playwright'

const browser = new PlaywrightBrowserAdapter()
try {
  const adapter = new ShopifyAdapter({ browser })
  const data = await adapter.scrape('https://forgely-demo.myshopify.com', {
    siteId: 'site_xyz',
  })
  // data.screenshots.homepage / .productPage / .categoryPage
  // are now real PNGs stored via the configured AssetStorage.
} finally {
  await browser.close()
}
```

## Why a separate package?

`@forgely/scraper` MUST stay light enough to run inside Cloudflare Workers and
short-lived Lambda functions (where bundling Playwright is a non-starter).
`@forgely/scraper-playwright` only ships in our queue worker (Railway / Fly)
where binary size is fine.
