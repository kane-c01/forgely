# @forgely/api

> Forgely 核心后端：Prisma 数据访问 · 鉴权 · 多租户隔离 · 积分 · Stripe · 邮件 · cron · tRPC 路由聚合。
>
> 由 **W3 后端** 窗口维护（[`PROGRESS.md`](../../PROGRESS.md)）。

## 全景

```
@forgely/api
├── /db        Prisma client + 软枚举 + 类型导出
├── /auth      argon2 / JWT / Session / RBAC / Tenant / Audit / NextAuth helper
│              ├── 密码重置 flow
│              ├── 邮箱验证 flow
│              └── TOTP 2FA
├── /credits   wallet / consume / reserve+commit+release / rate-limit / monthly-reset
├── /stripe    SDK 单例 / Customer / Checkout / Customer Portal / Webhook(5 事件 + 幂等)
├── /billing   Coupon 校验 + 兑换
├── /email     Resend / Console transport + 5 个 inline-styled 模板 + 高级 helpers
├── /jobs      cron 入口（5 个 idempotent 作业）
├── /router    tRPC 根（auth / billing / credits / + tenant routers）
├── /routers   tenant-scoped 路由（sites / products / orders / customers /
│              media / brand-kits / cms / generation / copilot / super-finance）
└── /trpc      兼容层（让 routers/** 用 import '../../trpc'）
```

## Subpath imports

| Import                 | 用途                                                          | 主调方                       |
| ---------------------- | ------------------------------------------------------------- | ---------------------------- |
| `@forgely/api/db`      | Prisma client + soft enums + 业务常量                         | 全部                         |
| `@forgely/api/auth`    | 密码 / JWT / Session / RBAC / Tenant / Audit / NextAuth / 2FA | apps/app · worker            |
| `@forgely/api/credits` | wallet / consume / reserve / rate-limit / monthly-reset       | AI agents · worker · routers |
| `@forgely/api/stripe`  | Stripe Checkout + Webhook 调度器                              | apps/app/api/stripe/webhook  |
| `@forgely/api/billing` | Coupon 校验 + 兑换                                            | router/billing · webhook     |
| `@forgely/api/email`   | 事务邮件 transport + 模板                                     | auth flows · billing webhook |
| `@forgely/api/router`  | 完整 `appRouter` + `createContext`                            | apps/app api/trpc handler    |
| `@forgely/api`         | 顶层 `prisma`, `errors`, `AppRouter` 类型                     | api-client / front-end       |

## 本地开发

```bash
# 1. 装依赖（在仓库根）
pnpm install

# 2. 起本地 Postgres 15
docker run --name forgely-pg -p 5432:5432 \
  -e POSTGRES_USER=forgely -e POSTGRES_PASSWORD=forgely -e POSTGRES_DB=forgely \
  -d postgres:15

# 3. 拷贝 .env
cp services/api/.env.example services/api/.env

# 4. 生成 client + migrate + seed
pnpm --filter @forgely/api prisma:generate
pnpm --filter @forgely/api prisma:migrate
pnpm --filter @forgely/api db:seed
# 默认 super_admin: admin@forgely.dev / Forgely!2026 (含 1,000,000 积分)

# 5. 类型检查 / 测试
pnpm --filter @forgely/api typecheck
pnpm --filter @forgely/api test            # 72 passing
pnpm --filter @forgely/api test:watch
```

## 已交付能力清单

### Auth (`src/auth/`)

