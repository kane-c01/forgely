# Sprint 3 派发清单 — 还差什么 + 8 个窗口的 Prompt 包

> **生成于**：2026-04-19，main commit `7f77ac3` 之后
> **基准文档**：[`docs/MASTER.md`](MASTER.md) 35 章 + [`docs/PIVOT-CN.md`](PIVOT-CN.md) 14 章
> **使用方式**：每个窗口一段独立 Prompt — 复制到对应 my-mcp-N 窗口的 Cursor 输入框即可。

---

## 一、全模块差距矩阵（按 docs/MASTER.md 35 章）

| 章 | 模块 | 当前完成度 | 还差什么 | 派给谁 |
|---|---|---|---|---|
| 1-3 | 产品 / 用户 / 商业模式 | ✅ docs 锁定 | 实际 ¥ 定价文案落到 apps/web/lib/pricing.ts 和 apps/web/messages | W5 |
| 4 | 总体技术架构 | ✅ done | — | — |
| **5** | **AI Agent 编排** | 7 agents 80% 完成 | services/worker BullMQ workers 真接 BullMQ + Redis；AgentEvent Redis Streams；可视化 12 步施法实时进度推 SSE | **W1 (我)** |
| **6** | **Medusa v2 后端** | ❌ 仅 stub README | services/medusa 真起 Medusa v2 + 多租户 sales_channel 隔离 + 5 个 ForgelyXxx Modules | **新窗口 W11 (Medusa)** |
| 7 | 多源 Scraper | ✅ 8 adapters | 1688/Taobao 真 Playwright selectors（现在走 generic-ai 兜底）；JD/Pinduoduo P1 | W4 |
| 8 | 多租户 | 50% (sales_channel 字段已加) | Prisma middleware 强制注入 site_id 过滤；通配符 SSL 自动签发；多 Cloudflare Pages tenant 部署 | W3 |
| 9 | 部署 / 基础设施 | 30% (CI yaml 待启用) | 阿里云 PolarDB / 腾讯云 SCF terraform；Sentry 接入；PostHog；Better Stack | **新窗口 W12 (DevOps)** |
| 10 | 视觉 DNA | ✅ 10 完整 preset | 每个 DNA 配 1 张参考图（public/dna-references/） | W2 |
| 11 | Product Moment | ✅ 10 完整 template | selectMoment() 准确率 unit test (20 案例) ；参考视频示例（public/moment-references/） | W2 |
| 12 | AI 对话分析引擎 | ✅ Conversation Agent + tRPC | apps/app 接入对话 UI（实时 SSE / 字符流式） | **W6** |
| 13 | 端到端生成 Pipeline | ✅ runPipeline 串通 | Generation 表 row → BullMQ 派发；Generation step-level 状态 update → SSE | W1 |
| 14 | 爆品识别 | ❌ 没写 | rankProducts() 算法 + UI 在对话中展示 3 个候选 | W6 |
| 15 | 合规 Agent | ✅ engine + 6 regional | ASA / CASL 两个 region；保健品/化妆品/儿童/食品/酒类/CBD/医疗器械/电子 8 类 category；UI 已在 /sites/[id]/compliance | W8 |
| 16 | SEO + GEO | ✅ schemaOrg + sitemap | DataForSEO 关键词 client；llms.txt + llms-full.txt 自动生成；百度站长 sitemap submit | W8 |
| 17 | 统一视觉品牌 | ✅ Tokens + 三端 preset | 字体 fallback chain 测试 + Storybook design-tokens 页面 | W2 |
| 18 | 对外官网 | ✅ 11 sections + i18n | T27 视频 backdrop 接 Vidu 真 8s loop；6 幕滚动剧本 GSAP polish；docs 落到 `/docs` | W5 |
| 19 | 用户后台 | ✅ 25 页面 + Copilot | tRPC mock 切真：sites.list / products.list 接 services/api 真数据 | W6 |
| 20 | 超级后台 | ✅ Overview/Users/Audit/Finance/Team | TeamMember + Refund Prisma model；Login as user 临时 token；Marketing / Plugins / SystemHealth 模块 | W7 |
| 21 | 生成的独立站模板 | ✅ 7 sections + sample DSL | apps/storefront 接 Medusa Cart/Checkout；产品详情页变体选择；Stripe Checkout 嵌入 | **W6 + W11** |
| 22 | 品牌资产系统 | ✅ Schema + page 骨架 | remove.bg 集成；Logo 8 变体生成 (Ideogram)；Pexels/Unsplash 浏览器；R2 上传 | W6 |
| 23 | 主题编辑器 | ✅ 三栏布局 + 拖拽 | iframe 真预览 (postMessage)；版本历史 diff 视图 | W6 |
| 24 | AI Copilot | ✅ Provider + 27 tools + drawer | 真接 Anthropic / DeepSeek（不再 fake-assistant）；pgvector 长期记忆 | W6 |
| 25 | 积分系统 | ✅ wallet/reserve/consume + 速率限制 | 月度赠送积分 cron；积分包 Stripe Checkout E2E 测试 | W3 |
| 26 | 插件市场 | ❌ 不做（V2） | — | — |
| 27 | CMS / 内容 | 25% (Page schema + pages route) | Tiptap 富文本接入；MJML 邮件模板编辑；导航菜单编辑 | W6 |
| 28 | 支付系统 | ✅ Stripe + WechatPay + Alipay 骨架 | 真 RSA-SHA256 / RSA2 签名（生产部署接 SDK）；webhook E2E 测试 | W3 |
| 29 | Monorepo 工程 | ✅ 22 packages | tsconfig refs 全统一；Turborepo cache 优化；GitHub Actions 启用（PAT scope） | W1 |
| 30 | 数据库 Schema | ✅ 31 models | 添加 TeamMember / Refund / GenerationStep；Prisma migrate 生成实际 SQL | W3 |
| 31 | API 设计规范 | ✅ tRPC routers 全套 | OpenAPI / Swagger 导出；rate-limit middleware；errors.ts 翻译到中英 | W3 |
| 32 | 组件库 | ✅ shadcn 20+ + Aceternity 13 | 复杂组件（DateRangePicker / FileUpload / RichTextEditor / ColorPicker / FontPicker / VideoPlayer / 3D Card） | W2 |
| 33 | 20 周 MVP 计划 | ✅ 进度 12 周 | 剩 8 周（T16-T17 已接，剩集成 + Beta） | — |
| 34 | Task 清单 | 30 task DONE 17 / NEAR_DONE 10 / IN_PROGRESS 1 / TODO 2 (T19/20 收尾) | T19 订单流程 + T20 Logo Wand 收尾 | W6 |
| 35 | 风险点 | ✅ docs | 真实运行后 metrics 持续 review | — |

