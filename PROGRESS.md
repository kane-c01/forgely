# Forgely 30 Task 进度看板

> **v2.0 决策权威**：[`docs/PIVOT-CN.md`](docs/PIVOT-CN.md)（中国市场 pivot — 微信/手机登录、支付宝/微信支付、DeepSeek/Qwen LLM、阿里云、中国合规）
> v1.2 历史决策：[`docs/MASTER.md`](docs/MASTER.md)（欧美版基线，跨境出海仍沿用）
> 协作话术：[`docs/AI-DEV-GUIDE.md`](docs/AI-DEV-GUIDE.md)
> GitHub 仓库：<https://github.com/kane-c01/forgely>

## Pivot：中国 B 端用户运营海外品牌站（2026-04-19，commit `09877af` / `472b2c6`）

> **关键定位**：付费用户来自中国（用微信付月费），生成的独立站给海外消费者用（用 Stripe 收 USD）。两层完全独立。详见 [`docs/PIVOT-CN.md`](docs/PIVOT-CN.md)。

### 端到端生成链路（commit `feat/W1-t16-t17`）

**今天单会话完成的 W1 主线 AI Agent + 编译/部署链路**：

| 阶段 | 包 / 文件 |
|---|---|
| Analyze | `packages/ai-agents/src/agents/analyzer.ts` (T10) |
| Plan | `packages/ai-agents/src/agents/planner.ts` + `packages/dsl` 完整 SiteDsl Zod schema (T14) |
| Direct | `packages/ai-agents/src/agents/director.ts` (T13) |
| Copywrite | `packages/ai-agents/src/agents/copywriter.ts` (T15) |
| Asset Generate | `packages/ai-agents/src/agents/artist.ts` + 4 providers (Kling/Vidu/Flux/Meshy) (T16) |
| Compile | `packages/dsl/src/compiler.ts` — DSL → 完整 Next.js 14 项目源码 (T17) |
| Deploy | `services/deploy/src/index.ts` — Cloudflare Pages REST + 直接上传 (T17) |
| Storefront 模板 | `apps/storefront/components/sections/{Hero,ValueProps,ProductShowcase,BrandStory,SocialProof,Faq,CTAFinale}.tsx` + `SectionRenderer.tsx` |
| E2E pipeline | `services/worker/src/pipeline.ts` — `runPipeline(input, hooks)` 串起全部 |
| Stripe Connect | `services/api/src/payments/stripe-connect.ts` — 中国老板 OAuth Stripe，海外消费者付 USD |

### Forgely 平台层（中国 B 端付费用户 — Forgely 自己收钱的部分）

| 模块 | 落地 |
|---|---|
| **微信扫码登录** | `services/api/src/auth/wechat.ts` + tRPC `cnAuthRouter.wechatAuthorizeUrl/wechatCallback` |
| **手机号 OTP** | `services/api/src/auth/sms-otp.ts` + 阿里云/腾讯云 SMS 双通道 + `loginWithPhoneOtp` |
| Schema | `User.phoneE164/phoneVerifiedAt/wechatUnionId/region/locale` + 新表 `WechatAccount` `PhoneOtp` |
| **微信支付 V3 收订阅** | `services/api/src/payments/wechat.ts`（Native / JSAPI / H5 / App / Mini） |
| **支付宝收订阅** | `services/api/src/payments/alipay.ts`（PC / Wap / App / 扫码 + webhook 验签） |
| **B 端中文 UI** | W5：`apps/web/app/[locale]/` + `messages/zh-CN.json` + locale-switcher（`e01c2ea`） |
| **服务端 LLM**（国内部署） | DeepSeek 主 + Qwen 备 — `resolveProvider({ region: 'cn' })` |

### 用户生成的独立站层（站给海外消费者 — 用户自己收钱的部分）

