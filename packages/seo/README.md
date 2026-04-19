# @forgely/seo

> SEO + GEO toolkit (T30)
>
> MASTER.md 第 16 章 — 每个生成的 Forgely 站点自动具备完整 SEO + 面向 AI 搜索的 GEO 优化。

## 模块

```text
src/
├── types.ts           # SiteMeta / PageMeta / SchemaObject / SeoScore
├── sitemap.ts         # buildSitemap()  含 50k URL 自动分片 + sitemap-index
├── robots.ts          # buildRobots()   含 AI 爬虫策略
├── schemaOrg.ts       # Organization / WebSite / Product / FAQ / Breadcrumb / Review
├── meta.ts            # buildMeta() / renderMetaHtml()
├── llms.ts            # buildLlmsTxt() + buildLlmsFullTxt()
├── score.ts           # scorePage()  0-100 + A/B/C/D/F 评级
├── keywords.ts        # DataForSeoClient (DI fetcher + cache)
├── utils/url.ts
└── __tests__/
```

## 一站式生成（最常用）

```typescript
import {
  buildMeta,
  buildSitemap,
  buildRobots,
  buildLlmsTxt,
  buildLlmsFullTxt,
  scorePage,
} from '@forgely/seo'

const site: SiteMeta = { ... }
const pages: PageMeta[] = [...]

const sitemapFiles = buildSitemap(site, pages)         // [{ filename, content }]
const robotsTxt    = buildRobots(site, { aiPolicy: 'allow-all' })
const llmsTxt      = buildLlmsTxt(site, pages, { positioning: '...' })
const llmsFullTxt  = buildLlmsFullTxt(site, pages)

for (const page of pages) {
  const meta  = buildMeta(site, page)        // → MetaTagSet
  const score = scorePage(site, page)        // → SeoScore
}
```

## Next.js metadata 集成

```typescript
import { buildMeta } from '@forgely/seo'

export async function generateMetadata({ params }) {
  const set = buildMeta(site, page)
  return {
    title: set.title,
    description: set.description,
    alternates: { canonical: set.canonical, languages: Object.fromEntries(set.alternates.map(a => [a.hreflang, a.href])) },
    openGraph: pickOG(set.meta),
    twitter: pickTwitter(set.meta),
    other: { 'application/ld+json': set.jsonLd.map(j => JSON.stringify(j)) },
  }
}
```

## DataForSEO 关键词研究

```typescript
import { DataForSeoClient } from '@forgely/seo'

const dfs = DataForSeoClient.create({
  login: process.env.DATAFORSEO_LOGIN!,
  password: process.env.DATAFORSEO_PASSWORD!,
})

const r = await dfs.research('trail runner shoe', { includeSerp: true })
console.log(r.ideas.slice(0, 5))   // KeywordIdea[]
console.log(r.serp?.slice(0, 3))   // SerpCompetitor[]
```

## SEO 评分（用户后台）

```typescript
const score = scorePage(site, page)
console.log(`${score.score}/100 (${score.grade})`)
for (const c of score.recommendations) {
  console.log(`[${c.level}] ${c.name} → ${c.hint}`)
}
```

## GEO 关键差异

`buildLlmsTxt` 和 `buildLlmsFullTxt` 输出 `llms.txt` 协议（[llmstxt.org](https://llmstxt.org/)）：

- **llms.txt** — 给 ChatGPT/Claude/Perplexity 速读：站点定位 + 关键页面索引
- **llms-full.txt** — 完整正文，适合作为 RAG 来源
- 默认结构化的 FAQ 段落（AI 引用率最高）

## 测试

```bash
pnpm --filter @forgely/seo test
```