---

## 二、按窗口分组的 Sprint 3 Prompt 包

> 每段一个窗口，复制即用。每个窗口都开 git worktree 在 `~/Desktop/forgely-WN`，分支 `feat/W{N}-sprint-3-{slug}`。

---

### 派给 my-mcp-2（W2 UI）— Sprint 3

```text
你是 Forgely W2 UI 窗口。Sprint 3 的目标：把 packages/ui 复杂组件库补齐，为视觉 DNA 配参考图，
为 Product Moment 配示例视频，写 Storybook 全套 story。

## 准备
cd ~/Desktop/Forgely
git fetch origin && git pull origin main --rebase
git worktree add ../forgely-W2 -b feat/W2-sprint-3-ui-polish origin/main
cd ../forgely-W2 && pnpm install

## 任务（全部完成后一个 PR）

1. **packages/ui 复杂组件**（docs/MASTER.md §32.2 P1 + P2）：
   - DateRangePicker（基于 react-day-picker）
   - FileUpload（拖拽 + 进度 + 错误，集成 R2 sign URL）
   - RichTextEditor（Tiptap，工具栏：bold/italic/link/list/heading/image/code-block）
   - ColorPicker（HSL + 8 预设主题色）
   - FontPicker（搜 Google Fonts + 自上传 TTF/OTF 预览）
   - ImageGallery（lightbox + 缩略导航）
   - VideoPlayer（<video> + 多分辨率切换 + 自动质量）
   - Animated Metrics（NumberTicker — 数字滚动动效）
   - 3D Card（Aceternity 风，hover 翻转）
   - Hero Parallax（已有 — 抛 Storybook story）
   - 全部带 forwardRef + TSDoc + Storybook story

2. **packages/visual-dna**：每个 DNA 配 1 张参考图（512×512 jpg），放
   public/dna-references/{dna_id}.jpg，并在 src/presets/{dna_id}.ts 加
   `referenceImage: '/dna-references/{dna_id}.jpg'` 字段。

3. **packages/product-moments**：每个 Moment 配 1 段示例视频（4-6s mp4 ≤ 2 MB），
   放 public/moment-references/{moment_id}.mp4，模板里加 `referenceVideo`。

4. **Storybook**：
   - packages/ui/.storybook/main.ts + preview.ts 配置 dark mode 默认
   - Storybook 部署到 forgely.com/storybook（Sprint 4）

## 验收
pnpm typecheck && pnpm lint 全绿；Storybook 跑得起；新组件 hover/focus 状态完整。

完成 → git push -u origin feat/W2-sprint-3-ui-polish → gh pr create。
```