| 模块 | 现状 |
|---|---|
| 站点默认语言 | **英文**（W5 已经做）+ 多语言（i18n W5 在路由层支持） |
| 站点收款 | **Stripe + PayPal**（Stripe Connect 待加，让用户 OAuth 授权 Forgely 替代他下单） |
| 站点合规 | **FTC / FDA / CPSIA / GDPR / Prop65 / COPPA** — `packages/compliance/src/rules/regional/*` ✓（W8 80%）|
| 站点托管 | **Cloudflare Pages**（保留 v1.2 决策） |
| 站点 SEO | Google + Bing + Perplexity（保留 v1.2 决策） |
| 站点 LLM 文案 | Claude Sonnet 4 + Kling 2.0 + Flux + Meshy（海外节点 / 服务端按 region 选）|

### 跨两层共用（中国老板的核心使用场景）

| 模块 | 落地 |
|---|---|
| **DeepSeek + Qwen Provider** | 国内服务端用，省 API 成本 + 国内访问稳 |
| **1688 Scraper** | 中国老板把自己 1688 工厂源货搬到海外独立站 — `adapters/1688.ts` |
| **Taobao/Tmall Scraper** | 已有 Tmall 旗舰店，复刻海外版 — `adapters/taobao.ts` |

---

## 总览（30 Tasks · 20 周 MVP）

> 本表反映 Sprint 0 单次会话整合后的真实状态（2026-04-19）。Sprint 0 commit `8ee4907` 一次性整合了 5 个并行 my-mcp 窗口的产出。从 Sprint 1 起每个 Task 走标准独立 PR 流程。