| 能力                                              | 入口                                                                           |
| ------------------------------------------------- | ------------------------------------------------------------------------------ |
| Argon2id 密码哈希 + 强度检查                      | `hashPassword` / `verifyPassword` / `assertPasswordStrength`                   |
| JWT (HS256) 签发 / 验证                           | `signJwt` / `verifyJwt`                                                        |
| 不透明 token + SHA-256 hash 存储                  | `generateToken` / `hashToken`                                                  |
| 服务端 Session (DB-backed)                        | `createSession` / `validateSession` / `revoke*`                                |
| 暴力破解锁 + 失败计数                             | `assertNotLocked` / `recordFailedLogin`                                        |
| 注册 / 登录 / 登出（含 LoginEvent + Audit）       | `signupWithPassword` / `signinWithPassword` / `signout`                        |
| RBAC (user / super_admin / admin / support)       | `requireUser` / `requireRole` / `requireSuperAdmin`                            |
| 多租户隔离（IDOR-resistant）                      | `ownedScopeWhere` / `assertFoundAndOwned`                                      |
| 30 个 Audit action enum + 通用 `recordAudit`      | `AUDIT_ACTIONS` / `recordAudit`                                                |
| **密码重置 flow**                                 | `requestPasswordReset` / `consumePasswordReset`                                |
| **邮箱验证 flow**                                 | `sendEmailVerification` / `verifyEmail`                                        |
| **TOTP 2FA** (RFC 6238)                           | `beginTotpEnrollment` / `confirmTotpEnrollment` / `verifyTotp` / `disableTotp` |
| **Auth.js v5 适配器 + Credentials provider 工厂** | `prismaAdapter` / `buildNextAuthConfig`                                        |

### Credits (`src/credits/`)

| 能力                                     | 入口                                                                                 |
| ---------------------------------------- | ------------------------------------------------------------------------------------ |
| 同步扣费（事务安全 + 日上限计数）        | `consumeCredits` / `consumeCreditsSafe`                                              |
| 预扣 / 提交 / 释放（30min TTL）          | `reserveCredits` / `commitReservation` / `releaseReservation` / `runWithReservation` |
| 加币（购买/订阅/赠送/退款）              | `creditWallet`                                                                       |
| 钱包查询 / ledger 分页                   | `getOrCreateWallet` / `getBalance` / `listTransactions`                              |
| 滑窗速率限制（DB-backed，无 Redis 依赖） | `consumeRateLimit`                                                                   |
| 单次 / 日限额按 plan 配置                | `PER_OPERATION_MAX` / `DAILY_CAP_BY_PLAN` / `AI_RATE_PER_MIN_BY_PLAN`                |
| 月度赠送 cron 兜底                       | `runMonthlyCreditReset`                                                              |
| 过期预约清理                             | `expireOverdueReservations`                                                          |

### Stripe (`src/stripe/`)

| 能力                                  | 入口                                                                                                                                                      |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 懒加载 SDK + 测试种子                 | `getStripe` / `setStripeClient`                                                                                                                           |
| Customer 创建（缓存 cus_xxx）         | `getOrCreateStripeCustomer`                                                                                                                               |
| 一次性积分包 Checkout                 | `createCreditPackCheckout`                                                                                                                                |
| 订阅 Checkout（3 plans × 2 cadences） | `createSubscriptionCheckout`                                                                                                                              |
| Customer Portal                       | `createBillingPortalSession`                                                                                                                              |
| Webhook 调度器（签名校验 + 幂等）     | `handleStripeWebhook`                                                                                                                                     |
| 事件覆盖                              | `checkout.session.completed`, `invoice.payment_succeeded`, `invoice.payment_failed`, `customer.subscription.{created,updated,deleted}`, `charge.refunded` |

### Billing (`src/billing/`)

| 能力                            | 入口                    |
| ------------------------------- | ----------------------- |
| 优惠券预览校验（不兑换）        | `previewCoupon`         |
| 原子兑换 + 计数器（idempotent） | `redeemCoupon`          |
| 用户校验封装                    | `validateCouponForUser` |

### Email (`src/email/`)

| 能力                                                                       | 入口                                      |
| -------------------------------------------------------------------------- | ----------------------------------------- |
| Resend HTTP transport / Console fallback                                   | `getEmailTransport` / `setEmailTransport` |
| Welcome / VerifyEmail / PasswordReset / InvoicePaid / InvoicePaymentFailed | `renderXxx` + `sendXxxEmail`              |
| 模板 inline-styled，深色品牌色                                             | —                                         |

### Cron (`src/jobs/`)

