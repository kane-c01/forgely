# Forgely

> **Brand operating system for the AI era.**
>
> AI 驱动的品牌独立站生成与运营 SaaS。粘贴任意电商 URL → AI 多 Agent 协作 → 5 分钟生成带电影级视频 / 3D 的艺术级独立站，托管在 Forgely 平台。

---

## 项目状态

- **版本**：pre-MVP（Sprint 0）
- **开发文档**：v1.2 FINAL（锁定版，[`docs/MASTER.md`](docs/MASTER.md)）
- **进度看板**：[`PROGRESS.md`](PROGRESS.md)
- **目标 MVP**：20 周（30 Tasks）

## 技术栈定版

| 层 | 技术 |
|---|---|
| 前端 | Next.js 14 App Router · TypeScript strict · Tailwind CSS · shadcn/ui |
| 动效 | Framer Motion · GSAP ScrollTrigger · Lenis · React Three Fiber · Theatre.js |
| 后端 | Node.js 20 LTS · tRPC · Prisma · BullMQ · PostgreSQL 15 · Redis 7 · Medusa v2 |
| AI | Claude Opus 4.7（Planner）+ Sonnet · Kling 2.0 · Flux 1.1 Pro · Ideogram 3.0 · Meshy |
| 基础设施 | Cloudflare Pages + Workers + R2 · Railway / Fly.io · Neon / Supabase · Upstash · Sentry · PostHog |

## Monorepo 结构

```text
forgely/
├── apps/
│   ├── web/            官网 forgely.com
│   ├── app/            用户后台 + /super 超级后台（同一 Next.js）
│   └── storefront/     用户生成站模板
├── packages/
│   ├── ui/             共享 UI（shadcn + Aceternity + Magic UI）
│   ├── design-tokens/  Tailwind preset + tokens
│   ├── icons/          图标库
│   ├── charts/         Tremor 封装
│   ├── 3d/             R3F 共享 3D 组件
│   ├── animations/     Framer + GSAP 预设
│   ├── api-client/     tRPC 客户端
│   ├── scraper/        爬虫 Adapter
│   ├── ai-agents/      AI Agent 实现
│   ├── visual-dna/     10 个视觉 DNA 预设
│   ├── product-moments/ 10 个 Moment Prompt 模板
│   ├── compliance/     合规规则库
│   ├── seo/            SEO 工具
│   └── dsl/            SiteDSL schema + compiler
├── services/
│   ├── api/            核心 API（tRPC + Prisma）
│   ├── medusa/         Medusa v2 后端
│   ├── worker/         BullMQ 队列 worker
│   └── deploy/         部署服务
├── infra/              基础设施配置（后续 Task 添加）
├── docs/               全部开发文档
└── scripts/            一次性脚本
```

## 启动

```bash
# 1. 安装依赖（首次）
corepack enable
corepack prepare pnpm@9.12.0 --activate
pnpm install

# 2. 三端 Dev（并行）
pnpm dev           # 启动 apps/web (3000) · apps/app (3001) · apps/storefront (3002)

# 3. 单端启动
pnpm --filter @forgely/web dev
pnpm --filter @forgely/app dev
pnpm --filter @forgely/storefront dev

# 4. 类型检查 / Lint
pnpm typecheck
pnpm lint

# 5. 数据库（需要本地 Postgres，可后续开启）
pnpm --filter @forgely/api prisma generate
pnpm --filter @forgely/api prisma migrate dev
pnpm --filter @forgely/api prisma db seed
```

## 文档索引

| 文档 | 用途 |
|---|---|
| [`docs/MASTER.md`](docs/MASTER.md) | **唯一权威**开发文档 v1.2 FINAL（35 章 + 附录 A-E，3500 行） |
| [`docs/AI-DEV-GUIDE.md`](docs/AI-DEV-GUIDE.md) | AI 开发助手协作话术（Task Prompt 模板 + PR 流程） |
| [`docs/v1.0-原稿.md`](docs/v1.0-原稿.md) | 历史参考：v1.0 原稿 |
| [`docs/v1.1-增量补充.md`](docs/v1.1-增量补充.md) | 历史参考：v1.1 增量补充 |
| [`PROGRESS.md`](PROGRESS.md) | 30 Task 进度看板 + 多窗口分工 |

## 开发流程

1. 每个 Task 创建独立分支：`feat/T{NN}-<slug>`
2. Commit message：`feat(TXX): <概述>`（conventional commits）
3. 完成后推 GitHub → 创建 PR → review → merge 到 `main`
4. 更新 [`PROGRESS.md`](PROGRESS.md) 中对应行的状态、PR 链接、完成日期

## License

MIT — [`LICENSE`](LICENSE)