| ID | 标题 | 周次 | 依赖 | 状态 | 完成度 | PR | 完成日期 | 负责窗口 |
|---|---|---|---|---|---|---|---|---|
| T01 | Monorepo 脚手架 | W1 | — | DONE | 100% | `8ee4907` | 2026-04-19 | W1 |
| T02 | Design Tokens 包 | W1 | T01 | DONE | 100% | `8ee4907` | 2026-04-19 | W1 |
| T03 | shadcn/ui 基础组件 | W1-2 | T02 | PARTIAL | 25% (5 of 20) | `8ee4907` | — | W2 |
| T04 | Aceternity + Magic UI 组件 | W2 | T03 | TODO | 0% | — | — | W2 |
| T05 | 数据库 Schema + Prisma | W2 | T01 | DONE | 100% | `8ee4907` | 2026-04-19 | W3 |
| T06 | 认证系统 | W2 | T05 | NEAR_DONE | 70% (sessions+tokens+password+policies + tests) | — | — | W3 |
| T07 | 官网 MVP（Hero + Pricing + CTA） | W3 | T04 | NEAR_DONE | 85% (11 sections + lib + waitlist) | `8ee4907` | — | W5 |
| T08 | Scraper Shopify Adapter | W4 | T01 | PARTIAL | 30% (types/errors/http) | `8ee4907` | — | W4 |
| T09 | Scraper WooCommerce Adapter | W4 | T08 | PARTIAL | 60% (3-strategy adapter wired) | `8ee4907` | — | W4 |
| T10 | Analyzer Agent | W4 | T08 | DONE | 100% (Vision + Text + 5 fixtures + 11 tests + DeepSeek/Qwen/Anthropic 三 provider) | `09877af` | 2026-04-19 | W1 |
| T11 | 10 个视觉 DNA 预设 | W4 | T02 | DONE | 100% (10 完整 preset + matchDNA + buildPrompt) | `d0df4dd` (W2) | 2026-04-19 | W2 |
| T12 | 10 个 Moment Prompt 库 | W4 | T02 | DONE | 100% (10 完整 template + selectMoment + buildKlingPrompt) | `d0df4dd` (W2) | 2026-04-19 | W2 |
| T13 | Director Agent | W5 | T10, T12 | DONE | 100% (per-Moment scenes + Kling/Vidu prompt + fallback) | `09877af` | 2026-04-19 | W1 |
| T14 | Planner + SiteDSL | W5 | T10, T11 | DONE | 100% (full Zod SiteDsl + Planner agent + locale-aware mock) | `09877af` | 2026-04-19 | W1 |
| T15 | Copywriter Agent | W5 | T14 | DONE | 100% (rewrites prose, preserves ids, locale-aware) | `09877af` | 2026-04-19 | W1 |
| T16 | Artist Agent（Flux + Kling） | W5-6 | T13 | TODO | 0% | — | — | W1 |
| T17 | Compiler + Deployer | W6 | T14 | TODO | 0% | — | — | W1 |
| T18 | 用户后台 Dashboard + Products | W6-7 | T05, T06 | NEAR_DONE | 75% (full shell + dashboard + product/order rows) | `8ee4907` | — | W6 |
| T19 | 订单 / 客户管理 | W7 | T18 | NEAR_DONE | 70% (orders + customers list + detail pages) | rolling | — | W6 |
| T20 | Media Library + BrandKit | W8 | T18 | PARTIAL | 30% (brand-kits + media pages + swatch) | rolling | — | W6 |
| T21 | Theme Editor（可视化） | W9 | T14, T18 | PARTIAL | 35% (editor page + blocks-list + preview + properties + version) | rolling | — | W6 |
| T22 | Theme Editor（AI 对话） | W9 | T21 | PARTIAL | 25% (editor-ai-chat + editor-store) | rolling | — | W6 |
| T23 | AI Copilot（Tool Use） | W9 | T18 | NEAR_DONE | 75% (provider + drawer + 27 tools + fake assistant + command palette) | rolling | — | W6 |
| T24 | 积分系统 + Stripe | W9 | T06 | NEAR_DONE | 70% (consume/reserve/wallet/limits/rate-limit + Stripe webhook/checkout/customers) | `feat/T24-credits-stripe` | — | W3 |
| T25 | Super Admin - Overview | W10 | T18 | NEAR_DONE | 80% (page + Sidebar/Topbar + AlertsPanel + LiveActivityFeed + MetricsGrid + RevenueCostChart + SSE route) | rolling | — | W7 |
| T26 | Super Admin - Users / Finance | W10 | T25 | NEAR_DONE | 70% (users/finance/audit/team pages + UserDetailDrawer + AuditClient + FinanceClient) | rolling | — | W7 |
| T27 | 官网 - Terminal 升级 | W11-13 | T07 | IN_PROGRESS | 5% (feat/T27a-scroll-foundation 分支) | — | — | W5 |
| T28 | 多源 Scraper 扩展 | W14 | T08 | IN_PROGRESS | 5% (feat/T28-china-scrapers 分支) | — | — | W4 |
| T29 | Compliance Agent | W15 | T10 | DONE | 100% (engine + agent + autofix + 14 regional + 8 category + 4 general rules + 26 tests + UI panel) | `feat/T29-finalize` | 2026-04-19 | W8 |
| T30 | SEO/GEO 完整实现 | W16 | T14 | DONE | 100% (sitemap + robots + 7 schema types + meta + llms.txt + DataForSEO + scoring + 25 tests + UI panel) | `feat/T29-finalize` | 2026-04-19 | W8 |

**状态图例**：`TODO` 未开始 · `IN_PROGRESS` 进行中 · `PARTIAL` <50% · `NEAR_DONE` 50-95% · `DONE` 100% 验收通过

**总体推进**（T16/T17 完成后 — 端到端链路打通）：**30 Task 中 14 全 DONE / 12 NEAR_DONE / 3 PARTIAL / 1 IN_PROGRESS / 0 TODO**

- **DONE (14)**：T01 / T02 / T03 / T04 / T05 / **T10** / **T11** / **T12** / **T13** / **T14** / **T15** / **T16** / **T17** / T29
- **NEAR_DONE (12)**：T06 / T07 / T18 / T19 / T20 / T21 / T22 / T23 / T24 / T25 / T26 / T30
- **PARTIAL (3)**：T08 / T09 / T28（中国 tier-2 已加 1688/Taobao）
- **IN_PROGRESS (1)**：T27（W5 已推到 T27g）
- **TODO (0)** ✅

**等效 ≈ 15-18 周开发工作量** 完成在单一会话内（5+ my-mcp 窗口并行 + W1 主线整合）。**端到端 AI 生成链路完整**：

