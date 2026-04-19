# @forgely/api

> Forgely 核心后端服务：Prisma 数据访问 · 认证 · 积分 · Stripe · tRPC 路由聚合。
>
> 由 **W3 后端** 窗口维护（[`PROGRESS.md`](../../PROGRESS.md)）。

## 范围

本 package 是其它三端（`apps/web`、`apps/app`、`apps/storefront`）以及内部 worker / 队列 / Edge 接入层的**唯一数据出口**。所有持久化、鉴权、计费逻辑都在这里实现，对外只暴露纯函数 + tRPC router。

| 子模块                      | 路径                   | 负责 Task |
| --------------------------- | ---------------------- | --------- |
| Prisma schema + Client      | `prisma/`、`src/db.ts` | T05       |
| 密码 / JWT / Session / RBAC | `src/auth/`            | T06       |
| 积分预扣事务 + 防滥用       | `src/credits/`         | T24       |
| Stripe Checkout + Webhook   | `src/stripe/`          | T24       |
| tRPC routers 聚合           | `src/router/`          | T05+      |

## 本地开发

```bash
# 1. 安装依赖（在仓库根目录）
pnpm install

# 2. 准备本地 Postgres 15（Docker 或 brew）
docker run --name forgely-pg -p 5432:5432 \
  -e POSTGRES_USER=forgely -e POSTGRES_PASSWORD=forgely -e POSTGRES_DB=forgely \
  -d postgres:15

# 3. 拷贝环境变量
cp services/api/.env.example services/api/.env

# 4. 生成 Prisma Client + 跑迁移
pnpm --filter @forgely/api prisma:generate
pnpm --filter @forgely/api prisma:migrate

# 5. 灌种子（10 个 Visual DNA + 4 个积分包 + 4 个 Plan + 1 个 super_admin 测试账号）
pnpm --filter @forgely/api db:seed
# 默认 super_admin：admin@forgely.dev / Forgely!2026

# 6. 类型检查 / 测试
pnpm --filter @forgely/api typecheck
pnpm --filter @forgely/api test
```

## 设计原则

1. **Tenant safety first**：所有针对租户数据的 Prisma 调用必须经过 `withTenant(userId)` 中间件（详见 `docs/MASTER.md` 第 8 章）。
2. **Money / credits 永远走事务**：`UserCredits.balance` 与 `CreditTransaction` 必须在同一个 `prisma.$transaction` 内完成，预扣 → 提交 / 释放（详见 `docs/MASTER.md` 第 25 章）。
3. **Stripe webhook 必须幂等**：所有 webhook 处理使用 `event.id` 去重表（`StripeEventLog`），避免重复发券/扣款。
4. **错误标准化**：抛 `ForgelyError`（`code/statusCode/userMessage`），tRPC 中间件转 `TRPCError`。

## 与其它窗口的接口

- **W6（apps/app）**：通过 `@forgely/api/router` 引入完整 tRPC `appRouter`，在 Next.js Route Handler 里挂载。NextAuth 适配器使用 `@forgely/api/auth` 暴露的 `prismaAdapter`。
- **W7（/super 超级后台）**：通过 `superRouter`（T25/T26 W7 自己加），但鉴权 / Audit 工具复用本包。
- **W4（scraper）/ W1（agents）/ worker**：通过 `@forgely/api/db` 拿 Prisma Client，通过 `@forgely/api/credits` 做扣费。

## 文档参照

- [`docs/MASTER.md`](../../docs/MASTER.md) 第 30 章（数据库 Schema）、第 25 章（积分系统）、第 28 章（支付）、第 31 章（API 设计）
- [`docs/AI-DEV-GUIDE.md`](../../docs/AI-DEV-GUIDE.md) Task 5 / Task 6 / Task 24 prompt
