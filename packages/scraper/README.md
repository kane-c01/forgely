# @forgely/scraper

Multi-source scraper adapters for the Forgely AI generation pipeline, plus a
zero-config CLI (`forgely-scrape`) for product demos and on-call investigations.

> **Audience:** Forgely product team & customers/partners doing technical due-diligence.
> **Promise:** point at any e-commerce URL → standardised JSON in < 10 seconds.

---

## 5-minute quickstart

```bash
# 1. From the monorepo root
pnpm install

# 2. Free Shopify store, no API key required
pnpm --filter @forgely/scraper scrape https://forgely-demo.myshopify.com

# 3. Same store, write JSON for your engineers
pnpm --filter @forgely/scraper scrape https://forgely-demo.myshopify.com \
  --format json --output forgely-demo.json
```

Or install once and run anywhere:

```bash
pnpm --filter @forgely/scraper add -g .   # makes forgely-scrape available globally
forgely-scrape https://acme.myshopify.com
```

The CLI prints a market-friendly table designed for screen-shares:

```
✓ Source: shopify (forgely-demo.myshopify.com)
✓ 12 products  ·  USD  ·  confidence 97%
✓ 3 collections  ·  Forging Essentials, Apparel, Accessories
✓ screenshots: homepage, product, category

  #1   Forge Hammer                    $49.95 (was $69.95) -29%   2 imgs
  #2   Anvil – Small                   $199.00            ✗ out of stock
  #3   Bellows                         $129.00            1 img
  ...
done in 1832ms
```

## Real-world cookbook

| Scenario                               | One-liner                                                                                               |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| **Persona C / DTC — Shopify store**    | `forgely-scrape https://allbirds.com`                                                                   |
| **Persona C / DTC — WooCommerce**      | `forgely-scrape https://woo.example.com --format json --output woo.json`                                |
| **Persona A / Factory — 1688 offer**   | `SCRAPERAPI_KEY=xxx forgely-scrape https://detail.1688.com/offer/12345.html --country cn`               |
| **Persona A — Tmall flagship store**   | `SCRAPERAPI_KEY=xxx forgely-scrape "https://detail.tmall.com/item.htm?id=999"`                          |
| **Single Amazon listing**              | `SCRAPERAPI_KEY=xxx forgely-scrape https://www.amazon.com/dp/B0FORGE001 --format md --output report.md` |
| **Customer report**                    | `forgely-scrape <url> --format md --output report.md` (paste into Slack / email)                        |
| **Mirror images for offline analysis** | `forgely-scrape <url> --mirror --site-id site_42`                                                       |

The CLI auto-reads `SCRAPERAPI_KEY` from env (see `.env.example`) so you only
type it once. Add `--country <cc>` for region-locked sites.

## Adapter coverage

| Adapter              | Tier | Strategy                                                                   |
| -------------------- | ---- | -------------------------------------------------------------------------- |
| `ShopifyAdapter`     | 1    | Public `/products.json` + `/collections.json` + `/meta.json` (no auth)     |
| `WooCommerceAdapter` | 1/2  | Storefront REST → authenticated `wc/v3` REST (consumer key) → `/shop` HTML |
| `AmazonAdapter`      | 2    | Single product page via ScraperAPI (render JS), fallback to direct fetch   |
| `AliExpressAdapter`  | 2    | Item page via ScraperAPI, prefers embedded `runParams` JSON                |
| `EtsyAdapter`        | 2    | Listing or shop page via ScraperAPI (HTML)                                 |
| `Alibaba1688Adapter` | 2    | 1688.com offer page via ScraperAPI (`country_code: cn`); CNY pricing       |
| `TaobaoAdapter`      | 2    | Taobao + Tmall `item.htm?id=` shared adapter via ScraperAPI                |
| `JdAdapter`          | 2    | JD.com `item.jd.com/<id>.html` via ScraperAPI; uses `og:price:amount` meta |
| `GenericAIAdapter`   | 3    | Browser render + Claude Vision selector inference + per-host rule learning |

## Programmatic use

```ts
import {
  buildDefaultScraperRegistry,
  InMemoryAssetStorage,
  type VisionClient,
  type BrowserAdapter,
} from '@forgely/scraper'

const registry = buildDefaultScraperRegistry({
  scraperApi: { apiKey: process.env.SCRAPERAPI_KEY },
})

const data = await registry.scrape('https://forgely-demo.myshopify.com', {
  siteId: 'site_xyz',
  maxProducts: 50,
})

console.info(`Scraped ${data.products.length} products with confidence ${data.confidence}`)
```

## ScrapedData fields (中英对照)

> The same shape no matter which adapter ran — downstream Analyzer / Planner
> agents stay source-agnostic.