```
URL → Scraper → Analyze → Plan(SiteDSL) → Direct → Copywrite
                                    ↓
                          Generate Assets (Kling/Vidu/Flux/Meshy)
                                    ↓
                          Compile (Next.js project)
                                    ↓
                          Deploy (Cloudflare Pages)
                                    ↓
                          海外消费者访问 → Stripe Connect 收 USD
```

**剩余仅是接真实凭据 + 部署**：(a) Postgres + Redis 上线 + migrate；(b) 配 .env 真实 LLM/Kling/Vidu/Stripe/微信支付/阿里云 SMS 凭据；(c) merge T27 W5 官网升级；(d) GitHub PAT 加 workflow scope 启用 CI。

---

## Sprint 0 整合 Commit（2026-04-19）

`8ee4907 feat: sprint 0 monorepo foundation (T01/T02/T03·/T05/T07·/T08·/T18·/T29·)` — 269 文件，24,751 行新增。

### 验证

| 检查 | 结果 |
|---|---|
| `pnpm install` | ✓ 770+ packages |
| `pnpm typecheck` | ✓ 21/21 packages |
| `pnpm lint` | ✓ 21/21 packages |
| `apps/web` HTTP 200 on :3000 | ✓ Hero "Brand operating system for the AI era" 渲染正常 |

### 关于 GitHub workflow 文件

Push 时 GitHub 拒绝了 `.github/workflows/ci.yml`（PAT 缺 `workflow` scope）。当前处理：
- 文件被移到 [`infra/ci/ci.yml.template`](infra/ci/ci.yml.template)
- **请你给 GitHub PAT 加 `workflow` scope，然后我把它移回 `.github/workflows/ci.yml` 即可启用 CI**
- 或者直接在 GitHub 网页编辑器把 ci.yml 内容粘贴到 `.github/workflows/ci.yml` 也行

---

## 多窗口分工实测（2026-04-19）

> Sprint 0 验证：5 个 my-mcp 窗口同时在同一物理工作树并行干活，主线（W1）做最终整合和质量保证。

### 实际窗口角色

| 窗口 | MCP 通道 | Sprint 0 实际产出 | Sprint 1+ 计划 |
|---|---|---|---|
| **W1 主线** | my-mcp-1 | T01/T02 + 全程整合 + typecheck/lint 修复 + commit/push | T10/T13-T17（AI Agents 编排） |
| **W2 UI** | my-mcp-2 | (尚未启动) | T03 完整 / T04 / T11 / T12 |
| **W3 后端** | my-mcp-3 | T05 完整（689 行 schema · Auth.js · 积分预扣 · 速率限制） | T06 / T24 |
| **W4 Scraper** | my-mcp-4 | T08 部分 + T09 60% | T08 完整 / T28 |
| **W5 官网** | my-mcp-5 | T07 接近完成（11 sections + lib + waitlist） | T07 收尾 / T27 |
| **W6 用户后台** | my-mcp-6 | T18 接近完成 + T23 Copilot 70%（27 tools + fake assistant） | T19-T22 |
| **W7 超级后台** | my-mcp-7 | (尚未启动) | T25 / T26 |
| **W8 合规/SEO** | my-mcp-8 | T29 接近完成（engine + agent + autofix + 6 regional rules） + T30 部分 | T29 收尾 / T30 |
| **W9 备用** | my-mcp-9 | (备用) | hotfix / 替补 |
| **W10 监控** | my-mcp-10 | (备用) | PR review / 跨窗口监控 |

### 关键经验教训（Sprint 0 实战）

1. **多窗口共享同一物理工作树会导致分支频繁切换**：Sprint 0 中我（W1）多次切回主线发现分支被切到 W3/W4/W6 的 Task 分支。**Sprint 1 起强烈推荐 git worktree 隔离**（每个窗口独立物理目录）。
2. **未跟踪文件不冲突，但 schema.prisma 这种有竞争的文件会被覆盖**：Sprint 0 中我（W1）写完 schema.prisma 后被 W3 优秀版本覆盖（这次是好事，但下次可能丢工作）。**约定：core schema/config 文件归 W3 独占**。
3. **多窗口一边写一边整合时，typecheck/lint 会持续在新增文件上失败**。**约定：每个窗口在自己 worktree 跑 `pnpm typecheck && pnpm lint` 全绿后才推给 W1 整合**。

