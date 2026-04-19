# Forgely AI 开发话术指南

> 本文档是**发给 AI(Claude Code)的标准开发 prompt 模板**。
> 你不需要懂代码,只需要在关键节点复制对应的 prompt 发给 AI,AI 会按文档执行。

---

## 目录

1. [使用说明](#1-使用说明)
2. [一次性初始化 Prompt](#2-一次性初始化-prompt)
3. [每个 Task 的标准 Prompt(30 个)](#3-每个-task-的标准-prompt)
4. [常见问题的 Prompt 模板](#4-常见问题的-prompt-模板)
5. [提交 PR / Review 的流程](#5-提交-pr--review-的流程)
6. [如何和 AI 沟通 Bug](#6-如何和-ai-沟通-bug)

---

## 1. 使用说明

### 1.1 前置工作(你自己要做的)

在开始发 prompt 前,先做这几件事:

1. **注册 GitHub 账号** → 创建一个 Private 仓库 `forgely/forgely-app`
2. **订阅 Claude Pro** ($20/月)→ 获得 Claude Code on the web 访问
3. **访问 claude.ai/code**,用 GitHub 登录并授权仓库
4. **把两份文档上传到仓库**:
   - `docs/MASTER.md`(本项目总文档)
   - `docs/AI-DEV-GUIDE.md`(本话术文档)
5. **GitHub 创建 30 个 Issues**,每个 Issue 对应一个 Task(后面会给模板)

### 1.2 整体使用节奏

```
你的工作流程:

周一到周五,每天花 30-60 分钟:
┌──────────────────────────────────────┐
│ 1. 看昨天 Claude 提交的 PR          │
│ 2. Review 代码(不懂就问 Claude)    │
│ 3. Merge 没问题的 PR                 │
│ 4. 发新的 Task Prompt 给 Claude      │
│ 5. Claude 在云端工作(关笔记本也行)│
└──────────────────────────────────────┘

周末:
- 整体运行测试
- 规划下周 Task
```

### 1.3 为什么这样设计

- **你不需要打开代码编辑器**,全程在 claude.ai/code 网页操作
- **Claude 会在云端自动干活**,不占用你电脑资源
- **每个 Task 独立**,一次一个 PR,容易 review
- **手机也能操作**(通勤时批准 PR)

---

## 2. 一次性初始化 Prompt

### 2.1 第一次用 Claude Code(跟它打招呼)

**打开 claude.ai/code,选中你的仓库,发第一条消息**:

```
你好 Claude,我们要从零开发一个 AI 建站 SaaS 产品叫 Forgely。

请先做一件事:完整阅读 docs/MASTER.md 这份开发文档(3500+ 行)。
读完后,用 5 段话总结这个项目:

1. 产品核心价值
2. 技术架构核心选型
3. 三端产品各自的角色
4. 开发优先级
5. 你读完最有疑问的 3 个地方

不要写任何代码,先让我确认你真的理解了项目。
```

**预期 Claude 回复**:读完后的精准总结。**如果总结不准,说明它没读透,让它重读**。

### 2.2 建立开发规范

**第二条消息**:

```
太好了,你理解得很准确。

现在建立几个开发规范,后续你要一直遵守:

【代码规范】
- TypeScript strict mode,禁止 any(除非有注释说明)
- 所有函数必须有 TSDoc 注释
- 所有 API route 必须有错误处理
- 所有表单用 React Hook Form + Zod

【提交规范】
- 每个 Task 一个独立 PR
- PR 标题格式:"[T_XX] 简短描述"
- PR 描述必须包含:
  - 做了什么(变更列表)
  - 为什么这样做(关键决策)
  - 如何测试(步骤)
  - 可能的风险

【沟通规范】
- 你不确定的技术选型,必须先问我确认,不要自己决定
- 遇到文档里没写清楚的,引用具体段落问我
- 有多个合理实现方案时,列出来让我选

【质量规范】
- 单元测试覆盖率 > 70%
- 所有新组件必须有 Storybook story
- Lighthouse 分数必须达标(见文档第 18 章)

确认你理解,然后我们开始 Task 1。
```

### 2.3 开始第一个 Task

**第三条消息**:

```
开始 Task 1:Monorepo 脚手架。

任务目标:
- 按 docs/MASTER.md 第 29 章的结构,创建 Turborepo monorepo
- 配置 pnpm workspaces
- 配置 TypeScript、ESLint、Prettier、Husky
- 3 个 apps 的占位骨架(web / app / storefront)
- 基础 packages 的空目录结构
- GitHub Actions CI 基础配置
- README 写好启动步骤

具体要求:
1. Node 20 LTS,pnpm 8+
2. Turborepo 最新稳定版
3. TypeScript 5.3+ strict
4. Next.js 14 App Router
5. 3 个 apps 能跑 dev(即使是空白页)

验收标准:
- [ ] 我 clone 下来 `pnpm install && pnpm dev` 能起来
- [ ] Turbo 管道配置正确
- [ ] CI 跑通(lint + typecheck)
- [ ] README 清晰

完成后提一个 PR,标题 "[T01] Monorepo 脚手架"。

如果你对任何要求有疑问,先问我,不要猜。
```

---

## 3. 每个 Task 的标准 Prompt

### Task 1:Monorepo 脚手架(已在 2.3 给出)

### Task 2:Design Tokens 包

```
开始 Task 2:Design Tokens 包。

任务目标:
创建 packages/design-tokens,定义整个 Forgely 的设计 token 系统。
三端(官网 + 用户后台 + 超级后台)都会用这个包。

具体要求:
1. 按 docs/MASTER.md 第 17 章的规范,定义所有 tokens:
   - colors(bg/border/text/forge/semantic/data)
   - fonts(display/heading/body/mono)
   - fontSize(fluid clamp)
   - spacing / radius / shadows / motion

2. 导出:
   - TypeScript 对象形式(JS 代码可 import)
   - Tailwind preset 配置(tailwind.config.js 直接用)
   - CSS variables(--forgely-bg-void 等,HTML/CSS 可直接用)

3. 字体加载:
   - 提供 FontProvider 组件
   - 支持 Next.js font 优化
   - Google Fonts 自动 preload

验收标准:
- [ ] 3 个 apps 都能 import tokens
- [ ] Tailwind 类名能用(如 bg-forge-orange)
- [ ] 字体在 Next.js 里正确加载
- [ ] Storybook 有一个 "Design Tokens" 页面展示所有 token

参考:
- docs/MASTER.md 17.2 - 17.4
- Vercel Geist Design System(作为参考)

完成后提 PR "[T02] Design Tokens 包"。
```

### Task 3:shadcn/ui 基础组件

```
开始 Task 3:引入 shadcn/ui 并创建共享 UI 包。

任务目标:
在 packages/ui 里引入 shadcn/ui 所有基础组件,
并根据 Forgely 的 Design Tokens 定制。

具体要求:
1. 引入 shadcn/ui(不是安装 npm 包,是把源码复制到 packages/ui/src)
2. 按 docs/MASTER.md 32.2 的 P0 清单全部引入:
   - Button, Input, Textarea, Select
   - Card, Badge, Dialog, Drawer, Sheet
   - Dropdown, Tooltip, Toast(Sonner)
   - Table, Tabs, Form, Stepper
   - Avatar, Pagination, Empty State
   - Command Menu(⌘K)
   - 共 20+ 组件

3. 所有组件必须:
   - 深色模式优先(匹配我们的 Cinematic Industrial 风格)
   - 使用 Design Tokens(不要写死颜色)
   - 支持 forwardRef
   - 有完整 TSDoc

4. 为每个组件写 Storybook story:
   - Default state
   - All variants
   - Dark mode(默认)
   - Interactive example

验收标准:
- [ ] 所有 20+ 组件都能在 Storybook 看到
- [ ] 三端 apps 都能 import 这些组件
- [ ] 无 console warning / error

完成后提 PR "[T03] shadcn 基础组件"。
```

### Task 4:Aceternity + Magic UI 组件

```
开始 Task 4:引入 Aceternity UI 和 Magic UI 的关键动效组件。

任务目标:
把高质量动效组件抄到 packages/ui,供官网和用户后台使用。

具体要求:
按 docs/MASTER.md 32.2 的 P1 和 P2 清单引入:

从 Aceternity UI(https://ui.aceternity.com):
- 3D Card Effect
- Sticky Scroll Reveal
- Bento Grid
- Spotlight
- Text Generate Effect
- Hero Parallax
- Canvas Reveal Effect
- Infinite Moving Cards

从 Magic UI(https://magicui.design):
- Marquee(无限滚动)
- Border Beam
- Shine Border
- Number Ticker(数字滚动)
- Animated Beam(连线动画)

所有组件:
- 深色模式适配
- 使用 Design Tokens
- Storybook story
- 移动端响应式

验收标准:
- [ ] 所有组件在 Storybook 可见
- [ ] 动效流畅(60fps)
- [ ] 无性能问题

完成后提 PR "[T04] 动效组件库"。
```

### Task 5:数据库 Schema + Prisma

```
开始 Task 5:数据库 Schema。

任务目标:
按 docs/MASTER.md 第 30 章的 Prisma Schema,建立完整数据模型。

具体要求:
1. 创建 services/api(Node.js + tRPC 服务)
2. 按文档 30.1 的 Schema 创建 prisma/schema.prisma
3. 所有模型完整实现:
   - User, Site, ThemeVersion, Generation
   - VisualDNA, BrandKit, MediaAsset
   - AiConversation
   - UserCredits, CreditTransaction, CreditsPackage
   - Subscription, InstalledPlugin
   - Page, ScraperRule, ScrapeHistory
   - AuditLog, ComplianceRecord
4. 所有必要的索引
5. 初始化 migration
6. 写 seed 脚本:
   - 10 个预设 VisualDNA
   - 4 个积分包
   - 1 个 test 超级管理员

验收标准:
- [ ] prisma migrate dev 成功
- [ ] prisma db seed 填充 10 个 DNA + 积分包
- [ ] Prisma Client 类型正确生成

完成后提 PR "[T05] 数据库 Schema"。
```

### Task 6:认证系统

```
开始 Task 6:认证系统。

任务目标:
实现用户注册、登录、会话管理。

技术选型:
- NextAuth.js(Auth.js v5)
- 支持:Email/Password + Google OAuth
- JWT session
- 超级后台强制 2FA(暂时先做框架,2FA 后续 Task)

具体要求:
1. 在 apps/app 里配置 NextAuth
2. 登录页(/login)、注册页(/signup)
3. OAuth 回调处理
4. 中间件保护需要登录的路由(/app/*、/super/*)
5. Session 注入 tRPC context
6. 登出功能

注意:
- 超级后台 /super 只允许 role='super_admin' 访问
- 所有登录事件记录到 AuditLog

验收标准:
- [ ] 能注册、登录、登出
- [ ] Google 登录能用
- [ ] 权限保护生效
- [ ] AuditLog 有记录

完成后提 PR "[T06] 认证系统"。
```

### Task 7:官网 MVP(第一版)

```
开始 Task 7:官网 MVP。

任务目标:
在 apps/web 做出一个能收 waitlist 的简版官网,挂到 forgely.com。

MVP 页面结构(7 段,简化版):
1. Sticky Navigation
2. Hero(纯视频或静图 + 文案,不做 3D)
3. Social Proof(假数据,后期替换)
4. 3 个 Value Props
5. 简化 Pricing(4 档卡片)
6. Final CTA
7. Footer

关键文案(照抄):
- 主标题:"Brand operating system for the AI era."
- 副标题:"Forge cinematic brand sites from a single link."
- 主 CTA:"Start Forging"

视觉要求:
- 深色基底(bg-void)
- Forge Orange 为主品牌色
- Inter Display 为 Heading
- Fraunces 为 Display(Hero 主标题)
- 所有动效克制而精准

Hero 视觉(MVP 版用视频):
- 占位视频:用 Pexels 上找一个"工坊/锻造/夕阳"场景
- 后期 Task 27 再做真 3D

技术要求:
- Next.js 14 App Router
- Lighthouse 桌面 ≥ 95 / 移动 ≥ 85
- 完整 SEO 标签 + Schema
- Waitlist 表单存入 DB(Waitlist 表)

验收标准:
- [ ] 所有 7 段完成
- [ ] 响应式(Desktop/Tablet/Mobile)
- [ ] Lighthouse 达标
- [ ] Waitlist 能收邮箱

完成后提 PR "[T07] 官网 MVP"。
```

### Task 8:Scraper Shopify Adapter

```
开始 Task 8:Shopify Scraper Adapter。

任务目标:
实现第一个也是最重要的爬虫适配器。

创建位置:
packages/scraper/src/adapters/shopify.ts

核心逻辑(参考 docs/MASTER.md 第 7 章):

1. canHandle(url):
   - 检测 URL 是否是 Shopify 站
   - 请求 /products.json 看返回格式
   - 返回 true/false

2. scrape(url):
   - 分页抓取全部商品(GET /products.json?page=N&limit=250)
   - 抓取 collections(/collections.json)
   - 截图首页 + 一个商品页 + 一个分类页(用 Playwright)
   - 标准化为 ScrapedData 格式

3. 数据标准化:
   - 按 ScrapedData 接口返回
   - 图片下载到 R2(/scrapes/{siteId}/)
   - 所有价格统一为 USD 分

4. 错误处理:
   - 账号私有 → 返回 UnauthorizedError
   - 不存在 → NotFoundError
   - 超时 → TimeoutError

5. 写单元测试:
   - 用 MSW 模拟 Shopify API
   - 测试分页、错误、边界情况

验收标准:
- [ ] 能成功抓 3 个真实 Shopify 店(找开源的测试)
- [ ] 单元测试覆盖率 > 80%
- [ ] 返回的 ScrapedData 符合类型

完成后提 PR "[T08] Shopify Scraper"。
```

### Task 9:Scraper WooCommerce Adapter

```
开始 Task 9:WooCommerce Scraper Adapter。

任务目标:
支持 WooCommerce 店铺抓取(WordPress 插件)。

复杂点:
- WC REST API 需要认证
- 不是所有店都开放 Storefront API
- 有 3 种抓取策略,按顺序尝试:
  A. Storefront API(如果开启)
  B. 爬 /shop/ 页面(HTML 解析)
  C. 要求用户提供 API key

创建位置:
packages/scraper/src/adapters/woocommerce.ts

具体要求:
1. canHandle:检测 WordPress + WooCommerce
2. 多策略降级
3. 数据标准化为同一 ScrapedData 格式
4. 单元测试

验收标准:
- [ ] 能抓 3 个真实 WC 店
- [ ] 策略降级生效
- [ ] 类型安全

完成后提 PR "[T09] WooCommerce Scraper"。
```

### Task 10:Analyzer Agent

```
开始 Task 10:Analyzer Agent(品牌与视觉分析)。

任务目标:
把 Scraped 数据 + 截图 → 结构化的 BrandProfile。

创建位置:
packages/ai-agents/src/agents/analyzer.ts

核心流程(参考 docs/MASTER.md 第 5.1、12 章):

输入:ScrapedData
输出:BrandProfile

步骤:
1. Claude Vision 分析首页截图:
   - 视觉质量 1-10
   - 品牌调性关键词
   - 色彩提取
   - 字体风格识别
   - 弱点列表

2. Claude 文本分析商品描述:
   - 品牌调性(tone)
   - 价格段
   - 目标客群
   - 参考品牌(最多 5 个)

3. 综合分析 → BrandProfile:
   {
     visualQuality: number,
     brandArchetype: string,
     category: string,
     priceSegment: string,
     referenceBrands: string[],
     toneOfVoice: string[],
     targetCustomer: {...},
     recommendedDNA: string,  // 对应 10 个预设之一
     opportunity: string
   }

4. 消耗积分:内部记录,不直接从用户扣

验收标准:
- [ ] 给 5 个真实店,输出的 BrandProfile 合理
- [ ] recommendedDNA 准确率 > 80%
- [ ] 单元测试(mock Claude API)

完成后提 PR "[T10] Analyzer Agent"。
```

### Task 11:10 个视觉 DNA 预设

```
开始 Task 11:10 个视觉 DNA 预设。

任务目标:
按 docs/MASTER.md 附录 A,完整定义 10 个 Visual DNA。

创建位置:
packages/visual-dna/src/presets/

文件结构:
packages/visual-dna/src/
├── index.ts
├── types.ts(VisualDNA 接口定义)
├── presets/
│   ├── kyoto_ceramic.ts
│   ├── clinical_wellness.ts
│   ├── playful_pop.ts
│   ├── nordic_minimal.ts
│   ├── tech_precision.ts
│   ├── editorial_fashion.ts
│   ├── organic_garden.ts
│   ├── neon_night.ts
│   ├── california_wellness.ts
│   └── bold_rebellious.ts
└── utils/
    ├── matchDNA.ts(根据 BrandProfile 匹配最合适的 DNA)
    └── buildPrompt.ts(把 DNA 转成 Kling prompt 片段)

每个 DNA 必须包含(严格按 docs/MASTER.md 10.3):
- id, name, description
- colors(完整色板)
- fonts(display/heading/body/mono)
- cameraLanguage
- colorGrade
- lighting
- texture
- composition
- promptBuilder(styleKeywords/negativeKeywords/technicalSpecs)

每个 DNA 准备:
- 1 张参考图(放 public/dna-references/)
- 对应的示例站 URL(参考真实品牌)

验收标准:
- [ ] 10 个 DNA 完整实现
- [ ] matchDNA() 函数能正确推荐
- [ ] buildPrompt() 生成的 prompt 片段合理
- [ ] seed 数据已导入 DB

完成后提 PR "[T11] 10 个视觉 DNA"。
```

### Task 12:10 个 Moment Prompt 库

```
开始 Task 12:10 个 Product Moment Prompt 库。

任务目标:
按 docs/MASTER.md 第 11 章和附录 B,定义 10 种 Moment 类型。

创建位置:
packages/product-moments/src/

文件结构:
packages/product-moments/src/
├── index.ts
├── types.ts
├── templates/
│   ├── m01_liquid_bath.ts
│   ├── m02_levitation.ts
│   ├── m03_light_sweep.ts
│   ├── m04_breathing_still.ts
│   ├── m05_droplet_ripple.ts
│   ├── m06_mist_emergence.ts
│   ├── m07_fabric_drape.ts
│   ├── m08_ingredient_ballet.ts
│   ├── m09_surface_interaction.ts
│   └── m10_environmental_embed.ts
└── utils/
    ├── selectMoment.ts(产品 + DNA → Moment)
    └── buildKlingPrompt.ts(Moment + 产品 → Kling prompt)

每个 Moment 模板包含:
- id
- name  
- description
- 适合品类
- basePrompt(含占位符)
- variations(3-5 个变体)
- cameraHints
- durationSec(6-8 秒)
- loopStrategy
- failureFallback(失败时降级到哪个 Moment)
- 参考视频 URL(放 public/moment-references/)

selectMoment() 函数:
输入:ProductData + VisualDNA + BrandProfile
输出:推荐的 MomentType

buildKlingPrompt() 函数:
输入:Moment + Product + DNA + Variation index
输出:完整 Kling prompt

验收标准:
- [ ] 10 个 Moment 完整
- [ ] selectMoment() 准确率 > 85%(给 20 个测试案例)
- [ ] 生成的 prompt 在 Kling 上能跑通(手动测试 5 个)

完成后提 PR "[T12] 10 个 Moment 库"。
```

### Task 13-17:Director / Planner / Copywriter / Artist / Compiler Agents

```
开始 Task 13:Director Agent。

任务目标:
为每个 Product Moment 生成完整导演剧本。

创建位置:
packages/ai-agents/src/agents/director.ts

输入:BrandProfile + DNA + Moment + Product
输出:DirectorScript(详细分镜 + 完整 Kling prompt)

使用 Claude Opus(它是创意导演)

Prompt 模板(严格按 docs/MASTER.md 5.1 和 11 章)

完成后提 PR "[T13] Director Agent"。

---

Task 14:Planner Agent + SiteDSL

任务目标:
生成完整的 SiteDSL(整站蓝图)。

创建位置:
packages/dsl + packages/ai-agents/src/agents/planner.ts

SiteDSL 结构:
- 6 段首页的每段配置
- 产品页、关于页、FAQ 页结构
- SEO 元数据
- 所有文案需求
- 所有素材需求

完成后提 PR "[T14] Planner Agent"。

---

Task 15:Copywriter Agent

创建位置:packages/ai-agents/src/agents/copywriter.ts
用 Claude Sonnet 写所有文案:
- Hero 标题、副标题、CTA
- 3 个 Value Props 文案
- 产品描述优化
- Brand Story
- FAQ
- SEO title/description

完成后提 PR "[T15] Copywriter"。

---

Task 16:Artist Agent(Flux + Kling + Meshy)

创建位置:packages/ai-agents/src/agents/artist.ts

整合多个模型 API:
- Flux 1.1 Pro(图片)
- Flux Kontext(保留主体换风格)
- Ideogram 3.0(Logo / 含文字)
- Kling 2.0(视频)
- Runway Gen-4(视频备用)
- Meshy(3D,可选)

统一接口:generateAsset({type, prompt, referenceImage?})
自动降级链
自动重试

完成后提 PR "[T16] Artist Agent"。

---

Task 17:Compiler + Deployer

创建位置:packages/dsl/src/compiler + services/deploy

Compiler:
- SiteDSL + 素材 → Next.js 项目源码
- 所有 Section 组件实例化
- Medusa API 连接配置
- 环境变量注入

Deployer:
- 通过 Cloudflare API 创建 Pages 项目
- 推送代码
- 分配子域名
- 配置 SSL
- Medusa tenant 初始化
- 商品导入

完成后提 PR "[T17] Compiler + Deployer"。
```

### Task 18-23:用户后台相关

```
Task 18:用户后台 Dashboard + Products

参考 docs/MASTER.md 19 章和 v1.1 详细设计。

创建:
- apps/app/app/dashboard/page.tsx
- apps/app/app/sites/[siteId]/products/page.tsx
- apps/app/app/sites/[siteId]/products/[id]/page.tsx

特性:
- Dashboard 4 大核心指标 + 趋势图 + AI 建议
- Products 列表 TanStack Table
- Products 详情含 AI 辅助按钮
- 实时预览 iframe

完成后提 PR "[T18] 后台 Dashboard + Products"。

---

Task 19:订单 / 客户管理

创建对应页面,集成 Medusa 订单 API。

完成后提 PR "[T19] 订单客户"。

---

Task 20:Media Library + BrandKit

参考 docs/MASTER.md 22 章。
完整的品牌资产系统。

完成后提 PR "[T20] BrandKit"。

---

Task 21:Theme Editor(可视化模式)

参考 docs/MASTER.md 23 章。
三栏布局:页面树 + iframe 预览 + 属性面板
拖拽排序(dnd-kit)
版本历史
多设备预览

完成后提 PR "[T21] Theme Editor Visual"。

---

Task 22:Theme Editor(AI 对话模式)

接 Claude,解析自然语言 → 修改 DSL
postMessage 实时刷新预览
消耗积分

完成后提 PR "[T22] Theme Editor AI"。

---

Task 23:AI Copilot(常驻后台)

参考 docs/MASTER.md 24 章。
右下角浮窗 + Drawer
上下文感知
Tool Use(定义 20+ tools)
写操作确认
长期记忆(pgvector)

完成后提 PR "[T23] AI Copilot"。
```

### Task 24-26:积分 + 超级后台

```
Task 24:积分系统 + Stripe 集成

参考 docs/MASTER.md 25 章、3.6、3.8 节。

实现:
- UserCredits + CreditTransaction CRUD
- consumeCredits() 事务安全
- 预扣 / 提交 / 释放机制
- Stripe 订阅 checkout + webhook
- 4 个积分包 checkout + webhook
- 账单页 UI
- 积分历史页 UI
- 防滥用(单次上限、每日上限、速率限制)

完成后提 PR "[T24] 积分系统"。

---

Task 25:Super Admin - Overview

参考 docs/MASTER.md 20.5 节。

创建:
- apps/app/app/super/layout.tsx(强制 super_admin)
- apps/app/app/super/page.tsx(Overview)
- 实时数据流(WebSocket 或 SSE)
- MRR/ARR/DAU 等指标
- 告警面板
- 活动流

视觉:NASA Mission Control 风,青色强调,Mono 字体

完成后提 PR "[T25] Super Admin Overview"。

---

Task 26:Super Admin - Users / Finance / Audit

创建:
- /super/users - 用户列表 + 详情 + Login as user
- /super/finance - Stripe 对账 + 积分日志
- /super/audit - 审计日志查询

Login as user 流程(需要用户授权,见 docs/MASTER.md 20.3)

完成后提 PR "[T26] Super Admin 核心"。
```

### Task 27:官网升级到 Terminal 级

```
Task 27:官网 Terminal 级升级。

任务目标:
把 Task 7 的 MVP 官网升级到 Terminal.industries 那种电影级水准。

关键升级:
1. Hero:真 3D 场景(R3F)或预渲染高质量视频
2. 6 幕滚动剧本(600vh,详细见 docs/MASTER.md 18.4)
3. Showcase 网格(真实案例 + hover 播视频)
4. How it works(滚动触发的 5 步演示)
5. Interactive Demo(真可试的对话)
6. Testimonials 瀑布流

技术:
- GSAP ScrollTrigger + Lenis
- R3F + Drei
- Theatre.js(可选,相机路径)
- 所有视频 AV1 + H.265
- Lighthouse 桌面 ≥ 95

素材准备:
需要提前用 Kling 生成:
- Hero 3D 场景视频(8-10s)
- 6 幕过渡视频
- 2-3 段客户证言视频(可先用占位)

这个 Task 分成 3 个小 PR:
- T27a:6 幕结构 + 滚动
- T27b:Hero 3D / 视频
- T27c:Showcase + Demo + Testimonials

完成后提 PR "[T27] 官网升级"。
```

### Task 28-30:深度功能

```
Task 28:多源 Scraper 扩展

按 docs/MASTER.md 第 7 章的 Tier 2 清单,再实现:
- Amazon Adapter(需 ScraperAPI)
- AliExpress Adapter
- Etsy Adapter
- GenericAIAdapter(兜底 AI 学规则)

完成后提 PR "[T28] Scraper 扩展"。

---

Task 29:Compliance Agent

按 docs/MASTER.md 第 15 章实现:
- 合规规则库(FTC/FDA/GDPR/CPSIA 等)
- 品类特殊规则(保健品/儿童/食品等)
- ComplianceReport 生成
- UI:审查结果页 + AI 一键修复

完成后提 PR "[T29] Compliance"。

---

Task 30:SEO / GEO 完整实现

按 docs/MASTER.md 第 16 章实现:
- sitemap.xml 自动生成
- Schema.org 完整(Organization/Product/FAQ/Breadcrumb/Review)
- llms.txt + llms-full.txt
- 关键词研究(DataForSEO 集成)
- SEO 分数可视化

完成后提 PR "[T30] SEO/GEO"。
```

---

## 4. 常见问题的 Prompt 模板

### 4.1 当你想改主意

```
我想调整 Task X 的需求。

原本是:[原需求]
改为:[新需求]

理由:[为什么改]

请:
1. 不要直接开始改代码
2. 先告诉我这个改动会影响哪些已完成的 Task
3. 估算工作量
4. 如果有更好的实现方案,给我建议
然后等我确认再动手。
```

### 4.2 当你看不懂 Claude 的回复

```
你刚才说的 "[粘贴 Claude 说的话]" 我没看懂。

请:
1. 用中文给我解释(假设我是产品经理,不是程序员)
2. 用生活化的比喻
3. 如果有图能画就画
4. 告诉我这个决策的影响(好的坏的)
```

### 4.3 当你想让 Claude 帮你 review 代码

```
在你 merge PR #XX 之前,请帮我 review 一下。

从这几个角度:
1. 代码是不是按文档要求做的?
2. 有没有安全问题?
3. 有没有性能问题?
4. 代码可读性怎么样?
5. 测试覆盖够不够?

用中文告诉我结论。如果都 OK,我就 merge。
```

### 4.4 当你发现 AI 跑偏了

```
停,你好像偏离了文档的要求。

原本 docs/MASTER.md 第 X 章说要:[原本要求]
但你现在做的是:[做成的样子]

差异在:[具体差异]

请:
1. 不要继续往下做
2. 回到文档要求
3. 如果你觉得文档有问题,告诉我为什么,我来决定是改文档还是改做法
```

### 4.5 当积分/钱快花光了

```
我看了一下 AI Operations,Claude API 本月花费已经 [$X],
预算只剩 [$Y]。

请:
1. 分析接下来的 Task 里,哪些最费 API
2. 给我一个省钱方案:
   - 哪些能用 Sonnet 代替 Opus
   - 哪些能缓存
   - 哪些能批量处理
3. 不影响 MVP 交付
```

### 4.6 当你要上线了

```
我们准备发布 Beta 版本。

请帮我做上线前 Checklist:
1. 所有 P0 Task 完成了吗?
2. 有没有未修复的 critical bug?
3. 性能指标达标吗?(LCP/INP/CLS)
4. 安全检查做了吗?(SQL注入/XSS/CSRF)
5. SEO 基础项做了吗?
6. 监控(Sentry/PostHog)接入了吗?
7. 法律页面(Privacy/TOS/DSA)写好了吗?
8. 支付流程测试过了吗?
9. 有回滚方案吗?
10. 客服工单能跑了吗?

给我一个详细的 Go/No-Go 报告。
```

---

## 5. 提交 PR / Review 的流程

### 5.1 Claude 提 PR 后,你做什么

**步骤**:

1. **看 PR 标题和描述**(2 分钟)
   - 标题格式对吗?
   - 描述清楚做了什么吗?

2. **看文件变更列表**(3 分钟)
   - 没改不该改的地方吗?
   - 文件数量合理吗?(一个 Task 一般 5-30 个文件)

3. **看关键文件的代码**(5-15 分钟)
   - 看不懂就问 Claude 解释
   - 重点看:业务逻辑、安全相关、数据库操作

4. **测试部署预览**(5-10 分钟)
   - Claude 应该给出 preview URL
   - 手动试一下核心功能

5. **决定**:
   - ✅ 合格 → Merge
   - ⚠️ 小问题 → Request changes,列出问题
   - ❌ 大问题 → Close PR,让 Claude 重做

### 5.2 Merge 模板

```
LGTM, merging.

下一步:[提下一个 Task]
```

### 5.3 Request Changes 模板

```
整体不错,但有几个小问题需要改:

1. [具体问题 1]
   位置:[文件路径:行号]
   改为:[你想要的样子]

2. [具体问题 2]
   ...

改完后重新推,我再 review。
```

---

## 6. 如何和 AI 沟通 Bug

### 6.1 发现 Bug 时

```
我发现一个 Bug。

【现象】
[描述你看到什么不对]

【复现步骤】
1. 我打开 xxx 页面
2. 我点了 xxx 按钮
3. 期望看到 xxx
4. 实际看到 xxx

【环境】
- 浏览器:Chrome 125
- 设备:iPhone 15 / MacBook
- 时间:2026-04-20 10:30

【附加信息】
- 截图:[如果有]
- 控制台错误:[复制粘贴]
- Network 请求:[如果有]

请:
1. 先不要改代码
2. 告诉我你的诊断
3. 给我 2-3 个修复方案,我选
4. 估算改完需要多久
```

### 6.2 紧急 Bug(生产环境)

```
【紧急】生产环境 Bug!

影响:[多少用户受影响]
严重度:[P0 阻塞 / P1 严重 / P2 一般]

现象:
[详细描述]

请立即:
1. 先热修(hotfix),不要重构
2. 改完直接推到 main,不走 review
3. 修完后写事后报告(post-mortem)
4. 给改进方案避免再犯
```

---

## 附:一键启动 Forgely 的总 Prompt

**如果你想"一劳永逸"地让 AI 知道项目全貌,发这个**:

```
你好 Claude,我们要从零开发一个 AI 建站 SaaS 叫 Forgely。

【你的角色】
你是 Forgely 的首席工程师 + 产品经理 + 设计师。
我是创始人(不写代码,但懂产品和市场)。

【开发模式】
- 全程在 Claude Code on the web 工作
- 每个 Task 提一个 PR,我 review 后 merge
- 你可以在云端并行多个 Task

【必读文档】
docs/MASTER.md - 完整产品与技术文档(3500 行,必须读完)
docs/AI-DEV-GUIDE.md - 你和我的协作规范(本文档)

【你的任务】
按 docs/MASTER.md 第 33 章的 20 周计划,
从 Task 1 开始逐个执行。

【沟通规则】
1. 做决策前必须先问我确认
2. 不确定的地方,引用具体文档段落问
3. 有多个方案,列出让我选
4. 技术术语用大白话解释给我听
5. 每完成一个 Task 提一个独立 PR

【质量红线】
1. TypeScript strict,禁止 any
2. 测试覆盖率 > 70%
3. 所有组件有 Storybook
4. Lighthouse 分数达标
5. 严格按 Design Tokens,不写死颜色

【禁止】
1. 不要跳过 Task 顺序(除非我授权)
2. 不要修改 docs/MASTER.md(只有我能改)
3. 不要合并到 main(只有我能 merge)
4. 不要擅自改架构(先问我)

现在:
1. 完整读 docs/MASTER.md 和 docs/AI-DEV-GUIDE.md
2. 读完后,用中文给我 5 段总结
3. 然后等我的指令开始 Task 1

准备好了吗?
```

---

## 结尾

**记住 3 件事**:

1. **你是老板,不是员工**
   AI 是工具,你是决策者。它问你问题时认真回答,它跑偏时及时拉回。

2. **文档是圣经**
   所有开发都必须符合 docs/MASTER.md。AI 说"这样更好"时,你要判断是真的更好还是它想偷懒。

3. **慢就是快**
   第一周扎实搭好基础设施,比赶进度强 100 倍。bug 早发现 1 天,省 10 天调试。

---

**开始你的 Forgely 旅程吧。🔨**

有任何问题,就用上面的 prompt 模板问 AI。卡住了就休息,第二天再继续。

Claude Code 在云端 24/7 工作,你在手机上也能批准 PR。

**Your brand is one link away.**