---

### 派给 my-mcp-3（W3 后端 / 数据库 / 支付）— Sprint 3

```text
你是 Forgely W3 后端窗口。Sprint 3 的目标：补 schema 缺失模型、生产 Stripe / 微信支付 / 支付宝
真签名、加 Prisma 多租户 middleware、加 OpenAPI 导出、补单元测试覆盖率。

## 准备
git fetch origin && git pull origin main --rebase
git worktree add ../forgely-W3 -b feat/W3-sprint-3-backend origin/main
cd ../forgely-W3 && pnpm install

## 任务（全部完成后一个 PR）

1. **Prisma schema 补缺失**（services/api/prisma/schema.prisma）：
   - TeamMember 表（email / role: OWNER|ADMIN|SUPPORT / invitedAt / acceptedAt）
   - Refund 表（id / orderId / userId / amountCents / status: queued|approved|denied|completed / reason / externalId / createdAt / processedAt）
   - GenerationStep 表（generationId / stepName / status / startedAt / completedAt / errorMessage / payload）
   - 跑 prisma migrate dev 生成 SQL

2. **Prisma multi-tenant middleware**（services/api/src/db.ts）：
   - 注入 siteId 到 findMany/findFirst/update/delete where；缺 siteId 时（管理员场景）显式 bypass
   - 单元测试：12 个表的 tenant 隔离正确性

3. **生产签名实现**：
   - services/api/src/payments/wechat.ts：接 wechatpay-axios-plugin SDK，做 RSA-SHA256 签名 + AES-GCM webhook 解密 + 退款实现
   - services/api/src/payments/alipay.ts：接 alipay-sdk SDK，RSA2 签名 + webhook 验签
   - services/api/src/payments/stripe-connect.ts：把 sign 部分换成 stripe SDK 真实调用 + 完成 refund

4. **Marketing / Stripe webhook E2E test**（vitest + msw）：
   - 测 wechat: 用户支付成功 → webhook → 加积分 / 翻订阅状态
   - 测 alipay: 同上
   - 测 stripe: subscription.deleted → 降为 free + 当前周期保留权限

5. **Credit cron**（services/api/src/jobs/）：
   - 每月 1 号 0:00 cron 重置订阅赠送积分（按 plan 给配额，purchased 不动）

6. **OpenAPI 导出**（trpc-openapi）：
   - 生成 services/api/openapi.json，给到外部集成方/MCP

7. **errors.ts i18n**：把 ForgelyError userMessage 改成 { en: '...', 'zh-CN': '...' } 结构

## 验收
pnpm --filter @forgely/api test 覆盖率 > 70%；prisma migrate dev 跑通；
真支付 webhook (test mode) 能 E2E 完成。

完成 → push + PR。
```

---

### 派给 my-mcp-4（W4 Scraper）— Sprint 3

