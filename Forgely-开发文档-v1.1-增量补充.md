# Forgely 开发文档 v1.1 — 增量补充

> **版本**:v1.1
> **日期**:2026-04-19
> **说明**:本文档补充 v1.0 未覆盖的核心功能模块。阅读顺序建议:先读 v1.0,再读本补充。本补充的章节编号从 16 开始,接续 v1.0。

---

## 目录(新增章节)

16. [多源站抓取系统(Universal Scraper)](#16-多源站抓取系统)
17. [用户自定义品牌资产系统](#17-用户自定义品牌资产系统)
18. [Forgely 管理后台(Admin Panel)](#18-forgely-管理后台)
19. [主题编辑器(Theme Editor)](#19-主题编辑器)
20. [后台 AI 顾问(In-Admin AI Copilot)](#20-后台-ai-顾问)
21. [积分系统(Credits System)](#21-积分系统)
22. [插件市场(Plugin Marketplace)](#22-插件市场)
23. [内容管理(CMS)与文案编辑](#23-内容管理)
24. [数据库 Schema 扩展](#24-数据库-schema-扩展)
25. [后台用户界面设计规范](#25-后台用户界面设计规范)
26. [v1.1 任务补充(给 AI 执行)](#26-v11-任务补充)
27. [更新后的 MVP 开发计划(18 周)](#27-更新后的-mvp-开发计划)

---

## 16. 多源站抓取系统

> **目标**:让用户能粘贴**任何**电商平台的 URL,系统都能抓到商品数据。不只是 Shopify。

### 16.1 支持的源站类型(分层)

按抓取难度和优先级分 3 层:

#### Tier 1:官方 API 支持(最简单,MVP 必做)

| 平台            | 抓取方式                               | 优先级 |
| --------------- | -------------------------------------- | ------ |
| **Shopify**     | `GET /products.json` 公开接口          | P0     |
| **WooCommerce** | `GET /wp-json/wc/v3/products` 公开接口 | P0     |
| **BigCommerce** | `GET /api/storefront/products`         | P1     |
| **Wix**         | Wix API(需授权)                        | P2     |
| **Squarespace** | Commerce API(需授权)                   | P2     |
| **Shopline**    | 国内常见,有公开 API                    | P1     |

#### Tier 2:需要爬虫但结构清晰(第二批)

| 平台                         | 抓取方式                | 备注         |
| ---------------------------- | ----------------------- | ------------ |
| **AliExpress / 1688 商品页** | Playwright + 规则解析   | 中国卖家常用 |
| **Amazon 产品页**            | Playwright + ScraperAPI | 反爬强       |
| **Etsy**                     | Playwright              | 结构清晰     |
| **Taobao / 天猫**            | Playwright + 国内代理   | 反爬强       |
| **eBay**                     | Browse API + 爬虫       |              |
| **京东**                     | Playwright + 代理       |              |

#### Tier 3:通用爬虫(兜底方案)

对于未知平台,启用**通用爬虫模式**:

- Playwright 打开 URL
- 截图整页
- 用 Claude Vision 分析:"这是一个电商站吗?商品在哪里?如何提取?"
- AI 生成提取规则(CSS selector + 正则)
- 应用规则提取数据
- 人工确认后加入规则库(下次相同平台自动用)

### 16.2 架构:可插拔的 Scraper Adapter

```typescript
// lib/scraper/types.ts
interface ScraperAdapter {
  id: string // 'shopify' | 'woocommerce' | ...
  name: string
  canHandle(url: string): Promise<boolean> // URL 匹配检测
  detectPlatform(url: string): Promise<DetectionResult>
  scrape(url: string, options: ScrapeOptions): Promise<ScrapedData>
}

// 适配器注册表
const adapters: ScraperAdapter[] = [
  new ShopifyAdapter(),
  new WooCommerceAdapter(),
  new BigCommerceAdapter(),
  new AmazonAdapter(),
  new AliExpressAdapter(),
  new EtsyAdapter(),
  new TaobaoAdapter(),
  // ...
  new GenericAIAdapter(), // 兜底,必须最后
]
```

### 16.3 Scraper Agent 升级版逻辑

```
输入:sourceUrl
  ↓
1. URL 预检:
   - 是否可访问?
   - 是否需要登录?
   - 是否有反爬?
  ↓
2. 平台检测:
   - 遍历所有 Adapter 的 canHandle()
   - 第一个 match 的 Adapter 负责抓取
   - 都不 match 则用 GenericAIAdapter
  ↓
3. 执行抓取:
   - 优先用官方 API
   - 失败降级到 Playwright
   - 再失败用 ScraperAPI 代理
  ↓
4. 数据标准化:
   - 各 Adapter 输出都转换成统一的 ScrapedData 结构
  ↓
5. 缓存 24h(按 URL hash)
  ↓
返回 ScrapedData
```

### 16.4 每个 Adapter 的实现细节

#### ShopifyAdapter

```typescript
class ShopifyAdapter {
  async canHandle(url: string) {
    // 检测方式1:URL 包含 /products.json 或 /collections/
    // 检测方式2:请求 /products.json 看返回格式
    const res = await fetch(`${url}/products.json`)
    return res.ok && (await res.json()).products !== undefined
  }

  async scrape(url: string) {
    // 1. 获取全部商品(支持分页)
    let allProducts = []
    let page = 1
    while (true) {
      const res = await fetch(`${url}/products.json?page=${page}&limit=250`)
      const data = await res.json()
      if (!data.products.length) break
      allProducts.push(...data.products)
      page++
    }

    // 2. 获取分类
    const collections = await fetch(`${url}/collections.json`).then((r) => r.json())

    // 3. 截图(用于风格分析)
    const screenshots = await captureScreenshots(url, ['/'])

    // 4. 标准化
    return normalize(allProducts, collections, screenshots)
  }
}
```

#### WooCommerceAdapter

```typescript
class WooCommerceAdapter {
  async canHandle(url: string) {
    // 检测 WordPress + WooCommerce
    const res = await fetch(`${url}/wp-json`)
    const data = await res.json()
    return data.namespaces?.includes('wc/v3')
  }

  async scrape(url: string) {
    // 注意:WC REST API 需要认证,公开商品列表也受限
    // 方案 A:如果站点开启了 Storefront API,用公开接口
    // 方案 B:否则爬 /shop/、/product-category/ 页面
    // 方案 C:让用户提供 API key(可选)
  }
}
```

#### AmazonAdapter / AliExpressAdapter(反爬严重)

```typescript
class AmazonAdapter {
  async scrape(url: string) {
    // 必须用 ScraperAPI / Bright Data
    const proxyUrl = `https://api.scraperapi.com?api_key=${KEY}&url=${url}&render=true`
    const html = await fetch(proxyUrl).then((r) => r.text())
    // 用 cheerio 解析 DOM
    // Amazon 的结构相对稳定,有固定的 CSS selector
    return parseAmazonProduct(html)
  }
}
```

#### GenericAIAdapter(AI 兜底)

```typescript
class GenericAIAdapter {
  async scrape(url: string) {
    // 1. Playwright 打开 + 截图整页
    const { html, screenshot } = await browser.loadAndCapture(url)

    // 2. Claude Vision 分析
    const analysis = await claude.vision({
      image: screenshot,
      prompt: `分析这个网页:
        1. 这是电商站吗?
        2. 商品列表在哪里?(坐标/区域)
        3. 每个商品的关键信息(标题、价格、图片)在 DOM 的什么位置?
        4. 给出 CSS selector 建议
        返回 JSON`,
    })

    // 3. 应用 selector 提取
    const products = extractByRules(html, analysis.selectors)

    // 4. 如果成功率 > 70%,保存这份规则到数据库
    if (products.length > 3) {
      await saveRule(new URL(url).hostname, analysis.selectors)
    }

    return products
  }
}
```

### 16.5 反爬应对策略

| 问题              | 应对                                                  |
| ----------------- | ----------------------------------------------------- |
| Cloudflare 5 秒盾 | ScraperAPI `render=true` 或 Playwright stealth plugin |
| IP 封禁           | 多 IP 代理池(ScraperAPI / Bright Data)                |
| 验证码            | 换代理 + 降低并发 + 用户代理池                        |
| 需要登录          | 用户提供 cookie / session 导入(高级功能)              |
| JavaScript 渲染慢 | Playwright 等待特定元素出现                           |
| 分页异步加载      | 滚动到底 + 等待 + 多次抓取                            |

### 16.6 用户输入体验

```
┌────────────────────────────────────────────────────────────┐
│  ✨ 让 AI 帮你创建新站                                      │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  📌 粘贴你的现有店铺 URL                                    │
│  ┌──────────────────────────────────────────────────┐     │
│  │ https://yourstore.myshopify.com                  │     │
│  └──────────────────────────────────────────────────┘     │
│  ✓ 检测到:Shopify 店铺,含 23 件商品                      │
│                                                            │
│  ─── 或者 ───                                             │
│                                                            │
│  📁 上传商品 CSV / JSON(无现有站时)                       │
│  [拖拽上传]                                                │
│                                                            │
│  📝 只有描述,没有现成商品?                                │
│  [切换到"纯 AI 生成"模式]                                  │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

抓取失败时的降级:

```
⚠️ 我们暂时无法自动抓取这个站点。
选项:
  [ 手动上传商品 CSV ]
  [ 用 API key 连接](针对 WooCommerce / Shopify Admin API)
  [ 截图上传 + AI 识别 ]
  [ 联系客服人工协助 ]
```

### 16.7 抓取失败 / 部分成功的处理

- 成功 > 90%:直接进入下一步
- 成功 50-90%:标记可疑商品,让用户在预览阶段确认
- 成功 < 50%:失败降级,给用户手动补充的界面
- 完全失败:记录 URL + 失败原因,触发规则库更新

---

## 17. 用户自定义品牌资产系统

> **目标**:用户可以全程控制品牌素材 — Logo、字体、配色、产品图、宣传视频。AI 生成是**选项**,不是唯一路径。

### 17.1 核心原则:AI 生成 + 用户上传双轨并行

每一类素材都有 3 种获取方式:

1. **用户上传**(自己的品牌资产)
2. **AI 生成**(按风格和描述自动生成)
3. **素材库选择**(内置的 1000+ 免版权素材)

### 17.2 素材类型矩阵

| 素材         | 用户上传        | AI 生成         | 素材库          | 备注                     |
| ------------ | --------------- | --------------- | --------------- | ------------------------ |
| Logo         | ✅(优先)        | ✅ Ideogram     | —               | 用户通常有               |
| 品牌字体     | ✅ 上传 TTF/OTF | —               | ✅ Google Fonts |                          |
| 品牌配色     | ✅ 调色板       | ✅ 从 Logo 提取 | —               |                          |
| 产品图       | ✅(主用)        | ✅ Flux 增强    | —               | 用户上传原图,AI 做场景化 |
| Hero 视频    | ✅ MP4          | ✅ Kling/Runway | ✅ Pexels       |                          |
| 场景图       | ✅              | ✅ Flux         | ✅ Unsplash Pro |                          |
| 产品 3D 模型 | ✅ .glb 上传    | ✅ Meshy        | —               |                          |
| 环境 HDRI    | —               | —               | ✅ Poly Haven   |                          |
| 图标         | ✅ SVG          | ✅ Recraft      | ✅ Lucide 1000+ |                          |
| 字体排印     | —               | —               | ✅ 预设         |                          |

### 17.3 Logo 处理流程

```
用户选择:
  ↓
┌──────────────────┬──────────────────┬──────────────────┐
│ 选项 A:上传      │ 选项 B:AI 生成   │ 选项 C:素材库    │
│ - PNG/SVG/AI     │ - Ideogram 3.0   │ - 1000+ 模板      │
│ - 自动提取主色   │ - 3 个候选       │ - 可编辑          │
│ - 自动生成多变体 │ - 可再生成       │                  │
└──────────────────┴──────────────────┴──────────────────┘
  ↓
Logo 标准化处理:
  - 自动去背景(remove.bg)
  - 生成多种变体:
    * 白底版 / 黑底版 / 透明版
    * 横版 / 方版 / 简化版 icon
    * 深色模式版 / 浅色模式版
  - 生成 favicon(16/32/48/180/512)
  - 生成 Apple Touch Icon
  - 生成 OG 分享图
  ↓
存入 Brand Asset Library
```

### 17.4 Brand Kit 数据模型

```typescript
interface BrandKit {
  id: string
  userId: string
  name: string

  // 核心标识
  logo: {
    primary: string // URL
    variants: {
      light: string // 浅色背景版
      dark: string // 深色背景版
      white: string // 纯白版
      black: string // 纯黑版
      icon: string // 简化 icon
      favicon: string // favicon 32x32
    }
    uploaded: boolean // 是用户上传还是 AI 生成
    originalFile?: string // 原始上传文件
  }

  // 配色
  colors: {
    primary: string // 主色 #hex
    secondary: string
    accent: string
    bg: string
    fg: string
    muted: string
    semantic: {
      // 功能色
      success: string
      warning: string
      error: string
    }
  }

  // 字体
  fonts: {
    heading: {
      family: string
      weights: number[]
      source: 'google' | 'uploaded' | 'system'
      files?: string[] // 如果 uploaded
    }
    body: {
      family: string
      weights: number[]
      source: 'google' | 'uploaded' | 'system'
      files?: string[]
    }
  }

  // 品牌基调
  voice: {
    tone: string[] // ['professional', 'warm', 'bold']
    keywords: string[] // 品牌常用词
    avoidWords: string[] // 不用的词
    samplePhrases: string[]
  }

  // 图片风格
  imageStyle: {
    mood: string[] // ['minimalist', 'warm', 'editorial']
    colorGrading: string // 'warm' | 'cool' | 'neutral'
    composition: string // 'centered' | 'rule_of_thirds'
  }
}
```

### 17.5 素材管理界面(MediaLibrary)

```
┌──────────────────────────────────────────────────────────┐
│ 📁 媒体库                       [上传] [AI 生成] [素材库] │
├──────────────────────────────────────────────────────────┤
│ 筛选:                                                    │
│ [所有] [Logo] [产品图] [视频] [3D 模型] [图标] [场景]   │
│                                                          │
│ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐                     │
│ │img1│ │img2│ │vid1│ │3d1 │ │logo│                     │
│ └────┘ └────┘ └────┘ └────┘ └────┘                     │
│  ✅用户  ✨AI   ✅用户  ✨AI   ✅用户                    │
│                                                          │
│ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐                     │
│ │img6│ │img7│ │img8│ │img9│ │im10│                     │
│ └────┘ └────┘ └────┘ └────┘ └────┘                     │
│                                                          │
│ [加载更多]                                                │
└──────────────────────────────────────────────────────────┘
```

操作:

- 点击:预览 + 元数据 + 使用位置
- 右键:重命名 / 删除 / 下载 / AI 再生成变体
- 拖拽:到编辑器直接使用
- 多选:批量删除 / 批量 AI 处理

### 17.6 AI 生成的用户控制

用户在 AI 生成时有完整控制:

**Logo 生成界面**:

```
🎨 AI Logo 生成

品牌名:[BIOLOGICA____________]

风格:
○ Minimal  ● Luxury  ○ Playful  ○ Bold  ○ Vintage  ○ Tech

字体类型:
○ Serif  ● Sans-serif  ○ Script  ○ Display

颜色:
主色 [🟣 #2d1b4e]  辅色 [🟡 #f4a261]

附加要求(可选):
[参考 Aesop 的极简风格______________________]

上传参考图(可选):
[📁 拖拽上传最多 3 张参考图]

[生成 3 个候选]            (消耗 5 积分)
```

生成后:

- 3 个候选展示
- 用户选一个,或"再生成 3 个"
- 选中后可继续微调:"颜色更深一点""字体更细一点"

### 17.7 上传参考图重新生成(关键功能)

这是你特别提到的需求。流程:

```
用户上传参考图
  ↓
AI 分析参考图:
  - 风格(用 Vision)
  - 配色
  - 构图
  - 细节特征
  ↓
询问用户目标:
  "你想要:
   ○ 完全照着参考图风格重新画一张
   ○ 保留我的产品,换成参考图的风格
   ○ 把参考图的元素融合到我的品牌里"
  ↓
调用对应模型:
  - Flux Kontext(保留某些元素)
  - Flux 1.1 Pro(纯风格迁移)
  - Ideogram(带文字时)
  ↓
生成 4 个候选
  ↓
用户选择 / 保存到媒体库
```

### 17.8 素材版权合规

- 用户上传的素材:用户自己承担版权责任(TOS 约定)
- AI 生成的素材:明确告知"AI 生成,商用请阅读平台 TOS"
- 素材库素材:
  - Pexels / Unsplash:免费商用
  - Poly Haven:CC0
  - Google Fonts:SIL Open Font License
- 所有素材带 license 字段,后台可导出 license 清单

---

## 18. Forgely 管理后台(Admin Panel)

> **目标**:一套美观、现代、易用的电商管理后台,功能对标 Shopify Admin 但 UI 更高级。

### 18.1 为什么不直接用 Medusa Admin?

Medusa 自带 admin UI,但有几个问题:

1. 视觉设计一般,和 Forgely 的高端定位不符
2. 功能对 DTC 品牌主友好度不够
3. 不支持多租户用户隔离(用户看不到其他用户的数据)
4. 无法嵌入 Forgely 的 AI 顾问
5. 不支持主题编辑器

**方案**:**自建 Admin UI,调用 Medusa API**。Medusa 作为 Headless 后端,我们做一套漂亮的前端壳。

### 18.2 Admin Panel 页面结构

```
/admin
├── 📊 仪表盘                    Dashboard(销售 + 订单 + 访客)
├── 📦 商品                      Products
│   ├── 商品列表                 /products
│   ├── 商品详情                 /products/[id]
│   ├── 分类                     /collections
│   ├── 标签                     /tags
│   └── 库存                     /inventory
├── 🛒 订单                      Orders
│   ├── 所有订单                 /orders
│   ├── 订单详情                 /orders/[id]
│   ├── 待发货                   /orders?status=pending
│   ├── 已退款                   /orders?status=refunded
│   └── 异常订单                 /orders/issues
├── 👥 客户                      Customers
│   ├── 客户列表                 /customers
│   ├── 客户详情                 /customers/[id]
│   └── 客户分组                 /segments
├── 💰 营销                      Marketing
│   ├── 优惠码                   /discounts
│   ├── 促销活动                 /campaigns
│   ├── 电子邮件营销             /email
│   ├── SMS 营销(可选)         /sms
│   └── 废弃购物车               /abandoned-carts
├── 📝 内容                      Content(CMS)
│   ├── 页面                     /pages(关于我们、FAQ、博客)
│   ├── 博客文章                 /blog
│   ├── 导航菜单                 /navigation
│   └── 媒体库                   /media
├── 🎨 在线商店                  Online Store
│   ├── 主题编辑器               /editor(见第 19 章)
│   ├── 主题市场                 /themes
│   ├── 域名                     /domains
│   ├── 偏好设置                 /preferences
│   └── 博客设计                 /blog-design
├── 📈 分析                      Analytics
│   ├── 概览                     /analytics
│   ├── 销售                     /analytics/sales
│   ├── 流量                     /analytics/traffic
│   ├── 转化                     /analytics/conversions
│   ├── SEO 表现                 /analytics/seo
│   └── GEO 表现                 /analytics/geo
├── 💳 财务                      Finance
│   ├── 收入                     /finance/revenue
│   ├── 提现                     /finance/payouts
│   ├── 税务                     /finance/taxes
│   └── 发票                     /finance/invoices
├── 🔌 插件                      Apps(见第 22 章)
│   ├── 已安装                   /apps
│   ├── 市场                     /apps/marketplace
│   └── 开发者                   /apps/developers
├── ⚙️ 设置                      Settings
│   ├── 商店信息                 /settings/store
│   ├── 支付                     /settings/payments
│   ├── 运费                     /settings/shipping
│   ├── 税率                     /settings/taxes
│   ├── 结账                     /settings/checkout
│   ├── 通知                     /settings/notifications
│   ├── 用户权限                 /settings/users
│   ├── 品牌 Kit                 /settings/brand
│   ├── 积分 / 订阅              /settings/billing
│   └── API / Webhooks           /settings/api
└── 💬 AI 顾问                   AI Copilot(常驻浮窗,见第 20 章)
```

### 18.3 主要页面设计

#### Dashboard(仪表盘)

```
┌────────────────────────────────────────────────────────────┐
│ 👋 早上好,Alex!今天是 2026 年 4 月 19 日                   │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐     │
│ │ 今日营收 │ │ 今日订单 │ │ 转化率   │ │ 访客     │     │
│ │ $2,847   │ │ 23       │ │ 3.2%     │ │ 1,203    │     │
│ │ ↑ 12.3%  │ │ ↑ 8.1%   │ │ ↓ 0.3%   │ │ ↑ 15.2%  │     │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘     │
│                                                            │
│ 📊 最近 30 天销售(折线图)                                │
│ [图表]                                                     │
│                                                            │
│ 📦 待处理事项                        🔥 热销商品            │
│ • 5 个订单待发货                     1. Primary Essentials │
│ • 2 个客户咨询                          ¥598 · 42 单       │
│ • 3 件商品库存低                     2. Midlife Essentials │
│                                         ¥628 · 31 单       │
│                                                            │
│ 💡 AI 建议                                                 │
│ • 你的"Primary Essentials"转化率高于平均 23%,            │
│   建议加大广告投放                                         │
│ • 昨晚有 12 个废弃购物车,是否发送挽回邮件?              │
│   [一键发送]                                               │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

#### 商品列表

```
┌────────────────────────────────────────────────────────────┐
│ 商品                        [+ 新增商品] [AI 创建] [导入]   │
├────────────────────────────────────────────────────────────┤
│ 🔍 搜索...      筛选:[所有] [已上架] [草稿] [缺货]        │
│                                                            │
│ ☐ | 图 | 名称                 | 状态 | 库存 | 价格  | 操作│
│ ─────────────────────────────────────────────────────────│
│ ☐ |🍷 | Primary Essentials    | ●上架| 120  | $59   | ⋯ │
│ ☐ |🍷 | Midlife Essentials    | ●上架| 85   | $62   | ⋯ │
│ ☐ |🍷 | Postmenopause Essentials| ●草稿| 0   | $65   | ⋯ │
│ ...                                                        │
│                                                            │
│ [批量操作 ▾]   共 23 件      [上一页] 1 [下一页]          │
└────────────────────────────────────────────────────────────┘
```

#### 商品详情(编辑)

```
┌──────────────────────────┬─────────────────────────────────┐
│ 商品信息                 │ 预览(右侧实时)                │
├──────────────────────────┤                                │
│ 标题                     │                                │
│ [Primary Essentials]     │  [产品页实时预览 iframe]       │
│                          │                                │
│ 描述(富文本)            │                                │
│ ┌──────────────────────┐ │                                │
│ │ [工具栏:B I U ...]  │ │                                │
│ │                      │ │                                │
│ │ Comprehensive daily… │ │                                │
│ │                      │ │                                │
│ └──────────────────────┘ │                                │
│ [🤖 让 AI 改写]          │                                │
│                          │                                │
│ 图片 [+]                 │                                │
│ [img1][img2][img3]       │                                │
│                          │                                │
│ 价格 [$59.00]            │                                │
│ 库存 [120]               │                                │
│ SKU [BIO-PE-30]          │                                │
│                          │                                │
│ 分类 [+添加]             │                                │
│ · Supplements            │                                │
│ · Daily Essentials       │                                │
│                          │                                │
│ SEO                      │                                │
│  标题 [自动 / 自定义]    │                                │
│  描述 [...]              │                                │
│  关键词 [...]            │                                │
│ [🤖 优化 SEO]            │                                │
│                          │                                │
│ [保存] [发布] [删除]     │                                │
└──────────────────────────┴─────────────────────────────────┘
```

**关键特性**:

- 每个关键字段旁边都有 **🤖 AI 按钮** — 让 AI 改写、优化、翻译
- 右侧实时预览(调用真实的 storefront 渲染)
- 改完保存自动刷新预览

#### 订单详情

```
┌────────────────────────────────────────────────────────────┐
│ 订单 #FG-20260419-0023                    [发货] [退款]    │
├────────────────────────────────────────────────────────────┤
│ 客户:Alex Johnson <alex@example.com>                      │
│ 时间:2026-04-19 10:23                                    │
│ 金额:$127.00                                             │
│                                                            │
│ 商品                                                        │
│ ┌──────────────────────────────────────────────────────┐ │
│ │ [img] Primary Essentials x 2           $59 · $118   │ │
│ │ [img] Shipping                              $9      │ │
│ └──────────────────────────────────────────────────────┘ │
│                                                            │
│ 配送地址                      付款                         │
│ 123 Main St                   Stripe · **** 4242          │
│ NYC, NY 10001                 已捕获 ✅                    │
│ USA                                                        │
│                                                            │
│ 物流                                                        │
│ 承运商 [UPS ▾]  单号 [输入___] [保存 + 通知客户]          │
│                                                            │
│ 活动日志                                                    │
│ • 2026-04-19 10:23 订单创建                              │
│ • 2026-04-19 10:23 支付成功                              │
│ • 2026-04-19 10:25 发送确认邮件                          │
│ ...                                                        │
└────────────────────────────────────────────────────────────┘
```

### 18.4 Admin UI 技术栈

- Next.js 14 App Router(和主站同一代码库,不同路由前缀 `/admin`)
- Tailwind CSS + shadcn/ui
- **Tremor**(https://tremor.so)— 数据仪表板专用组件库
- TanStack Table(复杂表格)
- TanStack Query(数据请求)
- 参考设计:
  - Shopify Admin(功能完整度)
  - Linear(UI 质感)
  - Vercel Dashboard(排版)
  - Stripe Dashboard(数据展示)

### 18.5 权限系统

多用户 + 角色权限:

| 角色      | 权限                         |
| --------- | ---------------------------- |
| Owner     | 全部                         |
| Admin     | 除账单、用户管理外全部       |
| Staff     | 订单处理、商品编辑、客户查看 |
| Marketing | 优惠码、营销活动、内容       |
| Analyst   | 只读所有数据,不能修改        |

---

## 19. 主题编辑器(Theme Editor)

> **目标**:用户可以在后台直接编辑店铺的视觉主题,类似 Shopify 的 Theme Editor,但带 AI 对话式编辑。

### 19.1 功能定位

**两种编辑模式并存**:

1. **可视化模式** — 点击区块、改属性、拖拽调整(给懂设计的人)
2. **AI 对话模式** — "把 hero 区的背景改成深紫色"(给不懂的人)

两种模式可以随时切换,改同一份 DSL。

### 19.2 界面布局

```
┌──────────────────────────────────────────────────────────────┐
│ 主题编辑器 / BIOLOGICA                 [撤销] [保存] [发布]   │
├─────────────┬─────────────────────────────────┬──────────────┤
│             │                                 │              │
│ 📑 页面     │                                 │ 🎨 属性面板   │
│             │                                 │              │
│ ▾ 🏠 首页   │                                 │ 选中:Hero   │
│   · Hero    │    [页面实时预览]               │              │
│   · 产品展示 │    (iframe 渲染)               │ 背景         │
│   · 故事    │                                 │ [◉渐变 ○图片]│
│   · 评价    │                                 │ 从 [🟣]     │
│   · 页脚    │                                 │ 到 [🟡]     │
│ ▾ 📦 产品页 │                                 │              │
│ ▾ 📄 关于   │                                 │ 标题         │
│ ▾ 📄 FAQ    │                                 │ [BIOLOGICA]  │
│ + 新增页面   │                                 │              │
│             │                                 │ 字号 [XL ▾] │
│ ─────────── │                                 │ 对齐 [居中 ▾]│
│ 💬 AI 助手  │                                 │              │
│             │                                 │ 副标题       │
│ "..."       │                                 │ [...]        │
│             │                                 │              │
│ [输入指令]  │                                 │ CTA 按钮     │
│             │                                 │ 文字 [...]   │
│             │                                 │ 链接 [...]   │
│             │                                 │              │
│             │                                 │ [🤖 AI 优化] │
│             │                                 │              │
└─────────────┴─────────────────────────────────┴──────────────┘
```

**三栏布局**:

- **左**:页面树 + AI 助手(可切换)
- **中**:实时预览(设备切换:桌面/平板/手机)
- **右**:当前选中 block 的属性编辑

### 19.3 核心交互

#### 选择区块

- 在预览里点击一个区块 → 左侧高亮页面树位置,右侧显示属性
- 或者从页面树点击 → 预览里高亮 + 自动滚动

#### 调整属性

- 右侧面板表单式编辑
- 每个字段改完,300ms 延迟后自动应用到预览
- 所有变化实时 diff,按"保存"才持久化

#### 添加新区块

```
点击预览里某个区块的 "+ 添加" →
弹出组件选择面板:
┌────────────────────────────────┐
│ 选择添加的组件                 │
├────────────────────────────────┤
│ 推荐(基于你的品牌风格)        │
│ [Hero 视频] [3D 展示] [评价墙] │
│                                │
│ 全部组件                       │
│ 🏠 Hero 类    [>]             │
│ 📦 产品展示   [>]             │
│ 📖 故事       [>]             │
│ 💬 评价       [>]             │
│ 📸 画廊       [>]             │
│ 🔗 CTA        [>]             │
│ 📧 订阅       [>]             │
│ 🦶 页脚       [>]             │
└────────────────────────────────┘
```

每个组件点开后有 hover 预览 + metadata。

#### AI 对话编辑(关键差异化)

用户可以直接说:

- "把这个 hero 区改得更大胆一点"
- "颜色换成和 Aesop 官网一样的风格"
- "加一个评价区,放在产品展示下面"
- "用 3D 模型替换现在的产品图"
- "整个站看起来太冷了,暖一点"

AI 解析意图 → 修改 DSL → 重新渲染。

### 19.4 技术实现

#### DSL 的实时编辑

```typescript
// 每个用户的站对应一份 DSL
interface Site {
  dsl: SiteDSL
  version: number
  savedAt: Date
  publishedDsl: SiteDSL // 已发布的版本
  publishedAt: Date
}

// 编辑器里修改 dsl
// 预览用 dsl 实时渲染
// 保存 = 更新 dsl
// 发布 = publishedDsl = dsl
```

#### 实时预览架构

```
┌───────────────────────────────┐
│ Editor(左右面板)              │
│ - 修改 dsl                    │
│ - postMessage 给 iframe       │
└───────────────────────────────┘
            ↓ postMessage
┌───────────────────────────────┐
│ Preview iframe                 │
│ - 监听 dsl 变化                │
│ - 重新渲染对应 block           │
│ - 不刷新整页(保持滚动位置)    │
└───────────────────────────────┘
```

#### AI 对话如何改 DSL

```typescript
async function aiEditDSL(userMessage: string, currentDSL: SiteDSL) {
  const response = await claude.chat({
    system: `你是主题编辑器 AI 助手,帮助用户修改他们的电商站 DSL。
      当前 DSL: ${JSON.stringify(currentDSL)}
      可用组件及其 schema: ${JSON.stringify(componentSchemas)}
      返回修改后的 DSL,或者一系列 patch 操作。`,
    messages: [{ role: 'user', content: userMessage }],
  })

  // 应用 patch
  const newDSL = applyPatches(currentDSL, response.patches)
  return newDSL
}
```

### 19.5 版本历史

- 每次保存自动快照
- 用户可以查看/恢复过去 30 天任意版本
- 发布前强制预览所有 breakpoint

```
版本历史
├─ v23 · 5 分钟前 · "AI:改暖色"          [预览] [恢复]
├─ v22 · 2 小时前 · "手动调整"             [预览] [恢复]
├─ v21 · 今天 10:05 · "添加评价区"         [预览] [恢复]
└─ ... (展开更多)
```

### 19.6 设备断点预览

切换预览设备:

- 桌面(1440px)
- 平板(768px)
- 手机(375px)
- 折叠屏(快速切换)

每个断点可以单独调属性(比如手机端隐藏某个 block)。

### 19.7 组件市场嵌入

在左侧"+ 添加组件"里,用户可以:

- 从 Forgely 默认组件库选
- **从 Plugin Marketplace 里浏览第三方组件**(见第 22 章)
- 购买/安装后出现在自己的组件库

---

## 20. 后台 AI 顾问(In-Admin AI Copilot)

> **目标**:在整个后台右下角常驻一个 AI 助手,用户随时可以唤起,问问题、改东西、做数据分析。

### 20.1 功能定位

这不是一个聊天机器人,是**真正能操作后台的 Agent**。它能:

- 查数据("这周卖得最好的三个商品是什么?")
- 改内容("把 Primary Essentials 的描述改得更专业")
- 调主题("把首页 hero 背景改成深蓝")
- 做决策建议("建议我做什么营销活动?")
- 生成素材("帮我为这个新产品生成 3 张场景图")
- 操作订单("给订单 #123 的客户发个致歉 + 10% 优惠码")

### 20.2 界面

常驻右下角按钮:

```
                                           ┌─────┐
                                           │ 💬  │
                                           │ AI  │
                                           └─────┘
```

点开:

```
┌──────────────────────────────────────┐
│ 💬 Forgely AI 顾问              [×]  │
├──────────────────────────────────────┤
│                                      │
│ 👋 你好 Alex!我能帮你:              │
│ • 查数据 · 做分析                    │
│ • 改内容 · 调设计                    │
│ • 管订单 · 管客户                    │
│ • 生成素材 · 写文案                  │
│                                      │
│ 你:                                 │
│ "把首页 hero 区改得更大胆"          │
│                                      │
│ AI(思考中...):                      │
│ "好的,我给你几个方案:              │
│  1. 加大标题字号 40%,改为 bold     │
│  2. 换成高饱和配色(示例)           │
│  3. 添加视频背景                     │
│ 你想要哪个?或者全部?"              │
│                                      │
│ [方案 1] [方案 2] [方案 3] [全部]   │
│                                      │
├──────────────────────────────────────┤
│ 💡 常用:                             │
│ [生成素材] [写文案] [分析销售]       │
├──────────────────────────────────────┤
│ [输入消息...]             [发送]     │
└──────────────────────────────────────┘
```

### 20.3 上下文感知(重要)

AI 知道用户现在在哪个页面,能做对应操作:

| 当前页面   | AI 默认上下文  |
| ---------- | -------------- |
| 商品详情页 | 当前商品数据   |
| 订单详情   | 当前订单       |
| 主题编辑器 | 当前选中的区块 |
| 仪表盘     | 整站数据       |
| 空白       | 全局           |

示例:

- 在商品详情页说"改得更专业"→ 知道改的是"当前这个商品的描述"
- 在订单详情说"给客户道歉"→ 知道是当前订单的客户

### 20.4 Tool Use(AI 能调用的工具)

AI Copilot 有一套后台操作 API,Claude 用 tool use 调用:

```typescript
const adminTools = [
  // 数据查询
  { name: 'query_sales', description: '查询销售数据', params: {...} },
  { name: 'query_orders', description: '查询订单', params: {...} },
  { name: 'query_customers', description: '查询客户', params: {...} },
  { name: 'query_inventory', description: '查询库存', params: {...} },

  // 商品操作
  { name: 'update_product', description: '修改商品', params: {...} },
  { name: 'create_product', description: '创建商品', params: {...} },
  { name: 'rewrite_product_copy', description: '改写商品文案', params: {...} },

  // 主题编辑
  { name: 'modify_theme_block', description: '修改主题 block', params: {...} },
  { name: 'add_theme_block', description: '添加 block', params: {...} },
  { name: 'change_theme_colors', description: '改配色', params: {...} },

  // 素材生成
  { name: 'generate_image', description: '生成图片', params: {...} },
  { name: 'generate_video', description: '生成视频', params: {...} },
  { name: 'generate_3d_model', description: '生成 3D 模型', params: {...} },

  // 营销
  { name: 'create_discount', description: '创建优惠码', params: {...} },
  { name: 'send_email_campaign', description: '发营销邮件', params: {...} },

  // 客户沟通
  { name: 'send_customer_message', description: '给客户发消息', params: {...} },
  { name: 'issue_refund', description: '退款', params: {...} },
]
```

Claude 根据用户请求自动选工具调用。

### 20.5 权限与确认

**重要**:AI 的所有**写操作**都需要用户确认,不能自动执行。

```
AI:"我理解了,要把这个商品的价格从 $59 改成 $49。确认执行吗?"
    [确认] [取消]

用户确认后才真正调用 update_product tool。
```

**读操作**可以自动执行(查数据、分析)。

### 20.6 消耗积分

每次 AI 对话消耗积分(见第 21 章):

- 纯对话(查数据、建议):1 积分
- 写操作(改内容、生成):5-10 积分
- 素材生成(图片、视频、3D):20-200 积分

对话框顶部显示剩余积分:

```
┌──────────────────────────────────────┐
│ 💬 AI 顾问  剩余 1,234 积分  [+购买] │
├──────────────────────────────────────┤
```

### 20.7 记忆系统

AI 记住:

- 最近 10 轮对话(上下文)
- 用户偏好(例如"一直喜欢暖色系")
- 品牌基调(从 BrandKit 读)
- 历史操作记录(避免重复建议)

存储方式:Postgres + pgvector(长期记忆 embedding 检索)。

---

## 21. 积分系统(Credits System)

> **目标**:按量计费,覆盖 AI 成本 + 提供盈利空间。

### 21.1 为什么要积分系统

你说的对 — AI API(Claude、Flux、Kling、Meshy)都是按 token/次付费的,如果包月无限用,成本会失控。积分 = 实际成本挂钩。

竞品参考:

- Lovable:每天 5 积分,Pro $25/月 100 积分
- Bolt.new:token 制,用多花多
- v0:credit 制
- Midjourney:GPU hour

### 21.2 Forgely 积分定价

**1 积分 = $0.01**(方便用户计算)

#### 定价套餐

| 套餐        | 积分   | 价格 | 单价    | 赠送             |
| ----------- | ------ | ---- | ------- | ---------------- |
| Starter 包  | 500    | $5   | $0.01   | —                |
| Pro 包      | 3,000  | $25  | $0.0083 | +500(总 3500)    |
| Business 包 | 10,000 | $79  | $0.0079 | +2,000(总 12000) |
| Scale 包    | 30,000 | $199 | $0.0066 | +8,000(总 38000) |

#### 订阅送积分

- Free:注册送 100 积分(一次性)
- Starter $49/月:每月 1,000 积分
- Pro $149/月:每月 5,000 积分
- Agency $499/月:每月 20,000 积分

**订阅积分当月不用过期**,购买的包永不过期。

### 21.3 积分消耗清单

#### AI 对话类

| 操作               | 积分 | 说明               |
| ------------------ | ---- | ------------------ |
| AI 顾问简单查询    | 1    | 查数据、简单建议   |
| AI 顾问复杂分析    | 5    | 多轮对话、深度分析 |
| 文案改写(单个字段) | 3    | 产品描述、SEO 文案 |
| 文案翻译(整站)     | 50   | 全站中→英          |

#### 生成类

| 操作                  | 积分 | 成本估算   |
| --------------------- | ---- | ---------- |
| 整站生成(AI 一键建站) | 500  | ~$3-5 成本 |
| 单页生成              | 100  |            |
| 主题重新布局          | 50   |            |
| 单个 block 修改       | 10   |            |

#### 素材类

| 操作                       | 积分 | 成本估算    |
| -------------------------- | ---- | ----------- |
| AI 生成 Logo(3 候选)       | 20   | Ideogram x3 |
| AI 生成单张图              | 5    | Flux 一次   |
| AI 生成场景图组(5 张)      | 25   |             |
| AI 生成视频(5 秒)          | 150  | Kling 2.0   |
| AI 生成视频(10 秒)         | 280  |             |
| AI 生成 3D 模型            | 100  | Meshy       |
| 图片风格迁移(Flux Kontext) | 10   |             |
| 批量去背景(10 张)          | 20   |             |

#### SEO / GEO 类

| 操作                  | 积分 |
| --------------------- | ---- |
| 关键词研究(单次)      | 5    |
| SEO 全站优化          | 100  |
| 竞品分析              | 30   |
| 生成博客文章(1000 词) | 20   |

#### 营销类

| 操作            | 积分 |
| --------------- | ---- |
| AI 写营销邮件   | 10   |
| AI 生成广告素材 | 20   |
| 客户细分建议    | 5    |

### 21.4 积分消耗流程

```
用户触发 AI 操作
  ↓
检查余额:
  - 够 → 预扣积分(pending)
  - 不够 → 提示充值 / 升级订阅
  ↓
执行操作
  ↓
成功 → 真实扣费
失败 → 退还预扣积分
  ↓
日志记录(积分历史)
```

### 21.5 积分日志(用户可见)

```
┌────────────────────────────────────────────────────┐
│ 积分历史                                余额:1,234  │
├────────────────────────────────────────────────────┤
│ 2026-04-19 15:30  AI 生成视频(10s)         -280 │
│ 2026-04-19 14:15  AI 改写产品描述            -3   │
│ 2026-04-19 10:00  订阅月度赠送              +5000 │
│ 2026-04-18 18:23  AI 生成 Logo              -20  │
│ 2026-04-18 18:00  AI 生成场景图 x5          -25  │
│ ...                                                │
│                                                    │
│ [导出 CSV]                      [购买更多积分]    │
└────────────────────────────────────────────────────┘
```

### 21.6 防滥用机制

- **单次操作上限**:一次不能消耗超过 1000 积分
- **每日上限**:Starter 每天 500 积分上限(防脚本刷)
- **速率限制**:AI 调用每分钟最多 10 次
- **异常监控**:短时间大量消耗触发告警,人工审查

### 21.7 积分系统技术实现

```typescript
// Prisma schema
model UserCredits {
  id          String   @id @default(cuid())
  userId      String   @unique
  user        User     @relation(fields: [userId], references: [id])
  balance     Int      @default(0)          // 当前余额
  reserved    Int      @default(0)          // 预扣中
  lifetimeEarned Int   @default(0)          // 累计获得
  lifetimeSpent  Int   @default(0)          // 累计消耗
  updatedAt   DateTime @updatedAt
}

model CreditTransaction {
  id          String   @id @default(cuid())
  userId      String
  type        String   // 'purchase' | 'subscription' | 'consumption' | 'refund' | 'gift'
  amount      Int      // 正数:获得,负数:消耗
  balance     Int      // 交易后余额
  description String
  metadata    Json?    // 关联的 generation_id / asset_id 等
  createdAt   DateTime @default(now())

  @@index([userId, createdAt])
}
```

```typescript
// 关键 API
async function consumeCredits(userId: string, amount: number, desc: string) {
  return prisma.$transaction(async (tx) => {
    const credits = await tx.userCredits.findUnique({ where: { userId } })
    if (!credits || credits.balance < amount) {
      throw new InsufficientCreditsError()
    }

    const updated = await tx.userCredits.update({
      where: { userId },
      data: {
        balance: { decrement: amount },
        lifetimeSpent: { increment: amount },
      },
    })

    await tx.creditTransaction.create({
      data: {
        userId,
        type: 'consumption',
        amount: -amount,
        balance: updated.balance,
        description: desc,
      },
    })

    return updated.balance
  })
}
```

### 21.8 Stripe 支付集成

积分充值走 Stripe:

```typescript
// 充值 Pro 包
const session = await stripe.checkout.sessions.create({
  line_items: [
    {
      price_data: {
        currency: 'usd',
        unit_amount: 2500, // $25
        product_data: { name: 'Forgely Pro Credits (3,500)' },
      },
      quantity: 1,
    },
  ],
  mode: 'payment',
  success_url: `${APP_URL}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
  cancel_url: `${APP_URL}/billing`,
})

// webhook 处理:
// stripe.webhook('checkout.session.completed') → 给用户加 3500 积分
```

---

## 22. 插件市场(Plugin Marketplace)

> **目标**:类似 Shopify App Store,让第三方开发者扩展 Forgely 功能,让用户一键安装。

### 22.1 插件类型

| 类型                 | 例子                                                 |
| -------------------- | ---------------------------------------------------- |
| **Payment**          | 添加本地支付方式(Klarna、iDEAL、支付宝国际)          |
| **Marketing**        | 邮件工具(Klaviyo)、广告追踪(Meta Pixel)、评价(Yotpo) |
| **Shipping**         | ShipStation、EasyPost、顺丰                          |
| **Analytics**        | GA4、Hotjar、Mixpanel                                |
| **Theme Components** | 第三方组件库(如"日式极简组件包")                     |
| **Content**          | 博客工具、翻译、SEO 工具                             |
| **Customer Service** | 客服 Chat(Intercom、Crisp)                           |
| **Integration**      | CRM(HubSpot)、ERP(NetSuite)                          |

### 22.2 插件架构

**插件 = 一个符合 Forgely Plugin SDK 的 npm 包**

```typescript
// forgely-plugin-klaviyo/index.ts
import { definePlugin } from '@forgely/plugin-sdk'

export default definePlugin({
  id: 'klaviyo',
  name: 'Klaviyo Email Marketing',
  version: '1.0.0',
  description: '...',
  icon: 'https://...',
  author: { name: '...', url: '...' },

  // 配置 schema
  config: {
    apiKey: { type: 'string', required: true, label: 'Klaviyo API Key' },
    listId: { type: 'string', label: 'Default List ID' },
  },

  // 后台页面(可选)
  adminPages: [
    { path: '/apps/klaviyo/dashboard', component: 'DashboardPage' },
    { path: '/apps/klaviyo/lists', component: 'ListsPage' },
  ],

  // 前端 embed(可选,如 Pixel)
  storefrontEmbed: {
    head: '<script src="https://static.klaviyo.com/..." />',
  },

  // Hooks(电商事件触发)
  hooks: {
    'order.created': async (order, config) => {
      await klaviyo.track('Placed Order', order, config.apiKey)
    },
    'customer.created': async (customer, config) => {
      await klaviyo.addToList(customer.email, config.listId)
    },
  },

  // 工具方法(暴露给 AI Copilot 使用)
  tools: [
    {
      name: 'klaviyo_send_campaign',
      description: '发送 Klaviyo 邮件营销',
      params: { subject: 'string', body: 'string', segmentId: 'string' },
      execute: async (params, config) => {...}
    }
  ]
})
```

### 22.3 插件安装流程

```
用户在市场浏览
  ↓
选择插件 → 查看详情(描述、评分、价格、截图)
  ↓
点"安装"
  ↓
付费(如果是付费插件)/ 免费直装
  ↓
配置(填 API key 等)
  ↓
激活 → 插件 hooks 生效,管理页面出现在侧栏
```

### 22.4 插件审核

所有插件上架前必须经过审核:

- 代码安全扫描
- 权限最小化检查
- 不读取敏感数据(支付信息、密码)
- 不影响主站性能
- 符合 Forgely TOS

### 22.5 开发者收益分成

- 免费插件:开发者 0 收入
- 付费插件:开发者 70% / Forgely 30%
- 月付订阅插件:同上
- 插件内加购:开发者自行通过自己的 Stripe 结算(Forgely 不抽成)

### 22.6 Marketplace UI

```
┌──────────────────────────────────────────────────────────┐
│ Forgely 插件市场     [所有] [付费] [免费]  🔍 搜索        │
├──────────────────────────────────────────────────────────┤
│ 分类:                                                    │
│ 💰支付 📧邮件 📦物流 📊分析 🎨主题 ✍️内容 💬客服 🔌集成  │
│                                                          │
│ ⭐ 推荐                                                   │
│ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐           │
│ │Klaviyo │ │ Stripe │ │Shipstn │ │ Yotpo  │           │
│ │★4.9    │ │★5.0    │ │★4.7    │ │★4.6    │           │
│ │$29/月  │ │ 免费   │ │ $19/月 │ │$15/月  │           │
│ └────────┘ └────────┘ └────────┘ └────────┘           │
│                                                          │
│ 🆕 最新上架                                               │
│ ...                                                      │
│                                                          │
│ 📖 成为开发者 →                                          │
└──────────────────────────────────────────────────────────┘
```

### 22.7 MVP 阶段先不做 Marketplace

优先级:

- **Phase 1(MVP 必须)**:内置插件(Stripe、PayPal、GA4、Klaviyo)写死在代码里
- **Phase 2(6 个月后)**:抽象 Plugin SDK,内置插件改造成插件格式
- **Phase 3(12 个月后)**:开放第三方开发者 + Marketplace UI

---

## 23. 内容管理(CMS)与文案编辑

> **目标**:用户可以编辑所有非商品的内容 — 页面、博客、FAQ、导航、页脚等。

### 23.1 可编辑的内容类型

| 类型                | 示例                                 |
| ------------------- | ------------------------------------ |
| **Pages**           | About Us, Contact, FAQ, Privacy, TOS |
| **Blog Posts**      | 品牌文章、产品评测、生活方式         |
| **Navigation**      | 主导航、页脚导航、移动端菜单         |
| **Announcements**   | 顶部通告栏("Free shipping over $50") |
| **Pop-ups**         | Newsletter 弹窗、退出挽留弹窗        |
| **Email Templates** | 订单确认、发货通知、欢迎邮件         |
| **Legal**           | 隐私政策、退货政策、DSA 信息         |

### 23.2 富文本编辑器

用 **Tiptap**(开源,扩展性好):

- 基础格式:粗体、斜体、下划线、链接
- 段落、标题、列表、引用
- 图片上传(连接媒体库)
- 视频嵌入(YouTube、Vimeo)
- 代码块
- 表格
- 自定义 block(产品卡片、CTA 按钮)

### 23.3 AI 辅助写作

每个编辑器顶部:

```
┌────────────────────────────────────────────────────────┐
│ [B] [I] [U] [🔗] [📷] [📺] | [🤖 AI] [撤销] [保存]     │
├────────────────────────────────────────────────────────┤
│                                                        │
│ (富文本内容...)                                        │
│                                                        │
└────────────────────────────────────────────────────────┘
```

点 🤖 AI 弹出:

```
┌─────────────────────────────────┐
│ AI 写作助手                      │
├─────────────────────────────────┤
│ 快捷操作:                       │
│ • 改写得更专业                   │
│ • 改写得更友好                   │
│ • 改得更短                       │
│ • 改得更长                       │
│ • 翻译成英文                     │
│ • 优化 SEO                       │
│                                  │
│ 或者输入自定义指令:              │
│ [________________________]       │
│                                  │
│ [应用到整篇] [只改选中]  [取消]  │
└─────────────────────────────────┘
```

### 23.4 博客系统

**博客列表**:

- 标题、封面、作者、发布时间、标签
- 状态(草稿 / 已发布 / 计划发布)
- SEO 字段(meta title/desc、slug)
- 分享统计

**博客编辑器**:

- Tiptap 富文本
- 自动生成 slug + 允许修改
- 关键词密度实时显示
- AI 建议相关产品链接
- 预览模式(桌面 + 手机)
- 计划发布(未来日期)

**AI 博客生成**(消耗积分):

```
┌─────────────────────────────────────┐
│ AI 生成博客                          │
├─────────────────────────────────────┤
│ 主题:                               │
│ [如何选择适合的每日维生素_______]    │
│                                     │
│ 关键词(SEO):                       │
│ [daily vitamins, women 30s______]   │
│                                     │
│ 字数:                               │
│ ○ 500  ●1000  ○2000                │
│                                     │
│ 风格:                               │
│ ○ 专业  ●友好  ○科普               │
│                                     │
│ 引用产品:                           │
│ ☑ Primary Essentials                │
│ ☐ Midlife Essentials                │
│                                     │
│ [生成(消耗 20 积分)]               │
└─────────────────────────────────────┘
```

### 23.5 导航菜单编辑器

拖拽式:

```
┌──────────────────────────────────────┐
│ 主导航                                │
├──────────────────────────────────────┤
│ ⋮ Shop                               │
│   ⋮ Primary Essentials               │
│   ⋮ Midlife Essentials               │
│   ⋮ Postmenopause Essentials         │
│   [+ 添加子菜单]                     │
│ ⋮ Science                            │
│ ⋮ About                              │
│ ⋮ Blog                               │
│ [+ 添加菜单项]                       │
└──────────────────────────────────────┘
```

### 23.6 邮件模板编辑

订单确认、发货、欢迎、挽回等模板,用**MJML**(响应式邮件标准):

- 可视化编辑
- 变量插入({{customer_name}}、{{order_number}})
- AI 改写文案
- 多语言版本
- 发送测试邮件

---

## 24. 数据库 Schema 扩展

> 在 v1.0 基础上增加的表:

```prisma
// 品牌资产
model BrandKit {
  id            String   @id @default(cuid())
  userId        String
  siteId        String?  @unique
  name          String
  logoPrimary   String?
  logoVariants  Json     // { light, dark, white, black, icon, favicon }
  colors        Json     // { primary, secondary, accent, bg, fg, semantic }
  fonts         Json     // { heading: {...}, body: {...} }
  voice         Json     // { tone, keywords, avoidWords, samplePhrases }
  imageStyle    Json     // { mood, colorGrading, composition }
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

// 媒体库
model MediaAsset {
  id            String   @id @default(cuid())
  userId        String
  siteId        String?
  type          String   // 'image' | 'video' | '3d_model' | 'icon' | 'audio'
  url           String
  thumbnailUrl  String?
  filename      String
  size          Int      // bytes
  dimensions    Json?    // { width, height }
  mimeType      String
  source        String   // 'uploaded' | 'ai_generated' | 'library'
  generator     String?  // 'flux' | 'kling' | 'meshy' | 'ideogram' | null
  prompt        String?  // AI 生成的 prompt(如果是 AI 生成)
  tags          String[]
  usedIn        Json?    // 使用位置列表
  createdAt     DateTime @default(now())

  @@index([userId, type])
  @@index([siteId, type])
}

// 主题编辑器版本历史
model ThemeVersion {
  id            String   @id @default(cuid())
  siteId        String
  version       Int
  dsl           Json     // 完整 SiteDSL
  description   String   // "AI 改色" / "手动调整" / ...
  editorType    String   // 'ai_chat' | 'visual' | 'import'
  createdBy     String   // userId
  createdAt     DateTime @default(now())

  @@unique([siteId, version])
  @@index([siteId, createdAt])
}

// CMS 内容
model Page {
  id            String   @id @default(cuid())
  siteId        String
  type          String   // 'page' | 'blog' | 'legal'
  slug          String
  title         String
  content       Json     // Tiptap JSON
  featuredImage String?
  seoTitle      String?
  seoDescription String?
  seoKeywords   String[]
  status        String   // 'draft' | 'published' | 'scheduled'
  publishedAt   DateTime?
  scheduledFor  DateTime?
  author        String?
  tags          String[]
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@unique([siteId, slug])
}

// 积分系统
model UserCredits {
  id            String   @id @default(cuid())
  userId        String   @unique
  balance       Int      @default(0)
  reserved      Int      @default(0)
  lifetimeEarned Int     @default(0)
  lifetimeSpent  Int     @default(0)
  updatedAt     DateTime @updatedAt
}

model CreditTransaction {
  id            String   @id @default(cuid())
  userId        String
  type          String   // 'purchase' | 'subscription' | 'consumption' | 'refund' | 'gift' | 'promotion'
  amount        Int      // 正数:获得,负数:消耗
  balance       Int      // 交易后余额
  description   String
  metadata      Json?    // 关联 generation_id / asset_id / operation 等
  createdAt     DateTime @default(now())

  @@index([userId, createdAt])
}

model CreditsPackage {
  id            String   @id @default(cuid())
  name          String
  credits       Int
  priceUsd      Int      // 美分
  bonusCredits  Int      @default(0)
  popular       Boolean  @default(false)
  active        Boolean  @default(true)
}

// AI 顾问会话
model AiConversation {
  id            String   @id @default(cuid())
  userId        String
  siteId        String?
  context       Json?    // 当前页面、选中 block 等
  messages      Json     // [{ role, content, toolCalls, ... }]
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([userId, updatedAt])
}

// 插件系统
model InstalledPlugin {
  id            String   @id @default(cuid())
  siteId        String
  pluginId      String   // 'klaviyo' | 'stripe' | ...
  version       String
  config        Json     // 用户配置(API key 等,加密存储)
  enabled       Boolean  @default(true)
  installedAt   DateTime @default(now())

  @@unique([siteId, pluginId])
}

// Scraper 规则库(兜底 AI 学到的规则)
model ScraperRule {
  id            String   @id @default(cuid())
  hostname      String   @unique  // 例如 "example.com"
  selectors     Json     // AI 学到的 CSS selector
  successRate   Float    // 历史成功率
  lastUsedAt    DateTime @default(now())
  createdAt     DateTime @default(now())
}

// 抓取历史
model ScrapeHistory {
  id            String   @id @default(cuid())
  userId        String
  sourceUrl     String
  platform      String?
  status        String   // 'success' | 'partial' | 'failed'
  productCount  Int      @default(0)
  errorMessage  String?
  rawData       Json?    // 原始抓取数据(缓存 24h)
  expiresAt     DateTime
  createdAt     DateTime @default(now())
}

// 导航菜单
model NavigationMenu {
  id            String   @id @default(cuid())
  siteId        String
  type          String   // 'main' | 'footer' | 'mobile'
  items         Json     // 嵌套菜单结构
  updatedAt     DateTime @updatedAt
}

// 通告栏
model Announcement {
  id            String   @id @default(cuid())
  siteId        String
  message       String
  link          String?
  startsAt      DateTime?
  endsAt        DateTime?
  active        Boolean  @default(true)
}

// 邮件模板
model EmailTemplate {
  id            String   @id @default(cuid())
  siteId        String
  type          String   // 'order_confirmation' | 'shipping' | 'welcome' | ...
  subject       String
  mjml          String   // MJML source
  html          String   // 编译后
  variables     Json     // 可用变量
  language      String   @default('en')

  @@unique([siteId, type, language])
}
```

---

## 25. 后台用户界面设计规范

### 25.1 设计原则

1. **少而精** — Linear / Vercel Dashboard 的极简感,不是 Shopify 的复杂
2. **深色优先** — 默认深色模式,对长时间盯屏幕友好
3. **键盘友好** — 主要操作有快捷键(cmd+K 打开命令面板)
4. **数据可视化** — 数据多的地方用好的图表,不堆数字

### 25.2 设计系统

```
颜色(深色模式):
  bg-primary      #0A0A0B
  bg-secondary    #141416
  bg-elevated     #1C1C1F
  border          #2A2A2E
  text-primary    #FFFFFF
  text-secondary  #A1A1AA
  accent          #F5A524 (Forgely 品牌色,火焰橙)
  success         #22C55E
  warning         #EAB308
  error           #EF4444

字体:
  heading: Inter Display
  body: Inter
  mono: JetBrains Mono

间距:4/8/12/16/24/32/48/64

圆角:4/6/8/12/16

阴影:
  sm: 0 1px 2px rgba(0,0,0,0.3)
  md: 0 4px 12px rgba(0,0,0,0.4)
  lg: 0 12px 32px rgba(0,0,0,0.5)
```

### 25.3 关键组件参考

- **侧边栏** → Linear 风格
- **表格** → TanStack Table,可排序可筛选
- **数据卡片** → Tremor Card
- **图表** → Tremor + Recharts
- **表单** → React Hook Form + Zod + shadcn Form
- **命令面板** → cmdk(Linear、Raycast 同款)
- **Toast** → Sonner
- **Skeleton** → shadcn

### 25.4 响应式策略

Admin 主要在桌面用,但需要基本移动端适配:

- Desktop(>1024):完整布局
- Tablet(768-1024):侧边栏可折叠
- Mobile(<768):底部 tab + 精简功能

---

## 26. v1.1 任务补充

> 这些 Task 在 v1.0 的 18 个 Task 基础上新增。

### Task 19:多源站 Scraper 扩展

```
在 lib/scraper/ 下实现以下 Adapter:
- BigCommerceAdapter
- AmazonAdapter(用 ScraperAPI)
- AliExpressAdapter(用 ScraperAPI)
- EtsyAdapter
- GenericAIAdapter(兜底,用 Playwright + Claude Vision)

要求:
- 每个 Adapter 实现 ScraperAdapter 接口
- canHandle() 检测准确
- 输出统一的 ScrapedData 格式
- 单元测试覆盖 80%
- 失败降级到下一个 Adapter

在 lib/scraper/index.ts 实现调度逻辑:
- 按 Adapter 优先级检测
- 第一个 match 的执行
- 全部失败用 GenericAI
```

### Task 20:品牌资产系统

```
实现:
1. BrandKit CRUD(app/admin/settings/brand/)
2. 媒体库(app/admin/media/)
3. Logo 上传 + 自动生成变体
4. Logo AI 生成流程(Ideogram)
5. 参考图上传 + 重新生成(Flux Kontext)
6. 配色板管理
7. 字体管理(Google Fonts + 自定义上传)
8. 素材存储到 R2 + 元数据入库

要求:
- 所有图片自动生成缩略图 + WebP 变体
- 3D 模型自动用 gltf-transform 压缩
- 所有 AI 生成消耗对应积分
```

### Task 21:Admin Panel 骨架

```
在 app/admin/ 下实现完整管理后台:

路由:
- /admin/dashboard
- /admin/products, /products/[id]
- /admin/orders, /orders/[id]
- /admin/customers, /customers/[id]
- /admin/collections
- /admin/discounts
- /admin/pages, /pages/[slug]
- /admin/blog, /blog/[slug]
- /admin/analytics
- /admin/settings/*
- /admin/apps
- /admin/media

要求:
- 深色模式优先
- Tremor + shadcn/ui
- Linear 风格侧边栏
- 命令面板(cmd+K)
- 所有列表页支持搜索、筛选、排序、分页
- 所有详情页支持 AI 辅助按钮
- 实时预览(iframe)
```

### Task 22:主题编辑器

```
实现 app/admin/editor/[siteId]/page.tsx:

三栏布局:
- 左:页面树 + AI 助手(tab 切换)
- 中:iframe 实时预览 + 设备切换
- 右:block 属性编辑器

功能:
1. 点击预览里的 block → 高亮 + 右侧显示属性
2. 拖拽 block 调整顺序
3. 添加新 block(打开组件选择面板)
4. 删除 block(确认)
5. 复制 block
6. 属性编辑表单(根据 block schema 自动生成)
7. AI 对话编辑(调 Claude,返回 DSL patch)
8. 版本历史(保存/恢复)
9. 保存 + 发布(区分草稿和线上)
10. 撤销/重做(基于 DSL diff)

技术:
- dnd-kit 拖拽
- React Hook Form 属性表单
- jsondiffpatch 做版本对比
- postMessage 和 iframe 通信
```

### Task 23:AI Copilot(常驻后台)

```
实现:
1. 右下角常驻浮窗(Framer Motion 动画)
2. 点击打开 / 关闭 Drawer
3. 聊天界面(类似 Claude.ai)
4. 上下文感知(读当前 URL、当前选中对象)
5. Tool Use 架构:
   - 定义所有 admin 工具(query_sales, update_product, ...)
   - Claude 调用工具时前端拦截确认
   - 用户确认后执行
6. 流式输出(SSE)
7. 消耗积分(每次调用扣相应积分)
8. 对话历史持久化(AiConversation 表)
9. 长期记忆(pgvector 检索用户偏好)

要求:
- 低延迟(< 500ms 开始输出)
- 写操作必须确认
- 读操作自动执行
- 失败回退 + 重试
```

### Task 24:积分系统

```
实现:
1. Prisma migration 加所有积分相关表
2. lib/credits/ 模块:
   - consumeCredits(userId, amount, desc)
   - addCredits(userId, amount, type, desc)
   - getBalance(userId)
   - getHistory(userId)
3. Stripe 集成:
   - 积分包 checkout session
   - webhook 处理(充值成功加积分)
4. 订阅积分:
   - Stripe 订阅 webhook → 每月重置赠送积分
5. 前端:
   - /admin/settings/billing 页面
   - 积分余额(顶部导航常驻)
   - 积分历史(表格)
   - 购买积分包
6. 所有 AI 操作加积分检查和扣费

要求:
- 事务性(所有消耗都是 transaction)
- 预扣机制(失败退还)
- 防并发问题(行锁)
- 日志详尽
```

### Task 25:CMS 系统

```
实现:
1. 页面管理(pages)
2. 博客系统(blog)
3. Tiptap 富文本编辑器
4. AI 写作辅助按钮
5. 导航菜单编辑器(dnd-kit)
6. 邮件模板管理
7. 预览功能
8. 定时发布
9. SEO 字段 + 实时预览

要求:
- 所有内容支持多语言(虽然 MVP 只英文,留接口)
- AI 写作消耗积分
- 图片从媒体库选或直接上传
```

### Task 26:前后台打通

```
确保前台(用户站)和后台完全联动:
1. 后台改商品 → 前台自动更新
2. 后台改主题 → 前台实时渲染(CDN 缓存刷新)
3. 后台改页面 → 前台路由生效
4. 订单流:前台下单 → 后台订单列表实时出现 → 后台改状态 → 前台订单查询同步

要求:
- 用 Postgres LISTEN/NOTIFY 或 Redis pub/sub
- 关键数据 CDN 缓存失效策略
- 实时订单通知(Web Push + Email)
```

---

## 27. 更新后的 MVP 开发计划(18 周)

原 14 周 MVP 因新增大量后台功能,扩展为 **18 周**:

### Week 0-2:基础(同 v1.0)

项目脚手架、shadcn、Aceternity、Magic UI、Storybook

### Week 3:标杆站采集(同 v1.0)

150 站反向工程

### Week 4:美学 Preset + DSL(同 v1.0)

### Week 5-6:AI 编排层 + 多源 Scraper(扩展)

- v1.0 的 AI Agent
- **新增**:Task 19 多 Adapter

### Week 7-8:自研 3D 组件库(同 v1.0)

### Week 9:品牌资产系统(新增)

- Task 20:BrandKit + 媒体库 + Logo 生成/上传

### Week 10:Medusa 电商(同 v1.0)

### Week 11-12:Admin Panel(新增,重头戏)

- Task 21:完整管理后台 UI
- 所有 CRUD 页面
- Tremor 数据仪表

### Week 13:主题编辑器(新增)

- Task 22:可视化 + AI 对话编辑

### Week 14:AI Copilot(新增)

- Task 23:常驻后台 AI 助手

### Week 15:积分系统 + Stripe 订阅(新增)

- Task 24:完整积分体系

### Week 16:CMS + 文案(新增)

- Task 25:页面、博客、导航、邮件

### Week 17:前后台联动 + 部署(扩展)

- Task 26:数据同步
- v1.0 的 Cloudflare 部署

### Week 18:合规 + SEO/GEO + 内测(同 v1.0)

---

## 附录 E:v1.1 新增 API 成本

单次完整使用场景(用户建站 + 后台编辑 + 上架商品):

| 场景            | 积分消耗 | 成本  | 用户感知           |
| --------------- | -------- | ----- | ------------------ |
| 一次建站        | ~500     | $4-5  | 给用户做最重要的事 |
| 10 次小 AI 操作 | ~50      | $0.3  | 日常调整           |
| 生成 1 个视频   | ~200     | $1-2  | 偶尔重做           |
| 生成 10 张图    | ~50      | $0.5  | 常见               |
| AI 顾问闲聊     | ~10      | $0.05 | 每天几次           |

典型 Pro 用户月消耗:5000-8000 积分(相当于 $50-80 成本)。
Pro 订阅 $149 包 5000 积分,再加售卖积分包,综合毛利 40-60%。

---

**文档版本**:v1.1
**最后更新**:2026-04-19
**变更**:新增第 16-27 章,补齐多源抓取、品牌资产、后台、主题编辑、AI Copilot、积分系统、插件市场、CMS 模块。

## 总结

v1.0 解决了"从 0 到 1 生成一个站"的问题。
v1.1 解决了"用户长期使用、管理、进化这个站"的问题。

两者合起来,Forgely 就是一个完整的、可盈利的、有深度壁垒的产品。
