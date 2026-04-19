# @forgely/scraper

Multi-source scraper adapters for the Forgely AI generation pipeline.

| Adapter            | Tier | Strategy                                                                      |
| ------------------ | ---- | ----------------------------------------------------------------------------- |
| `ShopifyAdapter`   | 1    | Public `/products.json` + `/collections.json` + `/meta.json` (no auth)        |
| `WooCommerceAdapter` | 1/2 | Storefront REST → authenticated `wc/v3` REST (consumer key) → `/shop` HTML    |
| `AmazonAdapter`    | 2    | Single product page via ScraperAPI (render JS), fallback to direct fetch      |
| `AliExpressAdapter`| 2    | Item page via ScraperAPI, prefers embedded `runParams` JSON                   |
| `EtsyAdapter`      | 2    | Listing or shop page via ScraperAPI (HTML)                                    |
| `GenericAIAdapter` | 3    | Browser render + Claude Vision selector inference + per-host rule learning    |

All adapters return the same `ScrapedData` shape (see `src/types.ts`); upstream Analyzer / Planner agents are source-agnostic.

## Quick start

```ts
import {
  buildDefaultScraperRegistry,
  InMemoryAssetStorage,
  LocalAssetStorage,
  type VisionClient,
  type BrowserAdapter,
} from '@forgely/scraper'

const storage = new LocalAssetStorage('./.cache/scrapes', 'http://localhost:3000/scrapes')
const browser: BrowserAdapter = /* PlaywrightBrowserAdapter from worker package */ undefined!
const vision: VisionClient = /* Claude vision client */ undefined!

const registry = buildDefaultScraperRegistry({
  storage,
  browser,
  vision,
  scraperApi: { apiKey: process.env.SCRAPERAPI_KEY },
})

const data = await registry.scrape('https://forgely-demo.myshopify.com', {
  siteId: 'site_xyz',
  maxProducts: 50,
})

console.info(`Scraped ${data.products.length} products with confidence ${data.confidence}`)
```

## Design principles

1. **One contract — `ScrapedData`** — every adapter normalises into the same product/variant/collection shape.
2. **Money is integer cents** — `MoneyAmount.amountCents` (never floats); raw string preserved for audits.
3. **Errors are typed** — every failure throws a `ScraperError` subclass with a stable `code` and `retryable` hint.
4. **Dependency-injected I/O** — `fetchImpl`, `BrowserAdapter`, `AssetStorage`, `VisionClient` are all swappable; tests inject mocks.
5. **Best-effort, never silent** — image mirroring and screenshots fail soft; product extraction failures throw.
6. **Tiered confidence** — adapters self-report `confidence ∈ [0, 1]` so downstream agents can decide whether to ask the user for more context.

## Image mirroring

Pass an `AssetStorage` (`InMemoryAssetStorage` for tests, `LocalAssetStorage` for dev, R2 implementation lives in the worker service) and adapters will copy product images into Forgely-controlled storage and write `image.storedUrl`.

```ts
const storage = new InMemoryAssetStorage()
const adapter = new ShopifyAdapter({ storage })
const data = await adapter.scrape('https://acme.myshopify.com', {
  siteId: 'site_xyz',
})
// data.products[0].images[0].storedUrl === 'mem://forgely-scraper/scrapes/site_xyz/shopify/...'
```

## Browser + screenshots

Screenshots and JS-rendered scraping go through `BrowserAdapter`. The default `NoopBrowserAdapter` throws when called — production wires up a Playwright-backed adapter in `services/worker`.

Pass `skipScreenshots: true` in `ScrapeOptions` (or supply only the no-op browser) to bypass entirely.

## Generic AI fallback

The `GenericAIAdapter` is the safety net for unknown platforms. It:

1. Reuses cached selectors from the `RuleStore` when `successRate ≥ 0.7`.
2. Otherwise asks the `VisionClient` to identify the product list / card / title / price selectors from a screenshot + HTML sample.
3. Applies the selectors with cheerio to extract products.
4. Persists a learned rule when ≥ 3 products are extracted.

Provide your own `RuleStore` implementation (e.g. Postgres-backed) in production; `InMemoryRuleStore` is the default for tests and local dev.

## Testing

```bash
pnpm --filter @forgely/scraper test
pnpm --filter @forgely/scraper test:coverage
```

Adapters are tested with injected `fetchImpl` mocks; MSW is wired up for adapter-level scenarios that need full HTTP behaviour.

## Tasks covered

- **T08** — Shopify Adapter (`src/adapters/shopify.ts`)
- **T09** — WooCommerce Adapter, 3-strategy degradation (`src/adapters/woocommerce.ts`)
- **T28** — Multi-source extension: Amazon / AliExpress / Etsy / GenericAI fallback (`src/adapters/{amazon,aliexpress,etsy,generic-ai}.ts`)

See `docs/MASTER.md` chapter 7 for product-level requirements.