```text
你是 Forgely W4 Scraper 窗口。Sprint 3 目标：1688/Taobao 真 Playwright + selector，加 JD/Pinduoduo，
ScraperRule 自学规则系统优化。

## 准备
git fetch origin && git pull origin main --rebase
git worktree add ../forgely-W4 -b feat/W4-sprint-3-scrapers origin/main
cd ../forgely-W4 && pnpm install
pnpm exec playwright install chromium

## 任务

1. **packages/scraper/src/adapters/1688.ts** 真实现：
   - 商家页 GET https://shop{shopId}.1688.com/page/offerlist.htm
   - 商品 PDP detail.1688.com/offer/{offerId}.html
   - Playwright + 国内代理池 ENV (PROXY_POOL_CN_URL)
   - selector 写在 src/adapters/1688/selectors.ts
   - 单元测试 fixture 3 个真实店

2. **packages/scraper/src/adapters/taobao.ts** 真实现：
   - 处理 _m_h5_tk token + 滑块降级到 cookie 模式
   - tmall + taobao 两种 hostname 区分
   - 商品评价抓 (comment.taobao.com)

3. **packages/scraper/src/adapters/jd.ts**（新）：
   - JD Browse Search API + PDP item.jd.com/{sku}.html

4. **packages/scraper/src/ai/rule-store.ts** 优化：
   - 把规则存到 Postgres ScraperRule 表（替换 InMemoryRuleStore）
   - 学习成功率统计（exposed via super-admin）

5. **packages/scraper-playwright** 包（已经在）：暴露 PlaywrightBrowserAdapter 真实运行

## 验收
真站 1688/Taobao/JD 各抓 3 个店成功 + ScrapedData 符合 schema + 自动学习规则成功率 > 70%。

完成 → push + PR。
```

---

### 派给 my-mcp-5（W5 官网）— Sprint 3

```text
你是 Forgely W5 官网窗口。Sprint 3 目标：完成 /en 路由（现在 500），接 Vidu 真视频做 hero backdrop，
完成商业模式 ¥ 定价 messages 落地，6 幕剧本 polish。

## 准备
git fetch origin && git pull origin main --rebase
git worktree add ../forgely-W5 -b feat/W5-sprint-3-web-polish origin/main
cd ../forgely-W5 && pnpm install

## 任务

1. **修复 /en 路由 500**：
   - 现在 / 跳到 /zh OK，/en 还 500
   - 大概率是 components/site/pricing.tsx 的 plan.cta 在 en 数据里仍 undefined
   - 修 lib/pricing.ts → 给 cta 加默认值，或
   - 修 messages/en.ts → pricing.plans.* 全套补全
   - /en /zh 都必须 200 + 正确 title

2. **Vidu 真 hero backdrop**：
   - apps/web/components/scroll/hero-backdrop.tsx 接 services/api 的
     /api/video/hero?dna=nordic_minimal 端点
   - 端点调 Vidu API 生成或读 R2 缓存
   - 优雅降级：API 失败 → fallback 到本地 mp4

3. **CN 商业模式 ¥ 定价落地**：
   - apps/web/lib/pricing.ts 加 currency 字段，按 locale 切 USD/CNY
   - apps/web/messages/zh-CN.ts pricing.plans.* 改 ¥199/¥599/¥1999/¥10000
   - apps/web/messages/en.ts 保持 $29/$99/$299/$2000+

4. **6 幕滚动剧本 polish**：
   - apps/web/components/scroll/scroll-acts.tsx 用 GSAP ScrollTrigger
   - Hero(0-100vh) → Split(100-200) → Build(200-300) → Reveal(300-400)
     → Proof(400-500) → CTA(500-600)
   - reduced-motion 用户给静态 fallback

5. **Showcase 真案例**：
   - apps/web/lib/showcase.ts 加 6 个真示例（先用占位图 + 描述）
   - hover 播 6s loop 视频

6. **/docs marketing landing**：
   - apps/web/app/[locale]/docs/page.tsx 列开发文档主链
   - 链 docs/MASTER.md / PIVOT-CN.md / PROGRESS.md（GitHub blob）

## 验收
/ /zh /en 三路全 200；Lighthouse 桌面 ≥ 95 / 移动 ≥ 85；
6 幕剧本 60fps 平滑；Vidu hero backdrop loaded < 3s。

完成 → push + PR。
```

---

### 派给 my-mcp-6（W6 用户后台 / Editor / Copilot）— Sprint 3

