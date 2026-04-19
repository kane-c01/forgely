# @forgely/ai-agents

Orchestration layer for the seven Forgely AI Agents (Scraper, Analyzer,
Director, Planner, Copywriter, Artist, Compliance, Compiler, Deployer).

> **Sprint 0 status (T10 DONE)**: ships the Analyzer Agent + a swappable
> Claude provider (real `@anthropic-ai/sdk` + in-process mock). Director,
> Planner, Copywriter, Artist and Compliance land in T13–T17 and T29.

## What's inside

```
packages/ai-agents/
├── src/
│   ├── types/
│   │   ├── brand-profile.ts   # Zod schema for the Analyzer's output
│   │   └── dna.ts             # The 10 built-in Visual DNA ids
│   ├── providers/
│   │   ├── types.ts           # LlmProvider contract used by every agent
│   │   ├── anthropic.ts       # Real Claude provider (Sonnet / Opus / Haiku)
│   │   ├── mock.ts            # In-process mock for unit tests + CI
│   │   └── index.ts           # resolveProvider() — env-driven factory
│   ├── agents/
│   │   ├── analyzer.ts        # T10 — turn ScrapedData → BrandProfile
│   │   ├── analyzer-prompts.ts
│   │   └── __tests__/         # 11 vitest cases, 5 representative fixtures
│   └── index.ts
├── vitest.config.ts
└── package.json
```

## Analyzer Agent — T10

```ts
import { resolveProvider, analyze } from '@forgely/ai-agents'

const provider = resolveProvider() // honours ANTHROPIC_API_KEY env var

const { profile, stats } = await analyze(scrapedData, { provider })

console.log(profile.recommendedDNA)   // → 'nordic_minimal'
console.log(profile.brandArchetype)   // → 'Caregiver'
console.log(profile.targetCustomer)   // → { persona, ageRange, regions, motivations }
console.log(stats.totalMs)            // ≈ 2 000–4 000 ms with the real provider
```

### What it does

Two parallel Claude Sonnet 4 calls:

1. **Vision pass** — Claude Vision inspects the homepage screenshot and
   returns a `VisionAnalysis` (visual quality 1–10, dominant colours,
   typography class, weaknesses, mood keywords).
2. **Text pass** — Claude reads the store metadata + 6 sample products
   and returns the brand archetype, category, price segment, reference
   brands, tone of voice, target customer persona, recommended visual
   DNA and the upgrade opportunity sentence.

The two outputs are merged and validated against `BrandProfileSchema`.
A heuristic safety-net rescues unknown DNA ids if the LLM hallucinates.

### Cost

| Pass    | Tokens (≈) | USD (Claude Sonnet 4) |
|---------|------------|-----------------------|
| Vision  | 1 600 in + 350 out | ~$0.010 |
| Text    | 800 in + 350 out   | ~$0.008 |
| **Total** | — | **~$0.02** → invoiced as **20 credits** (per `docs/MASTER.md` §3.6) |

### Provider resolution order

`resolveProvider()`:

1. `opts.prefer === 'mock'` → mock
2. `opts.prefer === 'real'` → real (throws if no key)
3. `FORGELY_AI_PROVIDER=mock` env → mock
4. `ANTHROPIC_API_KEY` set → real
5. fallback → mock (so CI / dev without keys still runs)

### Test commands

```bash
pnpm --filter @forgely/ai-agents test         # vitest run (11 cases)
pnpm --filter @forgely/ai-agents test:watch
pnpm --filter @forgely/ai-agents typecheck
pnpm --filter @forgely/ai-agents lint
```

## Roadmap

| Task | Agent | ETA |
|---|---|---|
| T13 | Director — generate Moment-specific shot scripts | Sprint 1 |
| T14 | Planner — emit SiteDSL                          | Sprint 1 |
| T15 | Copywriter — write all on-page copy             | Sprint 1 |
| T16 | Artist — call Flux / Kling / Meshy              | Sprint 1 |
| T17 | Compiler + Deployer — DSL → Next.js project     | Sprint 1 |
| T29 | Compliance Agent (lives in `@forgely/compliance`) | Sprint 1 |