| Field                              | 中文                         | Notes                                                                                                                                 |
| ---------------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `source`                           | 来源平台                     | `'shopify' \| 'woocommerce' \| 'amazon' \| 'aliexpress' \| 'alibaba_1688' \| 'taobao' \| 'jd' \| 'etsy' \| 'generic_ai' \| 'unknown'` |
| `sourceUrl`                        | 原始 URL                     | The exact URL the user provided                                                                                                       |
| `store.name`                       | 店铺名                       | Best-effort, falls back to apex hostname                                                                                              |
| `store.currency`                   | 币种 (ISO 4217)              | Always uppercase, e.g. `USD` / `CNY` / `EUR`                                                                                          |
| `store.language`                   | 语言                         | ISO 639-1                                                                                                                             |
| `store.domain`                     | 域名                         | Apex domain, no `www.`                                                                                                                |
| `products[].id`                    | 商品 ID                      | Stable across re-scrapes (Shopify gid / ASIN / etsy listing id)                                                                       |
| `products[].handle`                | URL slug                     | Used for canonical product URLs                                                                                                       |
| `products[].title`                 | 标题                         |                                                                                                                                       |
| `products[].description`           | 描述 (纯文本)                | HTML stripped                                                                                                                         |
| `products[].descriptionHtml`       | 描述 (HTML)                  | Raw HTML, optional                                                                                                                    |
| `products[].priceFrom.amountCents` | 起价 (整数 minor units / 分) | Always integer cents                                                                                                                  |
| `products[].priceFrom.currency`    | 币种                         |                                                                                                                                       |
| `products[].priceFrom.raw`         | 原始字符串 (审计用)          | E.g. `"$49.95"`                                                                                                                       |
| `products[].variants[]`            | 变体                         | Same MoneyAmount shape                                                                                                                |
| `products[].images[].url`          | 原图 URL                     |                                                                                                                                       |
| `products[].images[].storedUrl`    | Forgely 镜像 URL             | Filled when storage is wired                                                                                                          |
| `products[].available`             | 是否有货                     | True if any variant has stock                                                                                                         |
| `collections[]`                    | 类目                         | Optional; not all adapters emit                                                                                                       |
| `screenshots.homepage`             | 首页截图 URL                 | When BrowserAdapter is wired                                                                                                          |
| `confidence`                       | 置信度 0..1                  | Tier 1 ≥ 0.95, Tier 2 0.7–0.9, Tier 3 0.5–0.7                                                                                         |
| `meta`                             | 诊断信息                     | Adapter-specific (strategy, asin, itemId …)                                                                                           |

## Design principles

1. **One contract — `ScrapedData`** — every adapter normalises into the same product/variant/collection shape.
2. **Money is integer cents** — `MoneyAmount.amountCents` (never floats); raw string preserved for audits.
3. **Errors are typed** — every failure throws a `ScraperError` subclass with a stable `code` and `retryable` hint.
4. **Dependency-injected I/O** — `fetchImpl`, `BrowserAdapter`, `AssetStorage`, `VisionClient` are all swappable; tests inject mocks.
5. **Best-effort, never silent** — image mirroring and screenshots fail soft; product extraction failures throw.
6. **Tiered confidence** — adapters self-report `confidence ∈ [0, 1]` so downstream agents can decide whether to ask the user for more context.

## Image mirroring & screenshots

Pass an `AssetStorage` (`InMemoryAssetStorage` for tests, `LocalAssetStorage` for dev, R2 implementation lives in the worker service) and adapters will copy product images into Forgely-controlled storage and write `image.storedUrl`.

Screenshots and JS-rendered scraping go through `BrowserAdapter`. The default `NoopBrowserAdapter` throws when called — production wires up a Playwright-backed adapter in `services/worker`. Pass `--skip-screenshots` (the CLI default) to bypass entirely.

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

## CLI exit codes

| Code | Meaning                                                                      |
| ---- | ---------------------------------------------------------------------------- |
| `0`  | Success                                                                      |
| `1`  | Generic scrape error                                                         |
| `2`  | Bad CLI arguments                                                            |
| `3`  | Auth required (Shopify private store / Amazon login wall / WC needs API key) |

## Tasks covered

- **T08** — Shopify Adapter (`src/adapters/shopify.ts`)
- **T09** — WooCommerce Adapter, 3-strategy degradation (`src/adapters/woocommerce.ts`)
- **T28** — Multi-source extension:
  - Amazon, AliExpress, Etsy, GenericAI fallback (`src/adapters/{amazon,aliexpress,etsy,generic-ai}.ts`)
  - Tier-2 China platforms for Persona A factory owners — 1688, Taobao/Tmall, JD (`src/adapters/{alibaba1688,taobao,jd}.ts`)
- **T28-CLI** — `forgely-scrape` CLI for product demos and customer reports (`src/cli/`)

See `docs/MASTER.md` chapter 7 for product-level requirements.