```text
你是 Forgely W6 用户后台窗口。Sprint 3 目标：真接 tRPC（替代 mock）、对话 UI、Theme Editor
iframe 真预览、AI Copilot 真接 Claude/DeepSeek。

## 准备
git fetch origin && git pull origin main --rebase
git worktree add ../forgely-W6 -b feat/W6-sprint-3-app-real-data origin/main
cd ../forgely-W6 && pnpm install

## 任务

1. **tRPC 客户端 + 真数据**：
   - apps/app/lib/trpc.ts 配 @trpc/react-query
   - 把 apps/app/lib/mocks.ts 的 sites/products/orders/customers 替换成
     trpc.sites.list / trpc.products.list / trpc.orders.list
   - 列表 + 详情两层都接

2. **Generation 对话 UI**：
   - apps/app/app/(app)/generate/page.tsx 新页
   - 接 trpc.conversation.start / submitAnswer / commit
   - 多轮聊天 UI：用户消息卡片 + 助手卡片 + reasoning 折叠
   - 当 expects.kind === 'choice' 渲染按钮组；'url' 渲染输入框；'tags' 渲染 tag picker；'product' 渲染产品候选；'confirm' 渲染最终方案 + Confirm 按钮
   - Confirm 后 trpc.conversation.commit → 跳到 /sites/[siteId]/generating（progress page）

3. **/sites/[id]/generating 进度页**：
   - 12 步施法动画（Lottie / SVG 动效）
   - 接 services/api SSE /generation/{id}/stream
   - 完成 → 跳到生成的站子域名

4. **Theme Editor iframe 真预览**：
   - apps/app/components/editor/preview.tsx
   - <iframe src={`/api/preview?siteId=${id}&version=${v}`} />
   - postMessage 实时同步 DSL change 给 iframe
   - apps/app/app/api/preview/route.ts 渲染 storefront SectionRenderer

5. **AI Copilot 真接**：
   - apps/app/components/copilot/copilot-provider.tsx 把 fakeAssistant.ts 换成
     trpc.copilot.chat（services/api/src/routers/copilot.ts 接 LlmProvider）
   - 工具调用 confirmations 仍走 confirm UI
   - pgvector 长期记忆（schema 已有 AiConversation）

6. **爆品识别**（docs/MASTER.md §14）：
   - packages/ai-agents/src/agents/picker.ts (新) — rankProducts(products) → 3 候选
   - 在 conversation choosing_hero stage 自动调用，注入 expects.kind='product'

7. **CMS 富文本**：
   - apps/app/app/(app)/sites/[siteId]/pages/[id]/page.tsx 用 @forgely/ui Tiptap

## 验收
注册 → 登录 → 跳 /generate → 多轮对话 → confirm → 看到 generating 12 步 → 完成跳子域；
Theme Editor 改 DSL 字段 iframe 实时变；Copilot 在 dashboard 能问真问题（"上周营收？"）。

完成 → push + PR。
```

---

### 派给 my-mcp-7（W7 超级后台）— Sprint 3

```text
你是 Forgely W7 超级后台窗口。Sprint 3 目标：补 TeamMember + Refund 后实现真 finance/team；
Login as user 临时 token；新增 Marketing / Plugins / SystemHealth 三模块。

## 准备
git fetch origin && git pull origin main --rebase
git worktree add ../forgely-W7 -b feat/W7-sprint-3-super-complete origin/main
cd ../forgely-W7 && pnpm install
等 W3 schema migration 合并后再开始。

## 任务

1. **重写 super/team.ts 真实现**（W3 加完 TeamMember schema 后）：
   - list / invite / updateRole / remove
   - 邮件邀请用 services/api/src/email
   - OWNER 不能 demote / remove

2. **重写 super/finance.ts 真实现**（W3 加完 Refund + Stripe SDK 真接后）：
   - overview: 真 MRR / ARR / refundsPending / payouts
   - refundsQueue / approveRefund / denyRefund 真改 Refund 表 + 调 Stripe refund

3. **Login as user 临时 token**：
   - tRPC: super.users.requestLoginAs({ userId, reason }) → 给 user 发 inApp 通知 + 等待 30s grant
   - 用户授权后 Admin 拿 30 分钟有效的 impersonation JWT
   - 所有该 token 的请求 AuditLog 记 actorType='super_admin' + reason

4. **新增 /super/marketing**：
   - 邮件 campaigns 列表（Klaviyo / Mailchimp 接入）
   - 优惠券生成器（Coupon 表）
   - 群发推送（Webpush / 微信模板消息）

5. **新增 /super/plugins**：
   - 已安装插件审核（InstalledPlugin 表）
   - 开发者上传插件（V2，先做骨架）

6. **新增 /super/system-health**：
   - Sentry events（API key from env）
   - PostHog DAU
   - Cloudflare R2 storage usage
   - Postgres connection pool stats
   - AI API daily cost (DeepSeek/Qwen/Anthropic 三家)

## 验收
/super/team 能 invite / role-change / remove；/super/finance overview 显示真数据；
Login as user 30 分钟流程跑通；3 个新模块页面可访问。

完成 → push + PR。
```

