# Forgely 开发文档 v1.2 FINAL

> **版本**:v1.2 FINAL
> **日期**:2026-04-19
> **状态**:锁定版,开始开发
> **说明**:本文档是 Forgely 项目的唯一权威开发文档。v1.0 + v1.1 + 所有后续决策全部整合进来。AI 开发助手必须完整阅读本文档后再动手开发。

---

## 核心产品定义(一句话)

**Forgely** = 品牌时代的 AI 操作系统。用户粘贴任何电商平台 URL 或描述想法,AI 通过多轮对话理解品牌,生成带电影级视频/3D 的艺术级独立站,托管在 Forgely 平台,5 分钟上线欧美市场。

**Slogan**:Brand operating system for the AI era.

**对标**:
- 表面对标:Shopify + Atlas AI + Lovable
- 真正对标:Aesop / BIOLOGICA / Terminal.industries 的视觉水准

**核心壁垒**:AI + 美学 + 交互 + 3D/视频 + 完整电商栈

---

## 目录

### 第一部分:产品定义
1. [产品定位与核心决策](#1-产品定位与核心决策)
2. [目标用户与市场](#2-目标用户与市场)
3. [商业模式与付费体系](#3-商业模式与付费体系)

### 第二部分:技术架构
4. [总体技术架构](#4-总体技术架构)
5. [AI Agent 编排系统](#5-ai-agent-编排系统)
6. [Medusa v2 电商后端](#6-medusa-v2-电商后端)
7. [多源 Scraper 系统](#7-多源-scraper-系统)
8. [多租户架构](#8-多租户架构)
9. [部署与基础设施](#9-部署与基础设施)

### 第三部分:生成系统
10. [视觉 DNA 系统(10 个预设)](#10-视觉-dna-系统)
11. [Product Moment 系统(10 种类型)](#11-product-moment-系统)
12. [AI 对话分析引擎](#12-ai-对话分析引擎)
13. [端到端生成 Pipeline](#13-端到端生成-pipeline)
14. [爆品识别系统](#14-爆品识别系统)
15. [合规审查 Agent](#15-合规审查-agent)
16. [SEO + GEO 内化](#16-seo--geo-内化)

### 第四部分:三端产品
17. [统一视觉品牌系统](#17-统一视觉品牌系统)
18. [对外官网(Forgely.com)](#18-对外官网)
19. [用户后台(app.forgely.com)](#19-用户后台)
20. [超级后台(/super)](#20-超级后台)
21. [生成的独立站模板](#21-生成的独立站模板)

### 第五部分:核心功能模块
22. [品牌资产系统](#22-品牌资产系统)
23. [主题编辑器](#23-主题编辑器)
24. [AI Copilot(后台助手)](#24-ai-copilot)
25. [积分系统](#25-积分系统)
26. [插件市场](#26-插件市场)
27. [CMS 与内容管理](#27-cms-与内容管理)
28. [支付系统](#28-支付系统)

### 第六部分:工程与交付
29. [Monorepo 工程结构](#29-monorepo-工程结构)
30. [数据库完整 Schema](#30-数据库完整-schema)
31. [API 设计规范](#31-api-设计规范)
32. [组件库建设](#32-组件库建设)
33. [20 周 MVP 开发计划](#33-20-周-mvp-开发计划)
34. [Task 清单(给 AI 执行)](#34-task-清单)
35. [风险点与应对](#35-风险点与应对)

### 附录
- [附录 A:10 个视觉 DNA 详细规格](#附录-a)
- [附录 B:10 种 Product Moment Prompt 库](#附录-b)
- [附录 C:Kling/Runway/Flux 最优 Prompt](#附录-c)
- [附录 D:积分消耗完整清单](#附录-d)
- [附录 E:端到端数据流示例](#附录-e)

---

# 第一部分:产品定义

## 1. 产品定位与核心决策

### 1.1 产品是什么

Forgely 是一个 **AI 驱动的品牌独立站生成与运营 SaaS 平台**。用户通过 3 种方式输入品牌信息:
1. 粘贴现有店铺 URL(Shopify、WooCommerce、Amazon、AliExpress、Etsy、1688、天猫等)
2. 上传产品图片 + 描述
3. 仅用文字描述品牌想法

系统通过 AI Agent 群协作,自动完成:
- 商品抓取与结构化
- 品牌调性分析(Vision + Text 双模态)
- 视觉 DNA 匹配(10 个预设 DNA)
- Hero 视觉生成(视频/3D 双方案)
- 整站 6 段结构生成
- 合规审查与优化
- SEO + GEO 内化
- 部署上线

### 1.2 核心差异化(5 个)

**1. 整站协调的视觉 DNA**
不是"hero 放个视频就完了",而是从顶到底 6 段内容共享同一套电影语言(色调、节奏、质感、构图)。

**2. 电影级 Product Moment**
Hero 不是叙事广告片(错误方向),而是 6-8 秒 loop 的"产品完美瞬间"(对标 Recess、Rhode、Aesop 官网)。10 种 Moment 类型,AI 自动为产品选型。

**3. 视频 / 3D 双方案用户自选**
- 视频方案(默认,Free+):Kling 2.0 生成,所有用户可用
- 3D 方案(Pro+ 解锁):Meshy + R3F,滚动交互

**4. 全栈电商,不是前端壳**
Medusa v2 作为真正的电商后端。用户生成的不是 Landing Page,是真能卖东西的独立站:商品管理、订单、库存、支付、物流、发票全栈。

**5. AI Copilot 常驻后台**
用户发布后,后台右下角的 AI 顾问能:查数据、改内容、调主题、生成素材、给营销建议。是真能操作的 Agent,不是聊天机器人。

### 1.3 核心决策锁定清单

所有关键决策(本文档不再更改):

| 决策项 | 锁定值 |
|---|---|
| 目标用户 | Persona A(中国工厂出海)+ Persona C(欧美小 DTC)|
| 电商后端 | Medusa.js v2.0 |
| 前端框架 | Next.js 14 App Router |
| 样式系统 | Tailwind CSS + shadcn/ui |
| 3D 技术 | React Three Fiber + Drei + Theatre.js |
| 动画 | Framer Motion + GSAP ScrollTrigger + Lenis |
| 部署 | Cloudflare Pages + Workers + R2 |
| 数据库 | PostgreSQL + Redis |
| MVP 语言 | 英文优先,后续加 DE/FR/ES/PT |
| 目标市场 | 欧美(US + EU + UK + CA) |
| 支付主力 | Stripe + PayPal + NOWPayments(crypto) |
| 视频生成 | Kling 2.0(首选)+ Runway Gen-4(备选) |
| 图像生成 | Flux 1.1 Pro + Flux Kontext + Ideogram 3.0 |
| 3D 生成 | Meshy(首选)+ Tripo(备选) |
| 主 LLM | Claude Opus 4.7(Planner)+ Sonnet(其他) |
| 视觉风格 | Cinematic Industrial(Terminal 风) |
| 付费模型 | 订阅 + 积分 + 一次性服务三层 |
| 免费层 | 500 积分 + 可发布带水印 .forgely.app |
| Starter | $29/月(年付省 25%) |
| Pro(主力) | $99/月(年付省 25%) |
| Agency | $299/月(年付省 25%) |
| Enterprise | Custom($2,000+/月,不公开) |
| 年付折扣 | 3 个月免费(25% off) |
| 开发周期 | MVP 20 周 |

---

## 2. 目标用户与市场

### 2.1 两类核心用户

**Persona A:中国工厂品牌主(出海型)**
- 画像:30-50 岁,珠三角/长三角工厂主,想做自己的欧美品牌
- 痛点:英文差、不懂欧美审美、不会前端、不懂 SEO、缺合规知识
- 需求:
  - 中文界面(v2 加,MVP 英文)
  - 超强 AI 自动化(几乎不用思考)
  - 跨境合规自动指引(FTC、CPSIA、GDPR)
  - 支付打通(Stripe 对接)
  - 物流模板(美国、欧盟常用)
- 付费意愿:**高**($99-299/月可接受)
- 典型场景:"我有工厂做瑜伽服,想做个美国品牌卖,完全不会做站"

**Persona C:欧美小 DTC 品牌主**
- 画像:25-40 岁,美国/欧洲,有产品想法或已在 Shopify
- 痛点:Shopify 主题同质化、设计师贵、想要 BIOLOGICA 级别高级感
- 需求:
  - 英文界面
  - 审美高级(差异化核心)
  - 代码导出(Pro 独有)
  - 高定制自由度
  - 营销插件生态
- 付费意愿:**中高**($49-149/月)
- 典型场景:"我用 Shopify 建站,但觉得太普通,想要 BIOLOGICA 那种网站"

### 2.2 不做什么用户

- ❌ 中国国内电商(天猫、拼多多生态)—— 监管与支付复杂
- ❌ 巨型企业(500+ 员工)—— Shopify Plus 更合适
- ❌ B2B 大宗批发 —— Saleor / commercetools 更合适
- ❌ 纯数字商品(付费课程、软件)—— Gumroad / Stripe Atlas 更合适
- ❌ 单页 Landing Page 业务(无产品)—— Framer / Webflow 更合适

### 2.3 目标市场规模

- 全球独立站 SaaS 市场:$50B+(2026)
- 其中 AI 建站赛道:$5B 且年增 80%
- Shopify 2.5M 付费用户中,~30% 对视觉不满(可转化目标)
- 中国出海品牌:50,000+ 活跃品牌方(Persona A)

### 2.4 一年目标

- **12 个月 ARR 目标**:$8M(保守)~ $17M(乐观)
- **付费用户**:2,000(保守)~ 18,000(激进)
- **团队规模**:MVP 期 3-5 人,1 年后 15-25 人

---

## 3. 商业模式与付费体系

### 3.1 三层付费体系

```
Layer 1:订阅(Subscription)— 长期关系
  用户为"功能权限 + 月度积分额度"付钱
  
Layer 2:积分(Credits)— 按量消耗
  用户为"AI 算力"付钱
  
Layer 3:一次性服务(Services)— 关键时刻
  用户为"重大交付"付钱
```

### 3.2 订阅计划完整表

| 计划 | 月付 | 年付(省 25%) | 积分/月 | 站数 | 域名 | 3D | AI Copilot | Code Export |
|---|---|---|---|---|---|---|---|---|
| **Free** | $0 | — | 500(一次) | 0 发布 | .forgely.app 子域 带水印 | ❌ | 受限 | ❌ |
| **Starter** | $29 | $261(3 月免费) | 1,500 | 3 | 1 个 | ❌ | ✅ | ❌ |
| **Pro** ⭐ | $99 | $891 | 6,000 | 10 | 5 个 | ✅ | ✅ | 月送 1 次 |
| **Agency** | $299 | $2,691 | 25,000 | 50 | 无限 | ✅ | ✅ + 白标 | 无限 |
| **Enterprise** | $2,000+ | Custom | Custom | 100+ | 无限 | ✅ | ✅ + 私部 | 无限 |

### 3.3 积分充值套餐

| 套餐 | 积分 | 价格 | 单价 | 赠送 | 有效期 |
|---|---|---|---|---|---|
| Mini | 500 | $5 | $0.010 | 0 | 永不过期 |
| Standard | 2,500 | $20 | $0.008 | +300 | 永不过期 |
| Bulk | 10,000 | $69 | $0.0069 | +2,000 | 永不过期 |
| Scale | 50,000 | $299 | $0.006 | +15,000 | 永不过期 |

**订阅赠送的积分当月不用作废。购买的积分永不过期。**

### 3.4 一次性服务

| 服务 | 价格 | 对标 |
|---|---|---|
| Code Export(单站) | $499 | Pro 每月送 1 次 |
| Branded Domain Setup | $49 | 域名 + SSL + DNS 配置 |
| AI Brand Kit | $199 | Logo 10 变体 + Brand Guide |
| Video Pack(10 视频) | $99 | 多尺寸营销素材 |
| Expert Consultation | $299/时 | 1v1 视频通话 |
| Done-For-You Launch | **$1,999** | 全托管 7 天交付 |

### 3.5 Launch 促销(前 3 个月)

- Starter Early Bird:**$19/月**(原 $29)
- Pro Early Bird:**$69/月**(原 $99)
- 限量 1,000 席位
- 首月 50% 优惠(第二月起恢复折后价)

### 3.6 积分消耗清单(完整版,开发必参照)

**生成类**
| 操作 | 积分 | 成本 | 说明 |
|---|---|---|---|
| AI 对话分析(1-2 min 深度) | 20 | $0.20 | 多轮对话 + Vision |
| 完整首页生成(视频方案) | 900 | $9.00 | 6 段 + 12 Product hover |
| 完整首页生成(3D 方案) | 1,200 | $12.00 | + Meshy + R3F |
| 单产品详情页生成 | 100 | $1.00 | |
| Logo 生成(3 候选) | 30 | $0.30 | Ideogram |
| 单独 Hero Moment 视频 | 150 | $1.50 | Kling 单次 |
| Brand Story 视频 | 200 | $2.00 | Kling 12s |
| 产品 360 旋转视频 | 80 | $0.80 | Kling 6s |
| 3D 模型生成 | 100 | $1.00 | Meshy |

**编辑类**
| 操作 | 积分 |
|---|---|
| AI 改写单段文案 | 3 |
| AI 整站翻译 | 50 |
| AI 对话改主题(单指令) | 10 |
| 参考图重新生成素材 | 30 |
| 单张图 AI 生成 | 5 |
| 图片风格迁移 | 10 |
| 批量去背景(10 张) | 20 |

**SEO/GEO**
| 操作 | 积分 |
|---|---|
| 关键词研究 | 5 |
| SEO 优化单页 | 15 |
| SEO 全站优化 | 80 |
| AI 生成博客文章 | 25 |

**后台 AI 顾问**
| 操作 | 积分 |
|---|---|
| 简单查询/建议 | 1 |
| 复杂分析(多表查询) | 5 |
| 执行操作(改内容) | 10 |
| 生成营销素材 | 20 |

### 3.7 毛利结构

基于 2,000 付费用户测算:

**月营收**(综合):
- 订阅:$134,000
- 积分充值:$12,000(30% 用户每月超买)
- 一次性服务:$55,000
- **总计:~$200,000/月**

**月成本**:
- AI API 总消耗:$40,000-50,000(大头)
- Cloudflare(Pages + R2 + Workers):$3,000
- Medusa 托管(Railway/Fly):$2,000
- Postgres 数据库:$1,500
- 监控/邮件/等:$1,000
- Stripe 手续费(~3%):$6,000
- 客服 + 运营人工:$10,000-20,000
- 工程师团队(3-5 人):$30,000-50,000
- 营销投放:$15,000-30,000
- **总计:~$100,000-160,000/月**

**毛利率:40-50%(SaaS 合理区间)**

### 3.8 Stripe 集成设计

**产品层级**(Stripe Products):
- forgely_starter(月付 / 年付)
- forgely_pro(月付 / 年付)
- forgely_agency(月付 / 年付)
- 5 个积分包 Products
- 一次性服务 Products

**Customer Portal**:用户自助升降级、取消、改卡、看发票

**Webhook 处理**:
```
checkout.session.completed    → 初始订阅生效,送积分
invoice.payment_succeeded     → 月度订阅续费,刷新积分
invoice.payment_failed        → 发提醒邮件
customer.subscription.deleted → 降级为 Free,当前周期末失效
charge.refunded              → 退款处理,扣回积分
```

### 3.9 退款政策

- 订阅:**14 天无理由退款**(仅首次)
- 积分包:未使用积分 **30 天内可退**
- 一次性服务:**交付前可退,交付后不退**
- 订阅取消:**随时取消,当前周期内仍可用**
- 降级:**下个周期生效**

---

# 第二部分:技术架构

## 4. 总体技术架构

### 4.1 系统架构图

```
┌────────────────────────────────────────────────────────────────────┐
│                        用户浏览器 / 移动端                           │
└─────────────────────────────┬──────────────────────────────────────┘
                              │ HTTPS
                              ▼
┌────────────────────────────────────────────────────────────────────┐
│                    Cloudflare CDN + WAF                             │
└─────────────────────────────┬──────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│ forgely.com  │      │ app.forgely  │      │ *.forgely.app│
│ 对外官网      │      │   .com       │      │ 用户独立站    │
│              │      │ 用户后台      │      │              │
│ Next.js 14   │      │ + /super     │      │ Next.js 14   │
│ Cloudflare   │      │ 超级后台      │      │ Cloudflare   │
│ Pages        │      │ Cloudflare   │      │ Pages        │
│              │      │ Pages        │      │ (per tenant) │
└──────────────┘      └───────┬──────┘      └───────┬──────┘
                              │                     │
                              │      ┌──────────────┘
                              ▼      ▼
                     ┌────────────────────────┐
                     │   API Gateway          │
                     │   (Cloudflare Workers) │
                     └──────────┬─────────────┘
                                │
      ┌─────────────────────────┼─────────────────────────┐
      ▼                         ▼                         ▼
┌─────────────┐         ┌──────────────┐         ┌──────────────┐
│ Core API    │         │  AI Agents   │         │   Medusa v2  │
│ (Node.js)   │         │   Service    │         │   Backend    │
│ tRPC        │         │  (Node.js)   │         │   Node.js    │
└──────┬──────┘         └──────┬───────┘         └──────┬───────┘
       │                       │                         │
       │                ┌──────┴──────┐                  │
       │                ▼             ▼                  │
       │         [Claude API]   [Kling/Flux              │
       │         [Anthropic]     /Ideogram               │
       │                         /Meshy]                        │                         │                       │
       ▼                         ▼                       ▼
┌─────────────────────────────────────────────────────────────┐
│                   PostgreSQL + Redis                         │
│                  (核心数据 + 缓存 + 队列)                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
              ┌────────────────────────────────┐
              │  Cloudflare R2(对象存储)       │
              │  视频/图片/3D/代码包           │
              └────────────────────────────────┘
```

### 4.2 技术栈定版

**前端统一**:
- Next.js 14 App Router
- TypeScript(strict mode)
- Tailwind CSS + shadcn/ui
- Framer Motion + GSAP + Lenis
- React Three Fiber + Drei + Theatre.js(3D)
- TanStack Query(数据)
- TanStack Table(表格)
- Zustand(轻量状态)
- Tiptap(富文本)
- Tremor(数据可视化)
- cmdk(命令面板)
- Sonner(Toast)

**后端统一**:
- Node.js 20 LTS
- tRPC(类型安全 API)
- Prisma(ORM)
- BullMQ(队列)
- PostgreSQL 15
- Redis 7
- Medusa v2(电商)

**AI 调用层**:
- Anthropic SDK(Claude Opus/Sonnet/Haiku)
- Fal.ai(Flux、部分视频)
- Kling API(直接)
- Runway API
- Meshy API
- Ideogram API
- Playwright + ScraperAPI(爬虫)
- DataForSEO(关键词)

**基础设施**:
- Cloudflare Pages(前端托管)
- Cloudflare Workers(API Gateway + Edge 逻辑)
- Cloudflare R2(对象存储)
- Cloudflare D1(轻量元数据,可选)
- Railway 或 Fly.io(Medusa + 核心 API)
- Supabase 或 Neon(PostgreSQL 托管)
- Upstash(Redis 托管)
- Sentry(错误监控)
- PostHog(产品分析)
- Resend(事务邮件)

### 4.3 三端域名规划

```
forgely.com              → 对外官网(marketing)
app.forgely.com          → 用户后台 + /super 超级后台
                           (都在这个域名下,路径区分)
*.forgely.app            → 用户子域名(带水印 Free 用户)
{custom}.com             → 用户绑定的自定义域名

示例:
  app.forgely.com/app     → 用户主站后台
  app.forgely.com/super   → 超级后台(你和团队)
  toybloom.forgely.app    → Jane 的站(Free/Starter 子域)
  toybloom.com            → Jane 绑定的自定义域名
```

### 4.4 数据流分层

```
展示层(Presentation):Next.js App Router 页面
  ↓
应用层(Application):tRPC routes / API handlers
  ↓
业务逻辑层(Service):AI Agent、SEO、合规、生成 Pipeline
  ↓
数据访问层(Repository):Prisma Client / Medusa SDK
  ↓
持久化层(Persistence):PostgreSQL / Redis / R2
```

所有层严格分离,不允许 UI 直接访问数据库。

---

## 5. AI Agent 编排系统

### 5.1 Agent 角色定义(7 个 Agent)

每个 Agent 是一个独立的功能模块,有清晰的输入输出和所用模型:

| Agent | 职责 | 用的模型 | 输入 | 输出 |
|---|---|---|---|---|
| **Scraper** | 爬取源站商品 | Playwright + Vision 兜底 | URL | ScrapedData |
| **Analyzer** | 品牌与视觉分析 | Claude Sonnet + Vision | ScrapedData | BrandProfile |
| **Director** | Hero Moment 导演 | Claude Opus | BrandProfile | DirectorScript |
| **Planner** | 整站 DSL 规划 | Claude Opus | BrandProfile + DirectorScript | SiteDSL |
| **Copywriter** | 文案撰写 | Claude Sonnet | SiteDSL + BrandProfile | Copy(各字段) |
| **Artist** | 素材生产(图/视频/3D) | Flux/Kling/Meshy/Ideogram | SiteDSL + BrandDNA | MediaAssets |
| **Compliance** | 合规审查 | Claude Sonnet + 规则引擎 | 全站内容 + 产品类别 | ComplianceReport |
| **Compiler** | DSL → 代码 | 自研 | SiteDSL + 素材 | Next.js 项目 |
| **Deployer** | 部署上线 | Cloudflare API | 代码包 | 站点 URL |

### 5.2 Agent 之间的调度

```
User Input
    ↓
[对话阶段]
  Analyzer Agent 触发(边聊边分析)
    ├─ 同时跑 Scraper(异步)
    └─ 多轮对话引导用户
    ↓
[决策阶段]
  用户选 Video/3D + 选爆品 + 确认 DNA
    ↓
[生成阶段](主线,顺序或并行)
  1. Planner 生成 SiteDSL
  2. Director 生成每个 Moment 的剧本
  3. Copywriter 写所有文案(并行 Artist)
  4. Artist 生产所有素材(并行)
     ├─ Hero Moment 视频
     ├─ Value Props 微视频 × 3
     ├─ Product Showcase 视频 × N
     ├─ Brand Story 视频
     └─ (可选 3D 资产)
  5. Compliance 审查
  6. Compiler 编译
  7. Deployer 部署
    ↓
Live Site
```

### 5.3 Agent 通信协议

所有 Agent 通过**统一的事件总线**通信,使用 Redis Streams:

```typescript
// 事件结构
interface AgentEvent {
  id: string                    // ULID
  type: string                  // 'generation.scrape.started' 等
  siteId: string
  userId: string
  payload: object
  parentEventId?: string        // 追溯链
  timestamp: Date
  status: 'pending' | 'running' | 'completed' | 'failed'
  creditCost?: number
  durationMs?: number
  retryCount: number
}

// 关键事件类型
'generation.started'
'scrape.started' / 'scrape.completed' / 'scrape.failed'
'analyze.started' / 'analyze.completed'
'dialog.turn'
'plan.started' / 'plan.completed'
'direct.started' / 'direct.completed'
'copy.started' / 'copy.completed'
'asset.generation.started' / 'asset.generation.completed'
'compliance.started' / 'compliance.completed'
'compile.started' / 'compile.completed'
'deploy.started' / 'deploy.completed'
'generation.completed' / 'generation.failed'
```

### 5.4 可视化"施法"动画

用户端看到的生成过程必须美,就是前面讨论的 12 步施法:

```
Step 1:  Reading your world         (Scraper)
Step 2:  Seeing your aesthetic      (Vision Analyzer)
Step 3:  Finding your tribe         (Brand Analyzer)
Step 4:  Composing the vision       (Planner)
Step 5:  Writing the story          (Copywriter)
Step 6:  Forging the hero moment    (Artist: Hero Video)
Step 7:  Crafting the details       (Artist: Value Props + Products)
Step 8:  Capturing your soul        (Artist: Brand Story)
Step 9:  Checking the law           (Compliance)
Step 10: Tuning for Google          (SEO)
Step 11: Building the machine       (Compiler)
Step 12: Going live                 (Deployer)
```

每步配:
- 动效图标(Lottie 或 SVG)
- 实时"AI 思考"文字(流式输出)
- 进度条
- 预计剩余时间

### 5.5 失败降级策略

每个 Agent 都要有降级策略:

| 失败点 | 降级路径 |
|---|---|
| Scraper 失败 | → 让用户手动上传 CSV 或 API key |
| Kling 视频失败 | 重试 2 次 → Runway Gen-4 → Flux 静态图 → 预置素材 |
| Flux 图像失败 | 重试 2 次 → Ideogram → 素材库 |
| Meshy 3D 失败 | → 降级为视频方案 |
| Claude 超时 | 重试 + 降级到 Sonnet → Haiku |
| 全流程失败 | 退积分 + 工单 + 人工介入 |

---

## 6. Medusa v2 电商后端

### 6.1 为什么用 Medusa v2(不是 Saleor / Vendure)

- **同语言**(TypeScript)降低维护成本
- **REST API**(不是 GraphQL)开发速度更快
- **模块化架构**(v2 重构)支持多租户
- **社区活跃**(~40K npm 周下载)
- **Next.js 原生 Starter**

### 6.2 Medusa v2 架构集成

**部署方式**:
- MVP 阶段:**共享 Medusa 实例**,所有租户用 `sales_channel_id` 隔离
- Pro 以上:**独立 Medusa 实例**(Railway 每租户一个容器)
- Agency/Enterprise:**独立 DB + Medusa**

**多租户数据隔离**:
```typescript
// 每个 Forgely 用户 = 1 个 Sales Channel
// 每个商品 belongsTo sales_channel
// 每个订单 belongsTo sales_channel
// API 调用时强制注入 sales_channel_id 过滤
```

### 6.3 Medusa 核心配置

**需要的 Modules**(v2 模块化加载):
- Product Module(商品)
- Order Module(订单)
- Customer Module(客户)
- Cart Module(购物车)
- Inventory Module(库存)
- Pricing Module(定价)
- Payment Module(支付)
- Fulfillment Module(物流)
- Region Module(地区/税)
- Discount Module(折扣)

### 6.4 自定义扩展

基于 Medusa 的自定义 Module:
- **ForgelyTenant Module**:租户管理 + 计费
- **ForgelyAsset Module**:品牌素材管理
- **ForgelyTheme Module**:主题 DSL 存储
- **ForgelyGen Module**:生成任务记录
- **ForgelyAI Module**:AI 对话历史 + Token 消耗

### 6.5 支付网关(Medusa 插件)

- `medusa-payment-stripe`(主)
- `medusa-payment-paypal`
- 自研:`medusa-payment-nowpayments`(crypto)

### 6.6 运费配置

- 用户在后台配置物流区域 + 价格
- 预置模板:
  - US 域内(USPS / UPS 价格表)
  - US → EU(跨境模板)
  - 中国 → US(Persona A 常用)
  - EU 内(DPD / DHL)

---

## 7. 多源 Scraper 系统

### 7.1 支持的源站(3 层)

**Tier 1:官方 API**(最简单,MVP 必做)
- Shopify(`/products.json`)
- WooCommerce(`/wp-json/wc/v3/products`)
- BigCommerce(Storefront API)
- Wix Commerce(授权)
- Squarespace Commerce(授权)
- Shopline(中国店)

**Tier 2:爬虫但结构清晰**(V1 必做)
- AliExpress
- 1688(中国批发)
- Amazon(产品页)
- Etsy
- Taobao / Tmall
- 京东

**Tier 3:通用 AI 兜底**
- 未知平台 → Playwright + Claude Vision 自动学习规则
- 学到的规则自动存库,下次复用

### 7.2 Scraper Adapter 架构

```typescript
interface ScraperAdapter {
  id: string
  name: string
  priority: number              // 0-100
  canHandle(url: string): Promise<boolean>
  scrape(url: string, options: ScrapeOptions): Promise<ScrapedData>
}

// 统一返回格式
interface ScrapedData {
  source: string                // 'shopify' | 'woocommerce' | ...
  store: {
    name: string
    description?: string
    logo?: string
    currency: string
    language: string
  }
  products: Product[]
  collections: Collection[]
  screenshots: {
    homepage: string
    productPage?: string
    categoryPage?: string
  }
  scrapedAt: Date
  confidence: number            // 0-1,AI 评估的数据完整度
}
```

### 7.3 反爬应对

| 问题 | 策略 |
|---|---|
| Cloudflare 盾 | ScraperAPI render=true 或 Bright Data |
| IP 封禁 | 代理池轮换 |
| 验证码 | 降并发 + 换 UA |
| 需要登录 | 用户提供 cookie 或 API key |
| JS 渲染 | Playwright wait for selector |
| 分页异步 | 滚动 + 等待 + 多次抓 |

### 7.4 GenericAI Adapter(兜底)

当所有已知 Adapter 都不 match:

```typescript
class GenericAIAdapter {
  async scrape(url: string) {
    // 1. Playwright 全页加载 + 滚动到底
    const { html, screenshot } = await browser.fullPageCapture(url)
    
    // 2. 查规则库(这个 hostname 之前有没有学过?)
    const savedRule = await rulesDB.findByHostname(url)
    if (savedRule && savedRule.successRate > 0.7) {
      return applyRule(html, savedRule.selectors)
    }
    
    // 3. Claude Vision 分析截图 + 部分 HTML
    const analysis = await claude.analyze({
      image: screenshot,
      htmlSample: html.slice(0, 50000),
      prompt: `这是电商页吗?找出商品列表的 CSS selector。
               返回 { isEcommerce, selectors: {...}, confidence }`
    })
    
    if (analysis.confidence < 0.5) {
      throw new UnsupportedPlatformError()
    }
    
    // 4. 应用规则提取
    const products = extractByRules(html, analysis.selectors)
    
    // 5. 如果成功率 > 70%,存规则库
    if (products.length >= 3) {
      await rulesDB.save({
        hostname: new URL(url).hostname,
        selectors: analysis.selectors,
        successRate: 1.0,
      })
    }
    
    return normalize(products)
  }
}
```

---

## 8. 多租户架构

### 8.1 租户隔离层次

```
用户 (User)
  ↓ 1:N
站点 (Site)  = 一个租户
  ↓ 1:1
品牌资产 (BrandKit)
主题版本 (ThemeVersion)
商品 (Product)
订单 (Order)
AI 会话 (AiConversation)
```

### 8.2 数据隔离策略

**物理隔离(Enterprise 才用)**:
- 每个 Enterprise 客户独立 PG 数据库
- 独立 Medusa 实例

**逻辑隔离(MVP + Starter/Pro/Agency)**:
- 共享数据库
- 每张表带 `site_id` 或 `tenant_id`
- Prisma middleware 自动注入过滤

```typescript
// Prisma middleware 强制注入 tenant 过滤
prisma.$use(async (params, next) => {
  if (TENANT_MODELS.includes(params.model)) {
    if (params.action === 'findMany' || params.action === 'findFirst') {
      params.args.where = {
        ...params.args.where,
        siteId: getCurrentSiteId()   // 从 context 读
      }
    }
  }
  return next(params)
})
```

### 8.3 托管站点技术方案

每个用户站实际上是一个 Next.js 项目:
- MVP:**共享代码库 + 动态路由**。访问 `toybloom.forgely.app` 时,Middleware 根据 hostname 查 DB 拿 `site_id`,加载对应 theme DSL
- V2:**预构建静态**。每次发布触发 Cloudflare Pages 构建,CDN 纯静态

**运行时渲染优先级**:
1. 静态数据(商品、文案、图片)→ 构建时生成
2. 动态数据(库存、购物车)→ SSR + SWR
3. 实时数据(订单状态)→ Client-side fetch

### 8.4 域名与 SSL

- `*.forgely.app`:Cloudflare 通配符 SSL,自动配置
- 自定义域名:用户配 CNAME,Cloudflare for SaaS 自动签发 SSL

---

## 9. 部署与基础设施

### 9.1 部署拓扑

```
─── Cloudflare(全球 Edge)
  Pages × 3:
    forgely.com
    app.forgely.com
    *.forgely.app 通配符
  Workers:
    api.forgely.com(API Gateway)
  R2:
    assets.forgely.com(素材 + 视频)
    code.forgely.com(代码包)
  KV(缓存元数据)
  D1(可选,边缘小数据)

─── Railway / Fly.io(长驻服务)
  core-api(Node.js + tRPC)
  ai-agents(队列 worker)
  medusa(电商后端,MVP 阶段)
  scraper(爬虫 worker)

─── Neon / Supabase
  PostgreSQL(主库)
  Read replica(分析用)

─── Upstash
  Redis(缓存 + 队列)

─── 第三方监控
  Sentry(错误)
  PostHog(分析)
  Better Stack(uptime)
```

### 9.2 成本结构

**启动成本**(MVP 上线期):
- Cloudflare:$20-100/月
- Railway:$50-200/月
- Neon PG:$30/月
- Upstash Redis:$20/月
- 第三方:$50/月
- **合计:$170-400/月**

**规模成本**(2000 用户):
- 见 3.7 节,总 $100-160k/月

### 9.3 CI/CD 流程

```
GitHub Push to main
    ↓
GitHub Actions:
  1. Lint + Type check
  2. Unit tests
  3. Build
  4. E2E tests (Playwright)
  5. Deploy to staging (Cloudflare Pages preview)
    ↓
Manual approval
    ↓
Deploy to production:
  - Cloudflare Pages deploy
  - Railway rolling update
  - DB migrations(Prisma migrate deploy)
    ↓
Smoke test
    ↓
Sentry 监控 + PostHog 验证
```

---

# 第三部分:生成系统

## 10. 视觉 DNA 系统

### 10.1 什么是视觉 DNA

**视觉 DNA 不是"色板",是一套完整的视觉语言**,包括:
- 色彩调色板
- 字体搭配
- 镜头语言(慢/快、静/动)
- 灯光风格(自然/工业/梦幻)
- 色调(暖/冷/中性)
- 质感(胶片/数字/手绘)
- 构图(居中/黄金比例/对称)
- 节奏(密/疏)

一个站从顶到底共享一套 DNA,保证整体协调。

### 10.2 10 个预设 DNA

| ID | 名称 | 适合品类 | 核心特征 |
|---|---|---|---|
| 01 | Kyoto Ceramic | 陶瓷、茶、东方美学 | 暖白、晨光、慢、留白 |
| 02 | Clinical Wellness | 保健品、美妆、科学护肤 | 深色、金色点缀、精准 |
| 03 | Playful Pop | 饮料、零食、潮流 | 高饱和、快、动感 |
| 04 | Nordic Minimal | 家居、服装、玩具 | 冷白、极简、自然光 |
| 05 | Tech Precision | 电子产品、科技品牌 | 冷、金属、硬光 |
| 06 | Editorial Fashion | 服装、奢侈 | 胶片感、电影、慢 |
| 07 | Organic Garden | 天然食品、有机 | 绿色、自然元素、柔 |
| 08 | Neon Night | 夜店、音乐、潮流 | 霓虹、深色、动感 |
| 09 | California Wellness | 健康生活、瑜伽 | 阳光、暖金、自然 |
| 10 | Bold Rebellious | 反叛品牌、街潮 | 高对比、故意粗糙 |

### 10.3 DNA 数据结构

```typescript
interface VisualDNA {
  id: string
  name: string
  description: string
  
  // 色彩
  colors: {
    primary: string
    secondary: string
    accent: string
    bg: string
    fg: string
    muted: string
    semantic: {
      success: string
      warning: string
      error: string
    }
  }
  
  // 字体
  fonts: {
    display: { family: string; weights: number[]; source: 'google' | 'adobe' | 'custom' }
    heading: { family: string; weights: number[]; source: string }
    body: { family: string; weights: number[]; source: string }
    mono?: { family: string; source: string }
  }
  
  // 镜头语言
  cameraLanguage: {
    pace: 'slow' | 'medium' | 'fast'
    style: 'static' | 'floating' | 'dynamic'
    perspective: 'eye_level' | 'top_down' | 'low_angle' | 'varied'
    avgShotDuration: number  // 秒
  }
  
  // 色调
  colorGrade: {
    temperature: 'warm' | 'cool' | 'neutral'
    saturation: 'desaturated' | 'natural' | 'vibrant'
    contrast: 'low' | 'medium' | 'high'
    highlights: string
    shadows: string
    overallMood: string[]    // ['warm','soft','organic']
  }
  
  // 灯光
  lighting: {
    source: 'natural_window' | 'studio_soft' | 'dramatic' | 'neon' | 'outdoor_sunset'
    direction: 'side' | 'top' | 'backlit' | 'diffused' | 'front'
    intensity: 'soft' | 'medium' | 'hard'
  }
  
  // 质感
  texture: {
    filmGrain: 'none' | 'subtle' | 'heavy'
    motionBlur: 'none' | 'subtle' | 'cinematic'
    depth: 'shallow' | 'medium' | 'deep'
  }
  
  // 构图
  composition: {
    framing: 'centered' | 'rule_of_thirds' | 'asymmetric' | 'symmetric'
    negativeSpace: 'minimal' | 'balanced' | 'abundant'
  }
  
  // AI Prompt 构建器
  promptBuilder: {
    styleKeywords: string[]        // ['cinematic', 'soft lighting', '4k']
    negativeKeywords: string[]     // ['harsh', 'busy', 'saturated']
    technicalSpecs: string         // '24fps, shallow DOF, Arri Alexa look'
  }
}
```

### 10.4 DNA 应用范围

整站所有视觉输出都必须遵守 DNA:

| 位置 | 应用方式 |
|---|---|
| Hero Moment 视频 | prompt 注入 |
| Value Props 微视频 | 同上 |
| Brand Story 视频 | 同上 |
| Product Showcase | 同上 |
| 色彩 CSS Token | 直接用 |
| 字体引入 | 根据 fonts 字段自动加载 |
| Kling 负面提示词 | 自动加 negativeKeywords |

### 10.5 用户对 DNA 的控制(半开放)

**允许改**:
- 微调饱和度(±20%)
- 微调暖冷(±10%)
- 在 DNA 内切换字体(3-5 个候选)

**不允许改**:
- 切换整个 DNA 类型(防止整站视觉崩坏)
- 把 Kyoto Ceramic 改成 Neon Night(这种要重新生成)

---

## 11. Product Moment 系统

### 11.1 什么是 Product Moment

**不是广告片**(有开头中间结尾有剧情),**是 6-8 秒 loop 的"完美视觉瞬间"**,让产品在首屏以最美的方式"呼吸"。

### 11.2 10 种 Moment 类型

| ID | 名称 | 适合产品 | 镜头语言 | 成功率 |
|---|---|---|---|---|
| M01 | Liquid Bath | 饮料、护肤、香水 | 产品悬浮在液体中缓慢旋转 | 95% |
| M02 | Levitation | 电子产品、化妆品、手表 | 产品在纯色背景悬浮旋转 | 92% |
| M03 | Light Sweep | 金属质感、手表、电子 | 一道光扫过表面 | 94% |
| M04 | Breathing Still | 奢侈品、极简品牌、陶瓷 | 微动,阴影/光缓移 | 97% |
| M05 | Droplet Ripple | 护肤、美妆、饮料 | 液滴落下产生涟漪 | 88% |
| M06 | Mist Emergence | 香水、蒸汽护肤 | 雾散开,产品显现 | 85% |
| M07 | Fabric Drape | 服装、配饰、家居 | 布料飘动,产品掠过 | 82% |
| M08 | Ingredient Ballet | 保健品、美妆、食品 | 成分在慢动作中环绕产品 | 80% |
| M09 | Surface Interaction | 化妆品、手工艺品、食品 | 手指/水/光与表面互动 | 87% |
| M10 | Environmental Embed | 生活方式品牌、家居 | 产品在有氛围的环境中,风光动 | 93% |

### 11.3 Moment 选型逻辑(AI 自动)

```typescript
function selectMoment(product: ProductData, dna: VisualDNA, brand: BrandProfile): MomentType {
  // 规则引擎 + AI 辅助
  const category = product.category
  const mood = dna.colorGrade.overallMood
  
  // 强规则(品类匹配)
  const rules: Array<{ if: (p, d, b) => boolean; then: MomentType }> = [
    { if: (p) => p.isBeverage && mood.includes('playful'), then: 'M01' },    // Liquid Bath
    { if: (p) => p.isBeverage && mood.includes('bold'), then: 'M01' },       // Liquid Bath(加冰)
    { if: (p) => p.isSkincare && mood.includes('clinical'), then: 'M05' },   // Droplet Ripple
    { if: (p) => p.isSkincare && mood.includes('feminine'), then: 'M05' },
    { if: (p) => p.isFragrance, then: 'M06' },                               // Mist Emergence
    { if: (p) => p.isSupplement, then: 'M08' },                              // Ingredient Ballet
    { if: (p) => p.isWatch || p.isJewelry, then: 'M03' },                    // Light Sweep
    { if: (p) => p.isElectronics, then: 'M02' },                             // Levitation
    { if: (p) => p.isApparel, then: 'M07' },                                 // Fabric Drape
    { if: (p) => p.isCeramic || p.isLuxury, then: 'M04' },                   // Breathing Still
    { if: (p) => p.isLifestyle || p.isHome, then: 'M10' },                   // Environmental
  ]
  
  for (const rule of rules) {
    if (rule.if(product, dna, brand)) return rule.then
  }
  
  // 兜底用 Breathing Still(最稳)
  return 'M04'
}
```

### 11.4 Moment Prompt 模板库

每个 Moment 有完整的 Prompt 模板(详见附录 B):

```typescript
interface MomentPromptTemplate {
  id: MomentType
  basePrompt: string              // 含占位符
  variations: string[]            // 3-5 个变体
  cameraHints: string
  durationSec: number
  loopStrategy: string            // 如何保证首尾帧一致
  failureFallback: MomentType     // 失败时退化到哪个
}

// 示例:M04 Breathing Still
const M04_Template = {
  id: 'M04',
  basePrompt: `
    {{product_description}} positioned on a {{surface}}, 
    soft {{light_source}} light slowly shifting across the scene, 
    subtle {{atmosphere_element}} with minimal motion, 
    shallow depth of field, cinematic stillness, 
    {{dna_style_keywords}}, 
    no camera movement, ambient peaceful quality, 
    24fps, color graded to {{dna_color_grade}}
  `,
  variations: [
    'with gentle shadow movement',
    'with dust particles floating in light',
    'with subtle reflection shifting',
  ],
  cameraHints: 'completely static camera, no zoom, no pan',
  durationSec: 7,
  loopStrategy: 'start and end with identical light position',
  failureFallback: 'M10',
}
```

### 11.5 用户对 Moment 的控制

**默认流程**(AI 全自动):
- Analyzer 分析产品
- 规则引擎选 Moment 类型
- Director 基于 Moment 模板生成具体 prompt
- Artist 生成视频
- 用户看到成品

**用户修改**:
- 喜欢但要微调:"光线再柔一点"→ AI 改 prompt 重生成(消耗积分)
- 换 Moment 类型:用户点"换一种表达" → 系统列出 3 个备选 → 用户选 → 重生成
- 完全不喜欢:用户描述想要的 → AI 理解 → 可能跳出预设 Moment,用自由 prompt

---

## 12. AI 对话分析引擎

### 12.1 对话的目的

不是闲聊,是**在 1-2 分钟内精准提取品牌关键信息**:
- 产品类型与特征
- 目标客群
- 品牌调性
- 参考品牌
- 视觉偏好
- 特殊需求

### 12.2 对话流程设计

**场景 A:用户提供了 URL**
```
Turn 1(AI 开场):
  "我看了 {店名},识别到 {X} 件商品,类别是 {Y}。
   开始前,告诉我三件事:
   1. 你的目标客户是谁?
   2. 你希望客户感受到什么?
   3. 有没有欣赏的品牌?"

Turn 2(AI 回应,展示思考):
  [展示推理过程]
  "基于你说的,我判断你是 {brand_archetype} 品牌。
   推荐视觉 DNA: {DNA_name}。
   下一步:选择 Hero 视觉形式(Video / 3D)。"

Turn 3(用户选 Video/3D):
  [视频方案 + 3D 方案并排展示,带 2s 预览]

Turn 4(爆品选择):
  "从你的 {X} 件商品里,我推荐 3 个做首页主角:
   [产品卡 × 3]"

Turn 5(整站规划):
  [展示完整的 6 段首页结构]
  [显示积分消耗预估]
  [确认按钮]
```

**场景 B:用户只描述文字**
```
Turn 1-3:更多引导性问题
  - "描述一个你心目中完美的客户场景"
  - "上传 3 张你收藏的参考图"
  - "你的产品一句话介绍"
  - "推荐 3 个你觉得好看的品牌网站"

Turn 4:AI 根据这些信息,生成"假想产品"
  - 如果用户确实没有实物,用 Flux 生成产品概念图
  - 用户选一个作为 Hero 主角

其余同场景 A
```

### 12.3 AI 思考过程展示

**关键设计**:用户要看到 AI 在"思考",不是黑盒。

UI 示例:
```
💭 Analyzing...

📌 Reading your store:
   ✓ Found 12 handcrafted wooden toys
   ✓ Current visual: generic Shopify theme (4/10)
   ✓ Pricing: premium ($24-$89)

📌 Understanding your brand:
   You said: "Scandinavian home, warm and calm"
   References: Grimm's, Oeuf NYC
   → Brand archetype: Caregiver + Artist
   → Aesthetic match: Nordic Minimal (85%)

📌 Recommending visual DNA:
   Nordic Minimal
   · Warm whites, soft morning light
   · Quiet, considered pace
   · Natural textures

Is that right? [Yes, continue] [Something's off]
```

### 12.4 对话数据持久化

```typescript
// 每次对话存入 AiConversation 表
interface AiConversation {
  id: string
  userId: string
  siteId: string
  context: {
    currentStage: 'info_gathering' | 'recommendation' | 'decision' | 'review'
    collectedInfo: {
      sourceUrl?: string
      brandName?: string
      brandDescription?: string
      targetAudience?: string
      references?: string[]
      moodKeywords?: string[]
      selectedDNA?: string
      selectedMoment?: string
      heroProductId?: string
    }
  }
  messages: Array<{
    role: 'user' | 'assistant'
    content: string
    toolCalls?: object[]
    reasoning?: string    // 展示给用户看的推理
    createdAt: Date
  }>
}
```

---

## 13. 端到端生成 Pipeline

### 13.1 完整步骤(12 步施法)

```
输入:ScrapedData + BrandProfile + DNA + Moment + HeroProduct
  ↓
Step 1:【Planner】生成 SiteDSL(20 积分)
Step 2:【Director】为每个 Moment 生成详细剧本(30 积分)
Step 3:【Copywriter】为每段写文案(30 积分)并行 Step 4
Step 4:【Artist】并行生产所有素材:
        - Hero Moment 视频(150 积分)
        - Value Props 视频 × 3(90 积分)
        - Product Showcase 视频 × N(25 × N 积分)
        - Brand Story 视频(200 积分)
        - Logo 变体(30 积分,如果没有现成)
        - 3D 模型(可选,100 积分)
Step 5:【Compliance】审查所有内容(20 积分)
Step 6:【SEO/GEO】优化元数据 + 结构化数据(40 积分)
Step 7:【Compiler】DSL → Next.js 项目(50 积分)
Step 8:【Deployer】部署到 Cloudflare(10 积分)
Step 9:【Medusa】初始化 tenant + 导入商品(内部成本)
Step 10:【验证】运行 Lighthouse + E2E smoke test
Step 11:【通知】邮件通知用户上线
Step 12:【记录】全流程日志 + 生成报告给用户看
  ↓
输出:Live site URL
```

### 13.2 并行优化

Step 3(Copywriter)和 Step 4(Artist)可以完全并行,因为文案和素材不互相依赖。

Step 4 内部也可以并行:
- Hero / Value Props / Brand Story / Product Showcase 同时跑
- 只有 Logo 可能依赖品牌名(优先算)

### 13.3 总时长预期

- 最快:**2 分 30 秒**(所有 API 顺利,10 个商品以内)
- 平均:**4 分 30 秒**
- 最慢:**8 分钟**(重试 + 高并发)

### 13.4 生成失败处理

**单个素材失败**:
- 自动重试 2 次(改 prompt)
- 还失败 → 降级(Kling → Runway → Flux → 预置)
- 降级成功 → 继续
- 全部失败 → 标记该位置"待手工处理",继续生成其他部分

**整体失败**:
- 已生成部分存草稿
- 退还消耗积分
- 工单通知用户 + 自动发邮件
- 后台人工介入

### 13.5 用户可感知的重试

用户看到:
```
Step 6:Forging hero moment
[进度条] 尝试中...
⚠️ 第一次生成质量不满意,自动重试中(1/2)
✓ 重试成功!
```

这样用户感觉"系统在努力",不是"系统出错了"。


## 14. 爆品识别系统

### 14.1 识别维度

从用户店铺的商品中,AI 识别 3 个"Hero 候选":

```typescript
function rankProducts(products: Product[]): RankedProduct[] {
  return products.map(p => ({
    product: p,
    score: 
      // 定价相对高(+3)
      priceScoreAgainstAverage(p, products) +
      // 图片质量高(+2)
      imageQualityScore(p) +
      // 描述详细(+1,说明商家重视)
      descriptionDepthScore(p) +
      // 出现在 featured/bestseller 分类(+3)
      featuredCollectionScore(p) +
      // 变体多(+1,说明核心 SKU)
      variantDiversityScore(p) +
      // 评价数(+2,如果能抓到)
      reviewCountScore(p)
  }))
  .sort((a, b) => b.score - a.score)
  .slice(0, 3)
}
```

### 14.2 UI 展示

```
🌟 Select your homepage hero

From your 12 products, I recommend these 3:

┌────────────┐  ┌────────────┐  ┌────────────┐
│ [产品图]    │  │ [产品图]    │  │ [产品图]    │
│ Rainbow    │  │ Stacking   │  │ Silk Play  │
│ Stacker    │  │ Tower      │  │ Scarves    │
│ $48        │  │ $68        │  │ $28        │
│            │  │            │  │            │
│ 🏆 Best    │  │ ⭐ Highest │  │ 💫 Most    │
│ seller     │  │ price      │  │ unique     │
└────────────┘  └────────────┘  └────────────┘

💭 Why I picked these:
   1. Rainbow Stacker - most photogenic, universal appeal
   2. Stacking Tower - highest AOV, premium positioning
   3. Silk Scarves - unique product, differentiation angle

[Pick Rainbow Stacker] [Pick Tower] [Pick Scarves]
[Show me all 12]  [Let me describe my own hero]
```

### 14.3 无商品场景

如果用户完全没有现成商品(只是描述):
- AI 用 Flux 生成 3 个假想产品概念图
- 用户选一个
- 这个"产品"会随 Hero 一起生成
- 用户可后续替换为真实产品

---

## 15. 合规审查 Agent

### 15.1 审查范围

所有 AI 生成的内容上线前必须过一遍:
- 文案(产品描述、博客、页面)
- 宣传语
- 生成的图片/视频(AI 用 Vision 查看)
- Logo 是否山寨
- Schema markup

### 15.2 审查规则库

**地域合规**:
- 🇺🇸 FTC(广告诚实)
- 🇺🇸 FDA(保健品不能说"treat/cure/prevent")
- 🇺🇸 COPPA(儿童隐私)
- 🇺🇸 CPSIA(儿童用品安全)
- 🇺🇸 CA Prop 65(化学物质警告)
- 🇪🇺 GDPR(数据保护)
- 🇪🇺 DSA(数字服务法)
- 🇪🇺 CE 标志
- 🇬🇧 ASA(广告标准)
- 🇨🇦 CASL(反垃圾邮件)

**品类特殊**:
- 保健品:必须有"These statements have not been evaluated by the FDA"
- 化妆品:成分表合规
- 儿童产品:年龄标注
- 食品:营养标签
- 酒类:21+ 警告
- CBD:州法规差异
- 美瞳/美容仪:医疗器械类

**通用违规**:
- "100% 无副作用"(夸大)
- "医生推荐"(无依据)
- "永久有效"(承诺)
- 竞品贬损

### 15.3 审查结果

```typescript
interface ComplianceReport {
  overall: 'pass' | 'warning' | 'fail'
  regions: string[]
  findings: Array<{
    severity: 'info' | 'warning' | 'critical'
    rule: string
    location: string           // 'product.123.description' 等
    content: string            // 违规的具体内容
    suggestion: string         // AI 给出的合规改写
    autoFixable: boolean
  }>
  mustFix: number              // critical 数量
  shouldFix: number            // warning 数量
}
```

### 15.4 处理流程

```
审查通过 ✓
  → 继续部署

发现 warning(可以上线但建议改):
  → 在后台侧边栏显示"合规建议"
  → 用户可选择"AI 一键修复"或忽略

发现 critical(必须改,否则不部署):
  → 部署流程暂停
  → 弹窗提示用户
  → 提供"AI 一键修复"或"手动修改"
  → 修复后重新审查
```

---

## 16. SEO + GEO 内化

### 16.1 SEO 自动化

每个生成的站自动具备:

**技术 SEO**:
- `sitemap.xml` 自动生成,商品变化时更新
- `robots.txt` 智能配置
- `canonical` 标签
- 多语言 `hreflang`(v2)
- OG / Twitter Card 自动生成
- Schema.org 完整(Organization、Product、BreadcrumbList、Review、FAQPage)
- Core Web Vitals 优化(LCP ≤ 2s、INP ≤ 150ms、CLS ≤ 0.05)

**内容 SEO**:
- 标题/描述基于关键词优化
- 产品描述 AI 改写(含关键词但自然)
- 内部链接网(相关产品、分类、博客)
- 图片 alt text 自动生成

**本地 SEO**(可选):
- Google Business Profile 对接
- Local Schema

### 16.2 GEO(AI 搜索时代优化)

面向 ChatGPT、Perplexity、Claude 等 AI 爬虫:

- `llms.txt`:精简版内容给 AI 读
- `llms-full.txt`:完整内容
- 结构化 FAQ(让 AI 直接引用答案)
- Schema.org 完整性(AI 依赖结构化数据)
- 避免 JavaScript 才能看到的内容

### 16.3 SEO 配置后台

用户后台有 SEO 面板:
- 全站关键词研究(DataForSEO)
- 单页 SEO 分数 + 改进建议
- 关键词布局热力图
- 竞争对手对比
- AI 一键优化

---

# 第四部分:三端产品

## 17. 统一视觉品牌系统

### 17.1 核心原则:Cinematic Industrial

**灵感来源**:Terminal.industries + Linear + Vercel + Humane

**三端同基因**:同一套色彩、字体、间距、动效、组件规范。对外官网情绪最浓,用户后台平衡,超级后台数据密度最高。

### 17.2 色彩 Token(三端共用)

```typescript
// packages/design-tokens/colors.ts
export const colors = {
  // Core 基底
  bg: {
    void: '#08080A',
    deep: '#0E0E11',
    surface: '#14141A',
    elevated: '#1C1C24',
  },
  border: {
    subtle: '#1F1F28',
    strong: '#2D2D3A',
  },
  text: {
    primary: '#F4F4F7',
    secondary: '#A8A8B4',
    muted: '#6B6B78',
    subtle: '#45454F',
  },
  
  // Brand Accent(火焰锻造)
  forge: {
    orange: '#FF6B1A',
    amber: '#FFA040',
    gold: '#FFD166',
    ember: '#C74A0A',
  },
  
  // Semantic
  semantic: {
    success: '#22C55E',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#00D9FF',
  },
  
  // Data Viz(图表用)
  data: {
    series1: '#FF6B1A',
    series2: '#00D9FF',
    series3: '#A855F7',
    series4: '#22C55E',
    series5: '#EAB308',
  },
}
```

### 17.3 字体 Token

```typescript
export const fonts = {
  display: {
    family: "'PP Editorial New', 'Fraunces', serif",
    weights: [200, 400],
    source: 'adobe',
  },
  heading: {
    family: "'Inter Display', 'Geist', sans-serif",
    weights: [500, 600, 700, 800],
    source: 'google',
  },
  body: {
    family: "'Inter', 'Geist', sans-serif",
    weights: [400, 500, 600],
    source: 'google',
  },
  mono: {
    family: "'JetBrains Mono', 'Geist Mono', monospace",
    weights: [400, 500],
    source: 'google',
  },
}

export const fontSize = {
  'hero-mega': 'clamp(4rem, 10vw, 9rem)',
  'display': 'clamp(3rem, 6vw, 5rem)',
  'h1': 'clamp(2rem, 4vw, 3rem)',
  'h2': 'clamp(1.5rem, 2.5vw, 2rem)',
  'h3': '1.25rem',
  'body-lg': '1.125rem',
  'body': '1rem',
  'small': '0.875rem',
  'caption': '0.75rem',
}
```

### 17.4 间距 / 圆角 / 阴影

```typescript
export const spacing = {
  1: '4px', 2: '8px', 3: '12px', 4: '16px',
  6: '24px', 8: '32px', 12: '48px', 16: '64px',
  24: '96px', 32: '128px',
}

export const radius = {
  sm: '6px',
  md: '10px',
  lg: '14px',
  xl: '20px',
  '2xl': '28px',
}

export const shadows = {
  subtle: '0 1px 0 rgba(255,255,255,0.04) inset, 0 1px 2px rgba(0,0,0,0.4)',
  elevated: '0 1px 0 rgba(255,255,255,0.06) inset, 0 8px 24px rgba(0,0,0,0.6)',
  glow_forge: '0 0 40px rgba(255,107,26,0.3)',
  glow_data: '0 0 20px rgba(0,217,255,0.4)',
}

export const motion = {
  easing: {
    standard: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
    decelerate: 'cubic-bezier(0.0, 0.0, 0.2, 1)',
    accelerate: 'cubic-bezier(0.4, 0.0, 1, 1)',
  },
  duration: {
    micro: '120ms',
    short: '200ms',
    medium: '400ms',
    long: '600ms',
    cinematic: '1000ms',
  },
}
```

### 17.5 三端的视觉强度差异

| 维度 | 官网 | 用户后台 | 超级后台 |
|---|---|---|---|
| 信息密度 | 极低 | 中 | 高 |
| 动效 | 电影级 | 产品级 | 数据级 |
| 3D / 视频 | 大量 | 少量 | 无 |
| Forge Orange 使用 | 大胆 | 克制 | 几乎不用 |
| 字体 | Display + Body | Heading + Body | Mono 主导 |
| 情绪 | "哇" | "顺手" | "全在掌握" |

---

## 18. 对外官网

### 18.1 核心战略

官网本身就是 Forgely 能力的最大证明。**必须做到比客户期望再炸 30%**,才能让客户相信你能帮他们的独立站炸。

### 18.2 页面结构(12 段)

```
01. Sticky Navigation(顶部)
02. Hero - 3D 工坊场景 + "Brand operating system for the AI era"
03. Social Proof - Logo 墙 Marquee
04. Value Props - 3 个核心差异化(视频卡片)
05. How it works - 5 步生成流程(滚动触发)
06. Showcase - 真实案例网格(hover 播视频)
07. Interactive Demo - 可试的对话演示
08. Pricing - 3 主力计划 + Free + Enterprise 锚点
09. Feature Deep Dive - 左右交替叙事
10. Testimonials - 瀑布流评价墙
11. FAQ - Accordion + FAQ Schema
12. Final CTA - 全屏终极号召
13. Footer
```

### 18.3 Hero 区详细设计

**视觉**:
- 全屏 3D 锻造场景(或 8s loop 视频降级版)
- 夕阳金色光线从左上方打下
- 中心是一个产品从熔融到凝固的过程
- 滚动时相机轻微推近
- 鼠标移动时场景微视差

**文案**:
```
主标题(Display 字体,超大):
"Brand operating system
 for the AI era."

副标题:
"Forge cinematic brand sites from a single link."

输入框:
[Paste a store URL...]   [✨ Start Forging]

下方小字:
━━━━━━━━━━━━━━━━
Trusted by 2,000+ brands
```

**技术实现**:
- 桌面:预渲染视频(8s AV1,3-4MB)+ CSS 视差
- 移动端:静态 poster + 轻微呼吸光
- 超低端设备:纯图 + 动态渐变背景

### 18.4 滚动剧本(6 幕电影)

整站就是一部 6 分钟的电影:

```
Act 1 (0-100vh):  Hero - 工坊 + 主标题
Act 2 (100-200vh): Split - 产品被 AI 切片分析
Act 3 (200-300vh): Build - 线框图 → 实体化
Act 4 (300-400vh): Reveal - "FORGED" 巨大字 + 站浮现
Act 5 (400-500vh): Proof - 客户证言视频
Act 6 (500-600vh): CTA - "Your brand is one link away"
```

### 18.5 性能要求

- LCP ≤ 2.0s(必须)
- INP ≤ 150ms
- CLS ≤ 0.05
- FCP ≤ 1.2s
- Lighthouse 桌面 ≥ 95
- Lighthouse 移动 ≥ 85

### 18.6 SEO 配置

- Title: "Forgely — AI Brand Site Builder with Video & 3D"
- Description: 精准 155 字
- Schema: SoftwareApplication + Organization + FAQPage
- sitemap.xml
- llms.txt + llms-full.txt

### 18.7 Pricing 页(单独)

完整页包括:
- 月付/年付切换
- 4 个计划详细对比表
- FAQ(支付相关)
- 用户评价
- "Talk to Sales" 入口(Enterprise)

---

## 19. 用户后台

### 19.1 信息架构

前面 v1.1 已详细设计,这里确认最终结构:

```
/app
├── dashboard           仪表盘
├── sites               多站管理(Pro+)
│   └── [siteId]
│       ├── products    商品
│       ├── orders      订单
│       ├── customers   客户
│       ├── collections 分类
│       ├── discounts   优惠
│       ├── pages       CMS 页面
│       ├── blog        博客
│       ├── analytics   分析
│       ├── editor      主题编辑器
│       ├── media       媒体库
│       ├── apps        已装插件
│       └── settings    设置
├── brand-kits          品牌资产
├── media               全局媒体库
├── billing             账单与积分
├── apps-marketplace    插件市场
└── account             个人账户
```

### 19.2 Dashboard 设计

```
┌───────────────────────────────────────────────────────────┐
│ 👋 Good morning, Alex    April 19 · 10:23 AM   ⚡ 4,231  │
├───────────────────────────────────────────────────────────┤
│                                                           │
│ ┌────────┬────────┬────────┬────────┐                    │
│ │$2,847  │23      │3.2%    │1,203   │                    │
│ │Revenue │Orders  │Conv.   │Visitors│                    │
│ │↑12.3%  │↑8.1%   │↓0.3%   │↑15.2%  │                    │
│ └────────┴────────┴────────┴────────┘                    │
│                                                           │
│ [30 天折线图,forge-orange]                              │
│                                                           │
│ 📌 Needs attention                                        │
│ • 5 orders pending shipment                               │
│ • 3 low-stock items                                       │
│                                                           │
│ 💡 AI suggests                                           │
│ Your "Primary Essentials" converts 23% above average.     │
│ Want me to allocate more ad budget here?                  │
│ [Yes, show me] [Not now]                                  │
│                                                           │
└───────────────────────────────────────────────────────────┘
                                          [💬 AI Copilot]
```

### 19.3 所有核心页面(前面已设计,此处列表)

- 商品列表 / 商品详情(含 AI 辅助按钮)
- 订单列表 / 订单详情
- 客户列表 / 客户详情
- Media Library
- Brand Kit 管理
- Theme Editor(见第 23 章)
- Analytics(流量、销售、SEO)
- Billing(订阅、积分、发票)
- Settings(支付、运费、税、用户权限)

### 19.4 视觉升级(Terminal 风)

从原 v1.1 的"Linear 风"升级为"Cinematic Industrial":
- 更深色(bg-void #08080A)
- 数字用 Mono 字体
- 关键数据用 forge-orange 着色
- 实时数据有 LIVE 指示灯
- 侧边栏默认图标,hover 展开

---

## 20. 超级后台

### 20.1 访问路径

`app.forgely.com/super`(决策 Q1:B,同域名)

### 20.2 权限模型(决策 Q2:A,三级)

```typescript
enum SuperRole {
  OWNER      // 你,完全权限
  ADMIN      // 高级管理员,除财务和团队管理外全部
  SUPPORT    // 客服,只看用户 + 工单,不能封号
}
```

### 20.3 Login as User 逻辑(决策 Q3:C,需授权)

```
Admin 点击"Login as user"
  ↓
系统发送一条消息到该用户:
  "Support wants to access your account to help resolve [工单 ID].
   Grant temporary access for 30 minutes?"
  [Allow] [Deny]
  ↓
用户点 Allow
  ↓
生成临时 token(30 分钟有效)
Admin 用 token 登录,看到的是用户视角
所有操作都有审计日志标注"Support Access"
超时或主动结束后撤销
```

### 20.4 完整模块(14 个,前面已列)

**MVP 必备(Week 10-11)**:
1. Overview - 总览仪表盘
2. Users - 用户管理
3. Finance - 财务对账
4. Audit Log - 审计日志(软记录,决策 Q4:A)
5. Team - 内部团队

**V1(前 3 个月)**:
6. Sites - 站点管理
7. Content Moderation - 内容审核
8. AI Operations - AI 监控
9. Support - 工单
10. Platform Settings - 平台配置

**V2(6 个月+)**:
11. Analytics - 深度分析
12. Marketing - 营销工具
13. Plugins & Themes - 插件审核
14. System Health - 基础设施监控

### 20.5 Overview 指挥中心设计

```
┌──────────────────────────────────────────────────────────┐
│ 🔨 FORGELY COMMAND    ● ALL SYSTEMS OK    alex▾         │
├──┬───────────────────────────────────────────────────────┤
│📊│ 2026.04.19 10:23:42 UTC                ⟳ LIVE         │
│👥│ ─────────────────────────                            │
│🏪│                                                       │
│💰│ MRR     ARR      USERS    DAU                         │
│🤖│ $142K   $1.71M   18,234   4,921                       │
│📦│ ↑12.3%  ↑180%    +342     61.3%                       │
│🧩│                                                       │
│📈│ [双线图:Revenue + AI Cost]                          │
│📢│                                                       │
│🎟│ ⚠ ALERTS (3 active)                                   │
│⚙│ • Kling latency +340ms    5m ago                      │
│👤│ • Stripe backlog: 12     2m ago                       │
│  │ • Refund queue: 8 >24h   now                          │
│  │                                                       │
│  │ ▶ LIVE ACTIVITY                           [pause]    │
│  │ 12:04:23  user_7a8f  upgraded to Pro  $99            │
│  │ 12:04:18  site_a3f81 published                       │
│  │ 12:04:12  credits purchased 12,500   $69             │
│  │ ...                                                   │
└──┴───────────────────────────────────────────────────────┘
```

### 20.6 审计日志设计(决策 Q4:A 软记录)

```typescript
interface AuditLog {
  id: string
  actorType: 'super_admin' | 'user' | 'system'
  actorId: string
  action: string              // 'user.suspend', 'credits.grant', ...
  targetType: string
  targetId: string
  before?: object             // 改动前的数据
  after?: object              // 改动后
  reason?: string             // Admin 填的理由
  ipAddress: string
  userAgent: string
  createdAt: Date
}

// 所有敏感操作自动记录
// UI 查询:按 actor、action、target、时间筛选
// 导出 CSV
```

---

## 21. 生成的独立站模板

### 21.1 模板是什么

用户生成的站,底层就是**一套 Next.js 模板**,由 Forgely 的 Compiler Agent 根据 DSL 填入数据。

### 21.2 模板核心结构

```
生成站的文件结构:
app/
├── layout.tsx          根布局(注入 DNA tokens)
├── page.tsx            首页(6 段组合)
├── products/
│   ├── page.tsx        产品列表
│   └── [slug]/
│       └── page.tsx    产品详情
├── collections/
│   └── [slug]/
│       └── page.tsx    分类页
├── cart/               购物车
├── checkout/           结账
├── account/            客户账户
├── pages/
│   └── [slug]/         动态页面(关于、FAQ)
├── blog/               博客
└── api/                API routes(对接 Medusa)

components/
├── sections/           首页 6 段组件
├── product/            产品卡、详情
├── hero-moment/        各种 Moment 组件
├── cart/
├── checkout/
└── ui/                 基础 UI
```

### 21.3 首页 6 段组件

每段是独立的 React 组件,接受 DSL 的配置:

```typescript
// app/page.tsx
export default async function Home({ params }) {
  const dsl = await loadSiteDSL(params.site)
  
  return (
    <>
      <HeroSection config={dsl.hero} dna={dsl.dna} />
      <ValuePropsSection config={dsl.valueProps} dna={dsl.dna} />
      <ProductShowcaseSection config={dsl.showcase} dna={dsl.dna} />
      <BrandStorySection config={dsl.story} dna={dsl.dna} />
      <SocialProofSection config={dsl.proof} dna={dsl.dna} />
      <CTAFinaleSection config={dsl.cta} dna={dsl.dna} />
    </>
  )
}
```

### 21.4 HeroSection 的实现(关键)

```typescript
// components/sections/HeroSection.tsx
export function HeroSection({ config, dna }) {
  return (
    <section className="min-h-screen relative overflow-hidden">
      {/* 背景视频 / 3D */}
      {config.type === 'video' ? (
        <HeroVideo 
          src={config.video.src}
          poster={config.video.poster}
          momentType={config.momentType}
        />
      ) : (
        <Hero3D model={config.model3d} />
      )}
      
      {/* HTML 浮层(文字) */}
      <div className="absolute inset-0 flex flex-col justify-center px-6">
        <h1 
          className="font-display text-display"
          style={{ color: dna.colors.text.primary }}
        >
          {config.title}
        </h1>
        <p className="text-xl mt-4" style={{ color: dna.colors.text.secondary }}>
          {config.subtitle}
        </p>
        <div className="mt-12 flex gap-4">
          <PriceDisplay value={config.heroProduct.price} />
          <CTAButton href={`/products/${config.heroProduct.slug}`}>
            {config.cta}
          </CTAButton>
        </div>
      </div>
    </section>
  )
}
```

### 21.5 电商流转(购物车 + 结账)

- 购物车用 React Context + localStorage(简单场景)或 Medusa Cart API
- Checkout 走 Medusa 原生流程
- 支付 Stripe Checkout(跳转)或 Embedded(Pro+)


# 第五部分:核心功能模块

## 22. 品牌资产系统

### 22.1 核心原则

用户的品牌资产(Logo、字体、配色、产品图)是**站的灵魂**。系统必须支持:
- 用户上传(优先)
- AI 生成(补充)
- 素材库选择(兜底)

### 22.2 BrandKit 数据模型

```typescript
interface BrandKit {
  id: string
  userId: string
  siteId?: string                    // 关联到某个站
  name: string                       // 用户给品牌的名字
  
  logo: {
    primary: string                   // URL
    variants: {
      light: string                   // 浅色背景版
      dark: string                    // 深色背景版
      white: string                   // 纯白版
      black: string                   // 纯黑版
      icon: string                    // 简化 icon
      favicon: string                 // 32x32
      appleTouchIcon: string          // 180x180
      ogImage: string                 // 1200x630
    }
    uploaded: boolean                 // 用户上传还是 AI 生成
    originalFile?: string
  }
  
  colors: {
    primary: string
    secondary: string
    accent: string
    bg: string
    fg: string
    muted: string
    semantic: {
      success: string
      warning: string
      error: string
    }
  }
  
  fonts: {
    heading: FontSpec
    body: FontSpec
    display?: FontSpec
  }
  
  voice: {
    tone: string[]                    // ['professional', 'warm']
    keywords: string[]
    avoidWords: string[]
    samplePhrases: string[]
  }
  
  imageStyle: {
    mood: string[]                    // ['minimalist', 'warm']
    colorGrading: string
    composition: string
  }
  
  updatedAt: Date
}

interface FontSpec {
  family: string
  weights: number[]
  source: 'google' | 'uploaded' | 'system'
  files?: string[]                    // 如果 uploaded
}
```

### 22.3 Logo 处理流程

**用户上传**:
```
上传 PNG/SVG/AI/PSD
  ↓
remove.bg 自动去背景(如果是 PNG)
  ↓
自动生成 8 个变体:
  - white bg + dark logo
  - dark bg + white logo
  - transparent + original
  - favicon 16/32/48
  - apple-touch-icon 180
  - og-image 1200x630(logo + 渐变背景)
  - social 1080x1080
  ↓
提取主色调 → 存到 BrandKit.colors
  ↓
存入 R2 + 元数据入库
```

**AI 生成**:
- 用 Ideogram 3.0(字体清晰)
- 3 个候选 + 可再生成
- 消耗 30 积分

**上传参考图重新生成**(Flux Kontext):
- 用户上传参考图
- AI 分析风格
- 保留 logo 元素,换成参考风格
- 消耗 30 积分

### 22.4 Media Library

```
分类:
- All
- Logos
- Product Photos
- Lifestyle
- Videos
- 3D Models
- Icons

操作:
- 上传(单/批量)
- AI 生成(文生图/图生图)
- 素材库选择(内置 Unsplash Pro / Pexels)
- 预览 + 元数据
- 重命名 / 删除
- AI 重生成变体
- 拖拽到编辑器

元数据:
- 文件名、大小、尺寸
- 来源(uploaded / ai_generated / library)
- 生成器(Flux / Kling / Meshy)
- 生成 prompt(如果是 AI)
- 使用位置(哪些地方在用)
- 版权信息
```

---

## 23. 主题编辑器

### 23.1 双模式并存

**可视化模式**:
- 点击预览里的区块 → 右侧显示属性
- 拖拽调顺序
- 属性面板直接改

**AI 对话模式**:
- 左下角聊天框
- "Make the hero more bold"
- "Change colors to warmer"
- AI 解析 → 改 DSL → 预览刷新

两种模式改的是同一份 DSL,无缝切换。

### 23.2 三栏布局

```
┌───────┬──────────────────────────┬────────────┐
│ Pages │                          │ Properties │
│       │                          │            │
│ Home  │   [iframe 预览]           │ Selected:  │
│ About │                          │ Hero Sec.  │
│ ...   │                          │            │
│       │                          │ [属性表单] │
│       │                          │            │
│ ─────│                          │ [AI Edit]  │
│ AI    │                          │            │
│ [chat]│                          │            │
└───────┴──────────────────────────┴────────────┘
```

### 23.3 核心交互

- 点预览里的组件 → 左侧高亮位置 + 右侧显示属性
- 拖拽区块调整顺序(dnd-kit)
- "+"添加新区块 → 弹出组件选择器
- 每个属性改完 300ms 后自动应用到预览
- 保存 = 存为新版本
- 发布 = 覆盖当前 published 版本

### 23.4 版本历史

```
v23 · 5m ago · "AI: warmer tones"     [preview] [restore]
v22 · 2h ago · "manual edit"          [preview] [restore]
v21 · today · "added testimonials"    [preview] [restore]
...
```

- 自动快照每次保存
- 过去 30 天任意版本可恢复
- 删除只能删 30+ 天前的

### 23.5 设备断点预览

- Desktop(1440px)
- Tablet(768px)
- Mobile(375px)
- 折叠屏(快速切)

每个断点可以单独隐藏/显示某些 block。

---

## 24. AI Copilot

### 24.1 功能定位

**这不是聊天机器人,是能操作后台的 Agent**。

### 24.2 UI 位置

每个后台页面右下角常驻:
```
                                          ┌────┐
                                          │ 💬 │
                                          │ AI │
                                          └────┘
```

点开:Drawer 从右侧滑出,占 1/3 屏宽。

### 24.3 上下文感知

AI 知道用户当前在哪:

| 当前页面 | AI 默认上下文 |
|---|---|
| 商品详情 | 当前商品数据 |
| 订单详情 | 当前订单 |
| 主题编辑器 | 当前选中 block |
| 仪表盘 | 全站数据 |
| 空白 | 全局 |

### 24.4 Tool Use 清单

AI 能调用的工具:

```typescript
const adminTools = [
  // 查询
  'query_sales', 'query_orders', 'query_customers', 'query_inventory',
  'query_analytics', 'query_seo_performance',
  
  // 商品
  'update_product', 'create_product', 'rewrite_copy',
  'bulk_update_products', 'suggest_pricing',
  
  // 主题
  'modify_theme_block', 'add_theme_block', 'remove_theme_block',
  'change_colors', 'change_fonts',
  
  // 素材
  'generate_image', 'generate_video', 'generate_3d_model',
  'regenerate_hero_moment',
  
  // 营销
  'create_discount', 'send_campaign', 'schedule_email',
  
  // 客户
  'send_customer_message', 'issue_refund', 'tag_customer',
  
  // 分析
  'compare_periods', 'forecast_revenue', 'identify_trends',
]
```

### 24.5 写操作必须确认

```
AI: "OK, I'll change the hero title to 'Your Morning, Elevated'
     and regenerate the video with warmer lighting.
     This will cost 150 credits.
     Confirm?"
     
[Confirm] [Cancel] [Adjust]
```

### 24.6 长期记忆

用户和 AI 的对话 → pgvector embedding 存储
下次调用时,检索 top-k 相关记忆注入 context
让 AI 记得用户的偏好("我一直喜欢暖色系")

---

## 25. 积分系统

### 25.1 技术实现要点

```typescript
// 关键:事务 + 预扣机制
async function consumeCredits(userId: string, amount: number, desc: string) {
  return prisma.$transaction(async (tx) => {
    const credits = await tx.userCredits.findUnique({ where: { userId } })
    if (!credits || credits.balance < amount) {
      throw new InsufficientCreditsError()
    }
    
    // 原子扣除
    const updated = await tx.userCredits.update({
      where: { userId },
      data: { 
        balance: { decrement: amount },
        lifetimeSpent: { increment: amount }
      }
    })
    
    // 日志
    await tx.creditTransaction.create({
      data: {
        userId,
        type: 'consumption',
        amount: -amount,
        balance: updated.balance,
        description: desc,
      }
    })
    
    return updated.balance
  })
}

// 生成类操作:预扣 + 完成扣 / 失败退
async function generateWithCredits(userId, cost, generator) {
  const lockId = await credits.reserve(userId, cost)
  try {
    const result = await generator()
    await credits.commit(lockId)
    return result
  } catch (error) {
    await credits.release(lockId)
    throw error
  }
}
```

### 25.2 防滥用

- 单次操作上限:1000 积分
- 每日上限(Starter):500 积分
- 速率限制:每分钟 10 次 AI 调用
- 异常监控:短时间大量消耗 → 告警 + 冻结

### 25.3 Stripe 集成

**积分包**:
- 每个包是一个 Stripe Product
- Checkout Session 一次性支付
- Webhook `checkout.session.completed` → 加积分

**订阅送积分**:
- 订阅 webhook `invoice.payment_succeeded`
- 每月自动重置赠送积分

---

## 26. 插件市场

### 26.1 MVP 阶段

**不做 Marketplace UI**,只内置核心插件:
- Stripe(支付)
- PayPal(支付)
- NOWPayments(crypto)
- Google Analytics 4
- Meta Pixel
- TikTok Pixel
- Klaviyo(邮件)
- Mailchimp
- Intercom(客服)
- Yotpo(评价)

### 26.2 V2 阶段(6 个月后)

抽象 Plugin SDK:

```typescript
import { definePlugin } from '@forgely/plugin-sdk'

export default definePlugin({
  id: 'klaviyo',
  name: 'Klaviyo Email Marketing',
  version: '1.0.0',
  
  config: {
    apiKey: { type: 'string', required: true },
    listId: { type: 'string' },
  },
  
  adminPages: [
    { path: '/apps/klaviyo', component: 'DashboardPage' },
  ],
  
  storefrontEmbed: {
    head: '<script src="..." />',
  },
  
  hooks: {
    'order.created': async (order, config) => { ... },
    'customer.created': async (customer, config) => { ... },
  },
  
  tools: [
    { name: 'klaviyo_send_campaign', ... }
  ]
})
```

### 26.3 开发者收益

- 付费插件:开发者 70% / Forgely 30%
- 插件内加购:开发者自己 Stripe(Forgely 不抽成)

---

## 27. CMS 与内容管理

### 27.1 可编辑内容

- Pages(关于、FAQ、Contact)
- Blog posts
- Navigation(主导航、页脚、移动端)
- Announcements(顶部通告栏)
- Pop-ups(Newsletter、退出挽留)
- Email templates
- Legal(Privacy、TOS、DSA)

### 27.2 富文本编辑

- Tiptap(开源)
- 基础格式 + 列表 + 表格 + 代码块
- 图片嵌入(从 Media Library)
- 视频嵌入(YouTube / Vimeo)
- 自定义 block(产品卡、CTA)

### 27.3 AI 辅助写作

每个富文本编辑器顶部有 🤖 AI 按钮:
- 改写得更专业 / 友好 / 短 / 长
- 翻译成英文 / 多语言
- SEO 优化
- 生成建议

### 27.4 AI 生成博客

```
输入:主题 + 关键词 + 字数 + 风格
输出:完整博客(含相关产品内链)
消耗:25 积分
```

### 27.5 邮件模板(MJML)

- 订单确认、发货、欢迎、挽回、节日等模板
- MJML 源文件存储
- 可视化编辑 + 变量插入
- AI 改写文案
- 多语言版本
- 测试发送

---

## 28. 支付系统

### 28.1 支付方式

| 方式 | 用途 | 集成 |
|---|---|---|
| Stripe | 订阅 + 积分 + 用户店铺收款 | Stripe SDK |
| PayPal | 补充,部分用户偏好 | PayPal SDK |
| NOWPayments | Crypto | NOWPayments API |
| Apple Pay / Google Pay | 结账优化 | Stripe 内置 |

### 28.2 Forgely 自己的收费

**订阅**:
- Stripe Subscriptions
- Customer Portal 用户自助
- 14 天无理由退款

**积分**:
- Stripe Checkout 一次性
- Webhook 加积分

**一次性服务**:
- Stripe Checkout
- 高价服务需要后台审批

### 28.3 用户店铺的收款

用户在后台"Connect Stripe":
- OAuth 授权
- 同步到 Medusa 作为主支付
- 测试支付验证
- 正式启用

---

# 第六部分:工程与交付

## 29. Monorepo 工程结构

```
forgely/
├── apps/
│   ├── web/                   官网 forgely.com
│   ├── app/                   用户后台 + /super(统一在同一 Next.js)
│   ├── storefront/            用户生成站模板
│   └── admin-medusa/          Medusa 管理面板(自用)
│
├── packages/
│   ├── ui/                    共享 UI 组件(shadcn + Aceternity + Magic UI)
│   ├── design-tokens/         Tailwind preset + tokens
│   ├── icons/                 图标库
│   ├── charts/                Tremor 封装
│   ├── 3d/                    R3F 共享 3D 组件
│   ├── animations/            Framer + GSAP 预设
│   ├── api-client/            tRPC 客户端
│   ├── scraper/               爬虫 Adapter
│   ├── ai-agents/             AI Agent 实现
│   ├── visual-dna/            10 个 DNA 预设
│   ├── product-moments/       10 个 Moment Prompt
│   ├── compliance/            合规规则库
│   ├── seo/                   SEO 工具
│   └── dsl/                   SiteDSL schema + compiler
│
├── services/
│   ├── api/                   核心 API(tRPC)
│   ├── medusa/                Medusa v2 后端
│   ├── worker/                BullMQ 队列 worker
│   └── deploy/                部署服务
│
├── infra/
│   ├── cloudflare/            Terraform / Wrangler
│   ├── db/                    Prisma schema + migrations
│   └── docker/                Dockerfiles
│
├── scripts/                   一次性脚本
├── docs/                      文档(本文档在这)
│   └── MASTER.md              本文档
├── .github/
│   └── workflows/             CI/CD
├── turbo.json                 Turborepo 配置
├── pnpm-workspace.yaml
└── package.json
```

### 29.1 工具链

- **Turborepo** - Monorepo 任务调度
- **pnpm** - 包管理
- **TypeScript 5.3+** - 严格模式
- **ESLint + Prettier** - 代码规范
- **Husky + lint-staged** - pre-commit
- **Vitest** - 单元测试
- **Playwright** - E2E 测试
- **Storybook** - 组件文档

---

## 30. 数据库完整 Schema

### 30.1 核心表(Prisma Schema 节选)

```prisma
// prisma/schema.prisma
generator client { provider = "prisma-client-js" }
datasource db { provider = "postgresql"; url = env("DATABASE_URL") }

// ── 用户
model User {
  id            String   @id @default(cuid())
  email         String   @unique
  name          String?
  avatarUrl     String?
  role          String   @default("user") // user | super_admin | admin | support
  plan          String   @default("free") // free | starter | pro | agency | enterprise
  stripeCustomerId String? @unique
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  credits       UserCredits?
  sites         Site[]
  brandKits     BrandKit[]
  conversations AiConversation[]
  
  @@index([email])
}

// ── 站点
model Site {
  id            String   @id @default(cuid())
  userId        String
  user          User     @relation(fields: [userId], references: [id])
  
  name          String
  subdomain     String   @unique               // xxx.forgely.app
  customDomain  String?  @unique
  
  status        String   @default("draft")     // draft | generating | published | suspended
  sourceUrl     String?
  sourcePlatform String?                       // shopify | woocommerce | etc
  
  dnaId         String?
  dna           VisualDNA? @relation(fields: [dnaId], references: [id])
  
  heroMomentType String?                       // M01..M10
  heroProductId  String?
  
  dsl           Json?                          // 完整 SiteDSL
  publishedDsl  Json?                          // 已发布版本
  publishedAt   DateTime?
  
  medusaSalesChannelId String? @unique
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  versions      ThemeVersion[]
  generations   Generation[]
  assets        MediaAsset[]
  
  @@index([userId, status])
}

// ── 主题版本
model ThemeVersion {
  id            String   @id @default(cuid())
  siteId        String
  site          Site     @relation(fields: [siteId], references: [id])
  
  version       Int
  dsl           Json
  description   String
  editorType    String   // ai_chat | visual | import | generated
  createdBy     String   // userId
  createdAt     DateTime @default(now())
  
  @@unique([siteId, version])
  @@index([siteId, createdAt])
}

// ── 生成记录
model Generation {
  id            String   @id @default(cuid())
  siteId        String
  site          Site     @relation(fields: [siteId], references: [id])
  userId        String
  
  status        String   // pending | running | completed | failed
  steps         Json     // 12 步的详细状态
  
  inputData     Json     // scraped + brand profile + user choices
  outputDsl     Json?
  
  creditsCost   Int
  durationMs    Int?
  
  errorMessage  String?
  retryCount    Int      @default(0)
  
  createdAt     DateTime @default(now())
  completedAt   DateTime?
  
  @@index([siteId, createdAt])
  @@index([userId, status])
}

// ── 视觉 DNA
model VisualDNA {
  id            String   @id
  name          String
  description   String
  spec          Json     // 完整 VisualDNA 结构
  isBuiltin     Boolean  @default(true)
  sites         Site[]
}

// ── 品牌 Kit
model BrandKit {
  id            String   @id @default(cuid())
  userId        String
  user          User     @relation(fields: [userId], references: [id])
  siteId        String?  @unique
  
  name          String
  logoPrimary   String?
  logoVariants  Json
  colors        Json
  fonts         Json
  voice         Json
  imageStyle    Json
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

// ── 媒体素材
model MediaAsset {
  id            String   @id @default(cuid())
  userId        String
  siteId        String?
  site          Site?    @relation(fields: [siteId], references: [id])
  
  type          String   // image | video | 3d_model | icon | audio
  url           String
  thumbnailUrl  String?
  filename      String
  size          Int
  dimensions    Json?
  mimeType      String
  
  source        String   // uploaded | ai_generated | library
  generator     String?  // flux | kling | meshy | ideogram
  prompt        String?
  tags          String[]
  usedIn        Json?
  
  createdAt     DateTime @default(now())
  
  @@index([userId, type])
  @@index([siteId, type])
}

// ── AI 对话
model AiConversation {
  id            String   @id @default(cuid())
  userId        String
  user          User     @relation(fields: [userId], references: [id])
  siteId        String?
  
  context       Json
  messages      Json
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  @@index([userId, updatedAt])
}

// ── 积分系统
model UserCredits {
  id            String   @id @default(cuid())
  userId        String   @unique
  user          User     @relation(fields: [userId], references: [id])
  
  balance       Int      @default(0)
  reserved      Int      @default(0)
  lifetimeEarned Int     @default(0)
  lifetimeSpent  Int     @default(0)
  
  updatedAt     DateTime @updatedAt
}

model CreditTransaction {
  id            String   @id @default(cuid())
  userId        String
  type          String   // purchase | subscription | consumption | refund | gift | promotion
  amount        Int      // 正数获得,负数消耗
  balance       Int      // 交易后余额
  description   String
  metadata      Json?
  createdAt     DateTime @default(now())
  
  @@index([userId, createdAt])
}

model CreditsPackage {
  id            String   @id @default(cuid())
  name          String
  credits       Int
  priceUsd      Int       // 美分
  bonusCredits  Int       @default(0)
  popular       Boolean   @default(false)
  active        Boolean   @default(true)
  stripePriceId String    @unique
}

// ── 订阅
model Subscription {
  id            String   @id @default(cuid())
  userId        String   @unique
  plan          String   // starter | pro | agency
  status        String   // active | past_due | canceled | trialing
  stripeSubscriptionId String @unique
  stripePriceId String
  currentPeriodStart DateTime
  currentPeriodEnd   DateTime
  cancelAtPeriodEnd  Boolean @default(false)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

// ── 插件
model InstalledPlugin {
  id            String   @id @default(cuid())
  siteId        String
  pluginId      String
  version       String
  config        Json      // 加密
  enabled       Boolean   @default(true)
  installedAt   DateTime  @default(now())
  
  @@unique([siteId, pluginId])
}

// ── CMS
model Page {
  id            String   @id @default(cuid())
  siteId        String
  type          String   // page | blog | legal
  slug          String
  title         String
  content       Json      // Tiptap JSON
  featuredImage String?
  seoTitle      String?
  seoDescription String?
  seoKeywords   String[]
  status        String    // draft | published | scheduled
  publishedAt   DateTime?
  scheduledFor  DateTime?
  author        String?
  tags          String[]
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  @@unique([siteId, slug])
}

// ── 爬虫
model ScraperRule {
  id            String   @id @default(cuid())
  hostname      String   @unique
  selectors     Json
  successRate   Float
  lastUsedAt    DateTime @default(now())
  createdAt     DateTime @default(now())
}

model ScrapeHistory {
  id            String   @id @default(cuid())
  userId        String
  sourceUrl     String
  platform      String?
  status        String
  productCount  Int      @default(0)
  errorMessage  String?
  rawData       Json?
  expiresAt     DateTime
  createdAt     DateTime @default(now())
}

// ── 超级后台
model AuditLog {
  id            String   @id @default(cuid())
  actorType     String   // super_admin | user | system
  actorId       String
  action        String
  targetType    String
  targetId      String
  before        Json?
  after         Json?
  reason        String?
  ipAddress     String
  userAgent     String
  createdAt     DateTime @default(now())
  
  @@index([actorId, createdAt])
  @@index([action, createdAt])
  @@index([targetType, targetId])
}

// ── 合规记录
model ComplianceRecord {
  id            String   @id @default(cuid())
  siteId        String
  pageId        String?
  severity      String   // info | warning | critical
  rule          String
  content       String
  suggestion    String
  status        String   // open | resolved | ignored
  resolvedAt    DateTime?
  createdAt     DateTime @default(now())
}

// 其他模型如 ReportedSite, SupportTicket, Coupon, EmailTemplate, NavigationMenu, Announcement 等按需补充
```

---

## 31. API 设计规范

### 31.1 tRPC Routers

```typescript
// services/api/src/routers/index.ts
export const appRouter = router({
  auth: authRouter,
  sites: sitesRouter,
  products: productsRouter,
  orders: ordersRouter,
  brandKits: brandKitsRouter,
  media: mediaRouter,
  themes: themesRouter,
  generation: generationRouter,
  ai: aiRouter,
  copilot: copilotRouter,
  credits: creditsRouter,
  billing: billingRouter,
  cms: cmsRouter,
  super: superRouter,  // 超级后台
})
```

### 31.2 关键 API 示例

```typescript
// 创建生成任务
sites.generate({
  input: {
    sourceUrl?: string
    brandDescription?: string
    references?: string[]
  },
  conversation: ConversationContext,
  options: {
    heroProduct: string
    dnaId: string
    momentType: string
    format: 'video' | '3d'
  }
}) -> { generationId: string }

// 订阅生成进度(SSE)
generation.subscribe(generationId) -> EventStream

// AI Copilot 对话
copilot.chat({
  message: string,
  context: { route, selectedEntity }
}) -> StreamingResponse

// 积分消耗(内部用)
credits.consume({ amount, description, metadata })

// 合规检查
compliance.check({ siteId }) -> ComplianceReport
```

### 31.3 错误处理

```typescript
class ForgelyError extends Error {
  code: string              // 'INSUFFICIENT_CREDITS' 等
  statusCode: number
  userMessage: string       // 用户友好提示
  context?: object
}

// 全局错误边界
// Sentry 自动捕获
// 用户看到友好提示
```

---

## 32. 组件库建设

### 32.1 组件来源策略

**70% 抄开源**:
- shadcn/ui:所有基础组件
- Aceternity UI:3D 动效组件
- Magic UI:动画组件
- Tremor:图表

**20% 业务组件**:
- ProductCard、OrderRow、HeroMoment、PricingTable 等
- 自研但基于开源组件组合

**10% 自研核心**:
- SiteDSL 编辑器
- 施法动画组件
- Command Center LIVE 流
- 3D 滚动剧本

### 32.2 重点组件清单(按优先级)

**P0(必须)**:
- [ ] Button(primary/secondary/ghost/destructive)
- [ ] Input / Textarea / Select
- [ ] Card
- [ ] Badge / Tag
- [ ] Dialog / Drawer / Sheet
- [ ] Dropdown Menu
- [ ] Tooltip
- [ ] Toast(Sonner)
- [ ] Table(TanStack)
- [ ] Tabs
- [ ] Form(React Hook Form + Zod)
- [ ] Spinner / Skeleton
- [ ] Command Menu(⌘K)
- [ ] Stepper / Progress
- [ ] Avatar
- [ ] Pagination
- [ ] Empty State
- [ ] Code Block

**P1(重要)**:
- [ ] DateRangePicker
- [ ] FileUpload(拖拽)
- [ ] RichTextEditor(Tiptap)
- [ ] ColorPicker
- [ ] FontPicker
- [ ] ImageGallery
- [ ] VideoPlayer
- [ ] Animated Metrics(Number Ticker)
- [ ] Marquee
- [ ] Bento Grid
- [ ] Sticky Scroll
- [ ] 3D Card
- [ ] Border Beam
- [ ] Shine Border
- [ ] Spotlight

**P2(增强)**:
- [ ] Canvas Reveal
- [ ] Animated Beam
- [ ] Hero Parallax
- [ ] Text Generate Effect
- [ ] 3D Product Viewer
- [ ] Moment Preview

### 32.3 Storybook

所有组件必须有 Storybook story:
- Default state
- All variants
- Interactive examples
- Dark mode(默认)
- Accessibility 检查

---

## 33. 20 周 MVP 开发计划

```
Week 0:   品牌基因(Tokens、Logo、字体)
Week 1-2: 基础设施 + 共享组件库(shadcn 全抄一遍)
Week 3:   官网 MVP(简化版,收 waitlist)
Week 4-6: AI 编排层 + 用户后台基础
           - Scraper(Shopify/WooCommerce 必做)
           - Analyzer + Planner
           - 用户后台 Dashboard + Products + Orders
           - 登录注册 + 账单
Week 7-9: 用户后台深化
           - Media Library
           - BrandKit
           - Theme Editor(可视化 + AI 对话)
           - AI Copilot
           - 积分系统完整实现
Week 10:  超级后台 MVP
           - Overview / Users / Finance / Audit Log / Team
Week 11-13: 官网升级到 Terminal 级
           - 真 3D Hero 场景
           - 6 幕滚动剧本
           - Showcase 案例
Week 14-16: 深度功能
           - 多源 Scraper(AliExpress/Amazon/Etsy)
           - Compliance Agent
           - SEO/GEO 自动化
           - 10 种 Moment 完整实现
           - Director Agent
Week 17:  内测 + 打磨
Week 18-20: Beta 发布 + 上线
```

---

## 34. Task 清单

每个 Task 都是一个独立的、可以发给 Claude Code 的任务。详见附录中的 Task 1-30。

### 34.1 Task 总览

| ID | 标题 | 周次 | 依赖 |
|---|---|---|---|
| T01 | Monorepo 脚手架 | W1 | - |
| T02 | Design Tokens 包 | W1 | T01 |
| T03 | shadcn/ui 基础组件 | W1-2 | T02 |
| T04 | Aceternity + Magic UI 组件 | W2 | T03 |
| T05 | 数据库 Schema + Prisma | W2 | T01 |
| T06 | 认证系统 | W2 | T05 |
| T07 | 官网 MVP(Hero + Pricing + CTA) | W3 | T04 |
| T08 | Scraper Shopify Adapter | W4 | T01 |
| T09 | Scraper WooCommerce Adapter | W4 | T08 |
| T10 | Analyzer Agent | W4 | T08 |
| T11 | 10 个视觉 DNA 预设 | W4 | T02 |
| T12 | 10 个 Moment Prompt 库 | W4 | T02 |
| T13 | Director Agent | W5 | T10,T12 |
| T14 | Planner Agent + SiteDSL | W5 | T10,T11 |
| T15 | Copywriter Agent | W5 | T14 |
| T16 | Artist Agent(Flux + Kling) | W5-6 | T13 |
| T17 | Compiler + Deployer | W6 | T14 |
| T18 | 用户后台 Dashboard + Products | W6-7 | T05,T06 |
| T19 | 订单/客户管理 | W7 | T18 |
| T20 | Media Library + BrandKit | W8 | T18 |
| T21 | Theme Editor(可视化) | W9 | T14,T18 |
| T22 | Theme Editor(AI 对话模式) | W9 | T21 |
| T23 | AI Copilot(Tool Use) | W9 | T18 |
| T24 | 积分系统 + Stripe 集成 | W9 | T06 |
| T25 | Super Admin - Overview | W10 | T18 |
| T26 | Super Admin - Users / Finance | W10 | T25 |
| T27 | 官网 - Terminal 升级 | W11-13 | T07 |
| T28 | 多源 Scraper 扩展 | W14 | T08 |
| T29 | Compliance Agent | W15 | T10 |
| T30 | SEO/GEO 完整实现 | W16 | T14 |

### 34.2 Task 模板

每个 Task 给 AI 的 prompt 格式:

```
## Task ID: T_XX
## 标题:[简短描述]
## 依赖:[前置 Task]

## 目标
[这个 Task 要完成什么,产出什么]

## 输入
[需要读的文档章节、已有代码、配置]

## 输出
[具体产出物:文件路径、代码、数据库迁移等]

## 详细要求
1. ...
2. ...

## 验收标准
- [ ] ...
- [ ] ...

## 参考资料
- docs/MASTER.md 第 X 章
- https://... 开源参考
```

---

## 35. 风险点与应对

### 35.1 产品风险

| 风险 | 应对 |
|---|---|
| AI 视频质量不稳定(60-70% 成功率) | 降级链 + 用户选重生成 + 退积分 |
| 整站视觉不协调 | Visual DNA 系统强制约束 |
| 用户生成速度慢导致流失 | 施法动画 + 异步通知 + 邮件回来看 |
| 模板被玩烂导致同质化 | 10 DNA × 10 Moment = 100 组合 + 用户微调 |
| 合规出问题(产品违规宣称) | Compliance Agent 强制审查 |

### 35.2 技术风险

| 风险 | 应对 |
|---|---|
| Kling API 限流 | 多账号池 + Runway 备份 |
| Cloudflare Pages 构建限制 | 必要时迁 Vercel 或自建 |
| Medusa v2 不稳定 | 版本锁 + 充分测试 + 准备回滚 |
| 大规模并发生成阻塞 | BullMQ 队列 + 横向扩展 worker |
| 数据库性能瓶颈 | 读写分离 + 索引优化 + 分片预案 |

### 35.3 商业风险

| 风险 | 应对 |
|---|---|
| Shopify 官方做类似产品 | 保持速度 + 差异化视觉 |
| Atlas 升级降价竞争 | 强调独立托管 + 全栈能力 |
| 获客成本高于 LTV | 关注 Payback Period ≤ 12 个月 |
| AI API 成本失控 | 每日预算熔断 + 积分系统对齐 |

### 35.4 法律风险

| 风险 | 应对 |
|---|---|
| 用户上传版权素材 | TOS 约束 + DMCA 响应流程 |
| AI 生成素材的版权归属 | 明确写在 TOS:商用风险用户自担 |
| 跨境合规(GDPR/DSA) | 部署合规审查 + 定期法律 review |
| 支付合规(PCI) | 100% 用 Stripe 托管,不接触卡号 |

---

# 附录

## 附录 A:10 个视觉 DNA 详细规格

### A.01 Kyoto Ceramic
```json
{
  "id": "kyoto_ceramic",
  "name": "Kyoto Ceramic",
  "colors": {
    "primary": "#2D2A26",
    "accent": "#8B5A3C",
    "bg": "#FEFDFB",
    "muted": "#E8E2D9"
  },
  "fonts": {
    "display": "Fraunces",
    "body": "Inter"
  },
  "cameraLanguage": { "pace": "slow", "style": "static", "avgShotDuration": 7 },
  "colorGrade": { "temperature": "warm", "saturation": "desaturated" },
  "lighting": { "source": "natural_window", "direction": "side", "intensity": "soft" },
  "promptBuilder": {
    "styleKeywords": ["soft morning light", "natural wood tones", "zen minimalism", "cinematic stillness"],
    "negativeKeywords": ["bright", "saturated", "busy", "chaotic"]
  }
}
```

### A.02 Clinical Wellness
主色暗墨绿 + 金,字体 Tiempos + Inter,Aesop / La Mer / BIOLOGICA 风

### A.03 Playful Pop
高饱和糖果色,字体 Poppins + DM Sans,Recess / Poppi / Olipop 风

### A.04 Nordic Minimal
暖白 + 原木色,字体 Inter Display + Inter,HAY / Muji / PlanToys 风

### A.05 Tech Precision
冷灰 + 银,字体 Geist + Geist Mono,Apple / Nothing / Framework 风

### A.06 Editorial Fashion
胶片感黑白 + 暗红,字体 PP Editorial + Inter,Acne / Jacquemus / The Row 风

### A.07 Organic Garden
大地色 + 有机绿,字体 Fraunces + Inter,Our Place / Tata Harper 风

### A.08 Neon Night
深色 + 霓虹紫/青,字体 Monument + Inter,Liquid Death 夜版 / 电音品牌风

### A.09 California Wellness
阳光金 + 暖米,字体 Fraunces + Inter,Ritual / Athletic Greens / Rhode 风

### A.10 Bold Rebellious
高对比黑白 + 红,字体 Druk + Inter,Off-White / Liquid Death / Diesel 风

(每个 DNA 完整规格见 `packages/visual-dna/presets/*.ts`)

---

## 附录 B:10 种 Product Moment Prompt 库(节选)

### B.01 Liquid Bath
```
"{product} suspended in {liquid_type}, slowly rotating,
backlit with soft colored light, bubbles rising gently,
cinematic product photography, {dna_style_keywords},
shallow depth of field, 24fps, shot on Arri Alexa"
```

### B.04 Breathing Still(最稳,默认兜底)
```
"{product} placed on {surface}, soft {light_source} light
slowly shifting across the scene, subtle {atmosphere_element},
minimal motion, shallow depth of field, cinematic stillness,
{dna_style_keywords}, completely static camera,
ambient peaceful quality, 24fps"
```

(完整 10 个见 `packages/product-moments/templates/*.ts`)

---

## 附录 C:Kling / Runway / Flux 最优 Prompt 技巧

### Kling 2.0 Prompt 结构
```
[Subject] + [Action/State] + [Camera Movement] + [Lighting] + [Mood/Style] + [Technical]

示例:
"Ceramic mug on wooden table (Subject + State)
, soft morning light slowly shifting (Lighting + Action)
, static camera (Camera)
, cinematic peaceful mood (Mood)
, 24fps shallow DOF (Technical)"
```

### Runway Gen-4 差异
- 更擅长人体动作
- 对相机运动更精准
- 成本更高(用于 Kling 失败兜底)

### Flux 1.1 Pro 差异
- 最高质量静态图
- 文字生成不如 Ideogram
- 用于非 Hero 位置的图片

### Ideogram 3.0
- 唯一擅长文字的模型
- Logo / 海报 / 含文字的图必用

---

## 附录 D:积分消耗完整清单

(见 3.6 节,此处不重复)

---

## 附录 E:端到端数据流示例(玩具站)

### E.1 用户输入阶段
```
Jane 输入:https://toybloom.myshopify.com
```

### E.2 Scraper 输出
```json
{
  "source": "shopify",
  "store": { "name": "ToyBloom", "currency": "USD" },
  "products": [12 件],
  "screenshots": ["..."],
  "confidence": 0.98
}
```

### E.3 Analyzer 输出
```json
{
  "visualQuality": 4,
  "brandArchetype": "Caregiver + Artist",
  "referenceBrands": ["Grimms", "Oeuf NYC"],
  "recommendedDNA": "nordic_minimal"
}
```

### E.4 用户选择
```json
{
  "dnaId": "nordic_minimal",
  "heroProductId": "rainbow_stacker",
  "format": "video",
  "momentType": "M04_breathing_still"
}
```

### E.5 Director 输出
```json
{
  "heroPrompt": "Wooden rainbow stacker on linen-draped wooden table, soft morning window light slowly shifting, subtle steam, Nordic minimal aesthetic, 8s loop",
  "valueProps": [
    "Close-up of artisan hands sanding wood",
    "Macro texture of natural wood grain",
    "Scandinavian forest morning light"
  ],
  "brandStoryPrompt": "Small woodworking studio at dawn, light through window, wood shavings floating"
}
```

### E.6 Planner 输出 SiteDSL
```json
{
  "sections": [
    { "type": "Hero", "config": {...} },
    { "type": "ValueProps", "config": {...} },
    { "type": "ProductShowcase", "config": {...} },
    { "type": "BrandStory", "config": {...} },
    { "type": "SocialProof", "config": {...} },
    { "type": "CTAFinale", "config": {...} }
  ],
  "dna": "nordic_minimal",
  "seo": {...},
  "products": [...]
}
```

### E.7 生成结果
```
site: toybloom.forgely.app
files:
  /app/page.tsx(首页,引用 6 段 Section)
  /app/products/[slug]/page.tsx
  /components/sections/HeroSection.tsx
  /public/videos/hero_loop.mp4
  /public/videos/value_prop_1.mp4
  ...
medusa:
  sales_channel: "toybloom"
  12 products imported
```

---

**文档结束。**

版本:v1.2 FINAL
总章节:35 + 附录 A-E
锁定日期:2026-04-19

**下一步**:把本文档 + `Forgely-AI开发话术.md` 一起交给 Claude Code,开始 Sprint 1。