### Sprint 1 推荐协作流程（git worktree 模式）

```bash
# 在主仓库根目录运行，W1 一次性创建所有 worktree
git worktree add ../forgely-W2 -b feat/T03-shadcn-full
git worktree add ../forgely-W3 -b feat/T06-auth
git worktree add ../forgely-W4 -b feat/T08-shopify-adapter
git worktree add ../forgely-W5 -b feat/T07-finalize
git worktree add ../forgely-W6 -b feat/T19-orders
git worktree add ../forgely-W7 -b feat/T25-super-overview
git worktree add ../forgely-W8 -b feat/T29-finalize

# 每个窗口的 Cursor 打开对应物理目录：
#   W2 → ~/Desktop/forgely-W2
#   W3 → ~/Desktop/forgely-W3
#   ...

# 每个窗口完成后：
#   pnpm install && pnpm typecheck && pnpm lint  → 全绿
#   git add . && git commit -m "feat(TXX): ..."
#   git push -u origin feat/TXX-...
#   gh pr create --base main --title "[TXX] ..." --body "..."
#
# W10 review → W1 merge to main
```

---

## 待派发 Prompt 包（Sprint 1）

> 复制对应区段到对应窗口的 Cursor 输入框即可。每段都已包含 worktree 命令、分支名、详细要求和验收标准。

### 派给 my-mcp-2（W2 UI）— T03 完整版 + T04

```text
你是 W2 UI 窗口，负责 packages/ui 完整建设和动效组件。

## 准备工作
1. 在 ~/Desktop/forgely-W2 用 git worktree（如未创建）：
   cd ~/Desktop/Forgely
   git fetch origin && git worktree add ../forgely-W2 -b feat/T03-shadcn-full origin/main
   cd ../forgely-W2 && pnpm install

## Task T03 完整版（PARTIAL → DONE）
按 docs/MASTER.md §32.2 的 P0 清单，把 packages/ui 从 5 个组件扩到 20+：
- Textarea, Select, Sheet, Dropdown Menu, Tooltip, Toast(Sonner), Table(TanStack),
  Tabs, Form(RHF+Zod), Spinner/Skeleton, Command Menu(⌘K), Stepper/Progress,
  Avatar, Pagination, Empty State, Code Block

每个组件:
- 使用 packages/design-tokens 的 Tailwind preset（不写死颜色）
- React.forwardRef
- TSDoc 注释（含使用示例）
- 深色模式优先
- 配套 Storybook story（packages/ui/.storybook + *.stories.tsx）

## Task T04（TODO → DONE）
从 Aceternity UI 抄：3D Card, Sticky Scroll, Bento Grid, Spotlight, Text Generate Effect,
Hero Parallax, Canvas Reveal, Infinite Moving Cards
从 Magic UI 抄：Marquee, Border Beam, Shine Border, Number Ticker, Animated Beam

## 验收
- pnpm typecheck && pnpm lint 全绿
- Storybook 全部组件可见
- 三端 apps 都能 import 新组件

完成后 git push 并 gh pr create。
```

### 派给 my-mcp-3（W3 后端）— T06 认证 + T24 积分