---

### 派给 my-mcp-8（W8 合规 / SEO）— Sprint 3

```text
你是 Forgely W8 合规 / SEO 窗口。Sprint 3 目标：补完 ASA/CASL + 8 类品类规则 + 中国合规 4 法；
SEO DataForSEO 接入 + llms.txt 自动生成 + 百度站长 sitemap submit。

## 准备
git fetch origin && git pull origin main --rebase
git worktree add ../forgely-W8 -b feat/W8-sprint-3-compliance-seo origin/main
cd ../forgely-W8 && pnpm install

## 任务

1. **packages/compliance regional 补完**：
   - asa.ts (英国广告标准)
   - casl.ts (加拿大反垃圾邮件)

2. **packages/compliance category 8 类**：
   - health.ts (保健品: FDA disclaimer)
   - cosmetics.ts (化妆品: 成分表)
   - kids.ts (儿童: COPPA + age 标注)
   - food.ts (食品: 营养标签)
   - alcohol.ts (酒类: 21+ 警告)
   - cbd.ts (CBD: 州法规)
   - medical-device.ts (美瞳/美容仪)
   - electronics.ts (FCC ID)

3. **CN 平台合规**（docs/PIVOT-CN.md §8.1）：
   - rules/cn/ecommerce-law.ts
   - rules/cn/pipl.ts
   - rules/cn/advertising-law.ts (绝对化用语)
   - rules/cn/consumer-protection.ts (7 天无理由)

4. **packages/seo Sprint 3**：
   - sitemap.ts 自动按 SiteDsl 生成 + 提交到 Google + 百度站长平台 API
   - llmsTxt.ts 自动生成 llms.txt + llms-full.txt（精简 + 完整版）
   - keywordResearch.ts 接 DataForSEO REST API
   - apps/app/app/(app)/sites/[siteId]/seo/page.tsx 关键词热力图 + AI 一键优化

## 验收
真站 (toybloom.forgely.app) 跑 compliance scan 出 < 5 critical
+ < 20 warning；sitemap 提交百度站长成功；
DataForSEO 关键词查询 5 个真词 + 推荐成功。

完成 → push + PR。
```

---

### 派给 my-mcp-9（W9 / 新窗口 W11 — Medusa v2 后端）— Sprint 3

```text
你是 Forgely W11 Medusa v2 窗口（首次启动）。
Sprint 3 目标：services/medusa 真起 Medusa v2 + 多租户 sales_channel + 5 个自定义 ForgelyXxx Modules。

## 准备
cd ~/Desktop/Forgely
git fetch origin && git worktree add ../forgely-W11 -b feat/W11-sprint-3-medusa origin/main
cd ../forgely-W11 && pnpm install
pnpm dlx create-medusa-app@latest services/medusa --skip-db --no-browser

## 任务

1. **Medusa v2 init**（docs/MASTER.md §6）：
   - services/medusa/medusa-config.ts 配 PostgreSQL DATABASE_URL（共享 Forgely DB）
   - 启用 Modules: Product / Order / Customer / Cart / Inventory / Pricing / Payment / Fulfillment / Region / Discount

2. **多租户**（docs/MASTER.md §6.2）：
   - 每个 Forgely User → 1 个 sales_channel
   - Forgely User 创建时 hook 自动 create sales_channel + 写入 User.medusaSalesChannelId
   - 所有 Medusa API 调用强制 sales_channel_id filter

3. **5 个自定义 Modules**（docs/MASTER.md §6.4）：
   - ForgelyTenant Module — 租户管理 + 订阅状态同步
   - ForgelyAsset Module — 品牌素材关联
   - ForgelyTheme Module — 主题 DSL 存储 (引用 ThemeVersion)
   - ForgelyGen Module — 生成任务记录 (引用 Generation)
   - ForgelyAI Module — AI 对话历史 (引用 AiConversation)

4. **支付插件**：
   - medusa-payment-stripe (主)
   - medusa-payment-paypal
   - 自研 medusa-payment-wechat-pay (services/api/src/payments/wechat.ts wrap)
   - 自研 medusa-payment-alipay
   - 自研 medusa-payment-nowpayments (crypto)

5. **运费模板**（docs/MASTER.md §6.6）：
   - US 域内、US→EU、CN→US、EU 内 4 套预置

## 验收
services/medusa 真起在 :9000；apps/storefront 接 Medusa API 真 cart/checkout 跑通
test 模式 Stripe 支付。

完成 → push + PR。
```