```
jobs.purgeExpiredSessions        // hourly
jobs.purgeExpiredAuthTokens      // hourly
jobs.expireOverdueReservations   // every 5 min
jobs.purgeRateLimitWindows       // daily
jobs.monthlyCreditReset          // daily
runAllJobs()                     // ops smoke
```

### tRPC routers

| Namespace      | 路径                           | Procedures（高亮）                                                                                                                                                                                       |
| -------------- | ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `auth.*`       | `src/router/auth.ts`           | signup, signin, me, signout(All), listSessions, revokeSession, requestPasswordReset, confirmPasswordReset, resendEmailVerification, verifyEmail, beginTotpEnrollment, confirmTotpEnrollment, disableTotp |
| `credits.*`    | `src/router/credits.ts`        | balance, history, consumeInternal (super_admin), checkAiRateLimit                                                                                                                                        |
| `billing.*`    | `src/router/billing.ts`        | catalog, subscription, invoices, startCreditPackCheckout, startSubscriptionCheckout, openCustomerPortal, previewCoupon                                                                                   |
| `sites.*`      | `src/routers/sites.ts`         | list / get / create / update / archive / isSubdomainAvailable                                                                                                                                            |
| `products.*`   | `src/routers/products.ts`      | list / get（经 Medusa adapter）                                                                                                                                                                          |
| `orders.*`     | `src/routers/orders.ts`        | list / get / refund                                                                                                                                                                                      |
| `customers.*`  | `src/routers/customers.ts`     | list / get                                                                                                                                                                                               |
| `media.*`      | `src/routers/media.ts`         | list / get / presign / register / archive                                                                                                                                                                |
| `brandKits.*`  | `src/routers/brand-kits.ts`    | list / get / create / update / delete                                                                                                                                                                    |
| `cms.*`        | `src/routers/cms.ts`           | list / get / create / update / delete (Page)                                                                                                                                                             |
| `generation.*` | `src/routers/generation.ts`    | start (扣预留) / list / get / cancel (释放预留)                                                                                                                                                          |
| `copilot.*`    | `src/routers/copilot.ts`       | startConversation / list / get / appendMessage / delete                                                                                                                                                  |
| `super.*` 散件 | `src/routers/super-finance.ts` | finance.overview / finance.subscriptionsByPlan / finance.recentStripeEvents · credits.wallet / history / grant / clawback                                                                                |

apps/app 在 `app/api/trpc/[trpc]/route.ts` 里挂载即可：

```ts
import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { appRouter, createContext } from '@forgely/api/router'

export const POST = (req: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: () => createContext({ req }),
  })
```

## 设计原则

1. **租户隔离**：所有按 userId 范围的查询必须经 `ownedScopeWhere(ctx)` 或 `assertFoundAndOwned(ctx, row, ...)`。super_admin 跨租户读自动写 `super.tenant_data_read` 审计。
2. **钱必走事务**：`UserCredits.balance` 与 `CreditTransaction` 必须在同一 `prisma.$transaction` 内。预扣 → 提交 / 释放生命周期由 `runWithReservation` 封装。
3. **Webhook 幂等**：Stripe 事件先 upsert `StripeEventLog`，P2002 (unique constraint) → "duplicate"，永远不重复处理。
4. **错误标准化**：抛 `ForgelyError(code, userMessage, statusCode)`；tRPC 中间件转 `TRPCError` 并附 `forgelyCode` / `httpStatus` 供前端 toast。
5. **审计不应阻塞**：`recordAudit` 失败仅 `console.warn`，不抛错（业务行为优先）。

## 验证

```bash
# 全套类型检查 + 测试
pnpm --filter @forgely/api typecheck   # ✓
pnpm --filter @forgely/api lint        # 我们自己的 src 0 errors
pnpm --filter @forgely/api test        # 72 passing
```

## 文档参照

- [`docs/MASTER.md`](../../docs/MASTER.md) §3（商业模式）· §25（积分）· §28（支付）· §30（Schema）· §31（API）
- [`docs/AI-DEV-GUIDE.md`](../../docs/AI-DEV-GUIDE.md) Task 5 / 6 / 24 prompt