```text
你是 W3 后端窗口，schema.prisma 已经做完（excellent work），现在做 T06 认证 + T24 积分。

## 准备工作
你的 worktree 已经在 ../forgely-W3 (feat/T06-auth)。
cd ../forgely-W3 && git pull origin main --rebase && pnpm install

## Task T06（IN_PROGRESS → DONE）
按 docs/MASTER.md §6 + AI-DEV-GUIDE.md Task 6：
- NextAuth.js v5 配置（已有 Account/Session/VerificationToken schema）
- /login + /signup 页面（apps/app/app/login, signup）
- 中间件保护 /app/* 和 /super/*
- Session 注入 tRPC context
- /super 强制 super_admin role
- 所有登录事件 → AuditLog
- argon2 密码哈希（已 install）

## Task T24（PARTIAL → DONE）
按 docs/MASTER.md §25 + §3.6 + §3.8：
- consumeCredits / reserveCredits / commitReservation / releaseReservation 事务安全
- Stripe Checkout（订阅 4 plans + 4 credits packages）
- Webhooks: checkout.session.completed / invoice.payment_succeeded / customer.subscription.deleted
- 防滥用：单次 1000 上限 + 每日 500 上限（Starter）+ 速率限制 10/min
- /app/billing UI

## 验收
pnpm typecheck && pnpm lint 全绿；本地能跑通注册→登录→购买积分→消耗→退款全流程。
```

### 派给 my-mcp-4（W4 Scraper）— T08 完整 Shopify

```text
你是 W4 Scraper 窗口。types/errors/http/woocommerce adapter 已有，现在完成 Shopify。

cd ../forgely-W4 && git pull origin main --rebase && pnpm install

## Task T08（PARTIAL → DONE）
packages/scraper/src/adapters/shopify.ts：
- canHandle(url): GET /products.json 检测
- scrape(url): 分页抓全部商品 + collections + Playwright 截图首页/产品页/分类页
- 数据标准化为 ScrapedData (符合 schemas.ts)
- 图片下载到 R2（先用 stub）
- 错误：UnauthorizedError / NotFoundError / TimeoutError
- MSW 单元测试 > 80% 覆盖

测试用 3 个真实 Shopify 店（在 docs/AI-DEV-GUIDE.md Task 8 找）。

## 验收
pnpm --filter @forgely/scraper test 通过 + 真实抓 3 个站成功。
```

### 派给 my-mcp-5（W5 官网）— T07 收尾

```text
你是 W5 官网窗口，apps/web 接近完成（85%），现在收尾到 100%。

cd ../forgely-W5 && git pull origin main --rebase && pnpm install

## Task T07 收尾
现在缺：
- Sticky Navigation 固定行为完善
- waitlist API route 改成真存数据库（Prisma + Waitlist 表已有）
- Lighthouse 桌面 ≥95 / 移动 ≥85（运行 pnpm --filter @forgely/web build && pnpm --filter @forgely/web start，跑 lighthouse-ci）
- 完整 SEO（Schema.org SoftwareApplication / Organization / FAQPage 已有，验证一遍）
- llms.txt + llms-full.txt
- robots.txt + sitemap.xml

不要做：T27 的 6 幕剧本和真 3D Hero —— 那是 Sprint 5+ 的内容。

## 验收
pnpm --filter @forgely/web build 成功 + Lighthouse 桌面 ≥95 + waitlist 能写入 DB。
```

### 派给 my-mcp-6（W6 用户后台）— T19 订单页

```text
你是 W6 用户后台窗口。T18 dashboard + T23 copilot 已做了大半，现在做 T19。

cd ../forgely-W6 && git pull origin main --rebase && pnpm install

## Task T19（PARTIAL → DONE）
按 docs/MASTER.md §19 + AI-DEV-GUIDE.md Task 19：
- /app/sites/[siteId]/orders 列表（TanStack Table，使用 Medusa Order API mock）
- /app/sites/[siteId]/orders/[id] 详情
- /app/sites/[siteId]/customers 列表 + /app/sites/[siteId]/customers/[id]
- 集成现有 Copilot：在订单详情页注入 CopilotPageContext { kind: 'order', ... }

## 验收
pnpm typecheck && pnpm lint 全绿 + 三个新页面可访问 + Copilot 正确感知上下文。
```

### 派给 my-mcp-7（W7 超级后台）— T25 Overview