---

### 派给 my-mcp-10（W12 — DevOps / 部署 / 监控）— Sprint 3

```text
你是 Forgely W12 DevOps 窗口（首次启动）。
Sprint 3 目标：阿里云 PolarDB + Redis 接入 + 阿里云 OSS R2 替代 + Sentry + PostHog + Better Stack +
启用 GitHub Actions CI。

## 准备
cd ~/Desktop/Forgely
git fetch origin && git worktree add ../forgely-W12 -b feat/W12-sprint-3-devops origin/main
cd ../forgely-W12 && pnpm install

## 任务

1. **CI 启用**：
   - 把 infra/ci/ci.yml.template 移回 .github/workflows/ci.yml（需要 user 给 PAT 加 workflow scope）
   - 加 stage：lint / typecheck / test / build / e2e Playwright (apps/web)
   - 加 main push trigger Cloudflare Pages preview deploy

2. **infra/ — Terraform**：
   - infra/terraform/aliyun/ — PolarDB-PG / Redis 标准版 / OSS / SLB / EdgeOne
   - infra/terraform/cloudflare/ — Pages / Workers / R2 / KV (用户独立站)
   - infra/docker/ — Dockerfile 给 services/api + services/medusa + services/worker

3. **监控接入**：
   - Sentry @sentry/nextjs 三端 init
   - PostHog @posthog/js apps/web + apps/app
   - Better Stack uptime 监控配 forgely.cn / app.forgely.cn / *.forgely.app

4. **环境变量集中管理**：
   - .env.template 列出所有 ENV (40+ keys)
   - infra/secrets/README.md 教用户填阿里云 / 腾讯云 / Cloudflare / Stripe / 微信开放平台 / 微信支付 / 支付宝 / DeepSeek / Qwen / Vidu / Kling / Flux / Meshy / SMS / Sentry / PostHog 凭据

5. **Docker Compose 本地 dev stack**：
   - infra/docker/compose.dev.yml — Postgres + Redis + MinIO (R2 兼容) 一键启动
   - 让所有窗口 `docker compose -f infra/docker/compose.dev.yml up -d` 即可

6. **部署脚本**：
   - scripts/deploy-staging.sh / deploy-prod.sh
   - 自动跑 prisma migrate deploy + Cloudflare Pages 部署

## 验收
docker compose up dev stack 启动；CI yaml 在 main push 跑绿；
Sentry 收到第一个测试 event；Plausible / PostHog 看到 DAU 数据。

完成 → push + PR。
```

---

## 三、推荐派发节奏

**Sprint 3（本周 / 下周）**：8 个窗口并行派发上述 8 段 Prompt
- 优先级 P0：W11 Medusa（解锁 storefront 真支付）+ W3 Schema 补全（解锁 W7）
- 优先级 P1：W6 真接 tRPC 数据 + W12 DevOps + 监控
- 优先级 P2：其余

**Sprint 4（再下周）**：
- W2 Storybook 上线 forgely.com/storebook
- W5 6 幕剧本 + Vidu 真视频
- 全链路 E2E：注册 → 登录 → 对话 → 生成 → 部署 → 海外消费者下单 → Stripe 收款

**Sprint 5（Beta）**：
- 招 30 个内测用户
- AI 成本预算监控
- 24h 客服响应

---

## 四、我（W1 主线）下一步做什么

继续守住 W1 范围 + 整合：
1. services/worker 真 BullMQ + Redis 启动 + 注册 runPipeline 为 job consumer
2. services/api/src/jobs/ 全套 cron / queued tasks
3. AgentEvent Redis Streams (docs/MASTER.md §5.3)
4. SSE / WebSocket 推 Generation step 进度给前端
5. 整合每轮其他窗口的 PR