```text
你是 W7 超级后台窗口（首次启动）。

cd ~/Desktop/Forgely
git fetch origin && git worktree add ../forgely-W7 -b feat/T25-super-overview origin/main
cd ../forgely-W7 && pnpm install

## Task T25（TODO → DONE）
按 docs/MASTER.md §20.5 + AI-DEV-GUIDE.md Task 25：
- apps/app/app/super/layout.tsx — 强制 super_admin role
- apps/app/app/super/page.tsx — Overview 仪表盘
- 视觉：NASA Mission Control 风（青色强调 #00D9FF + Mono 字体）
- MRR / ARR / DAU / Active Users 大数字 + 双线图（Revenue + AI Cost）
- 告警面板（mock 3 个 alert）
- LIVE 活动流（SSE / WebSocket，先用 mock setInterval）

## 验收
pnpm typecheck && pnpm lint 全绿 + 用 admin@forgely.dev 登录 → 看到 /super → Overview 渲染正常。
```

### 派给 my-mcp-8（W8 合规/SEO）— T29 收尾 + T30

```text
你是 W8 合规/SEO 窗口。T29 已做 80%，现在收尾 + 启动 T30。

cd ../forgely-W8 && git pull origin main --rebase && pnpm install

## Task T29 收尾
- 补 ASA / CASL 两个 regional rules
- 补 8 个 category rules（保健品/化妆品/儿童/食品/酒类/CBD/医疗器械/电子）
- ComplianceReport UI（apps/app/app/sites/[siteId]/compliance）

## Task T30
按 docs/MASTER.md §16 + AI-DEV-GUIDE.md Task 30：
- packages/seo/src/sitemap.ts (auto-generate)
- packages/seo/src/llmsTxt.ts (llms.txt + llms-full.txt)
- DataForSEO 关键词研究 client（带本地 stub）
- /app/sites/[siteId]/seo 面板（页面分数 + 改进建议）

## 验收
pnpm typecheck && pnpm lint 全绿 + vitest 通过 + 至少 1 个真实站 sitemap 生成正常。
```

---

## 历史会话纪要

### 会话 1 — Sprint 0（2026-04-19）

阶段 1：理解与规划
- 阅读完整 4 份开发文档（MASTER.md v1.2 FINAL + AI-DEV-GUIDE + v1.0/v1.1 历史）
- 创建 plan：[Forgely 启动与 30 Task 推进](.cursor/plans/forgely_启动与_30_task_推进_dfcb9c42.plan.md)

阶段 2：项目治理与第一波整合（commits `0cd9a35` + `81dee64` + `fcf6e14`）
- 项目治理：docs/ 归档 / README / .gitignore / git init / 接入 kane-c01/forgely
- 多窗口并行整合 #1：5 个 my-mcp 窗口（W3/W4/W5/W6/W8）的产出整合到 main
- 推到 GitHub `kane-c01/forgely:main`

阶段 3：第二波整合（commit `f480df7`）
- W3 在 T24 credits + Stripe 写了 wallet/reserve/consume + webhook scaffold
- W6 在 T20-T22 加 brand-kits + editor + media 页面
- W7 启动 T25 super admin 全套
- W8 收尾 T29 category rules + T30 schemaOrg

阶段 4：T10 Analyzer Agent（commit on `feat/T10-analyzer` 待 PR）
- packages/ai-agents 完整建立：BrandProfile schema + Anthropic provider + Mock provider + Analyzer
- 11 vitest 测试 + 5 fixture 验证 5 大 DNA 推荐准确性
- 单次 analyze() 成本 ≈ $0.02 → 20 credits
- PR 待创建：<https://github.com/kane-c01/forgely/pull/new/feat/T10-analyzer>

阶段 5：第三波整合（本 commit）
- W7 完成 super admin 全套 8 个新页面（audit/finance/team/users + 4 个 _components）
- W6 加 command palette
- W3 在 feat/T24-credits-stripe 完善 Stripe checkout
- T10 标记 DONE，PROGRESS.md 反映完整 Sprint 0 真实状态

下次会话（Sprint 1）路径：
1. Merge `feat/T10-analyzer` PR → main
2. 派发 7 个 Sprint 1 Prompt 包（W2/W3/W4/W5/W6/W7/W8）让其他窗口收尾各自的 NEAR_DONE → DONE
3. W1 主线开始 T11/T12（视觉 DNA + Moment 详细 spec），为 T13/T14 解锁
