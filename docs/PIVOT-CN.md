# Forgely 中国 B 端用户运营海外品牌站 Pivot（v2.0）

> **决策日期**：2026-04-19（2026-04-19 重订正）
> **状态**：锁定
> **核心定位**：付费用户（B 端）来自中国，生成的独立站面向海外（欧美 DTC）消费者

## 0. 关键定位（必读）

**两层完全分离的产品**：

| 层 | 给谁用 | 语言 | 登录 | 收款 | 合规 | LLM | 部署 |
|---|---|---|---|---|---|---|---|
| **Forgely 平台**（forgely.cn / app.forgely.cn — B 端工具） | **中国 B 端付费用户**（工厂主/品牌主/出海卖家） | **中文** | **微信扫码 / 手机号 OTP** | **微信支付 / 支付宝**（Forgely 月费订阅） | 国内：广告法 / 个保法 / 电商法 | DeepSeek / Qwen（成本 + 稳定） | 阿里云 / 腾讯云国内节点 |
| **用户生成的独立站**（toybloom.forgely.app / 自定义域 — C 端店铺） | **海外终端消费者**（US/EU/UK/CA） | **英文优先** + 多语言 | 标准 email / Google OAuth | **Stripe + PayPal**（用户店铺收款） | **FTC / FDA / CPSIA / GDPR / DSA / Prop65**（站点目标受众的法规） | Claude Sonnet 4 + Kling 2.0 + Flux + Meshy | **Cloudflare Pages + Workers + R2** |

**核心 Persona**：
- **A（中国工厂出海）** ← 主力，70% 流量预期：中国珠三角 / 长三角工厂主，想做自己的欧美品牌但英文差、不会做站、不懂海外审美和合规。Forgely 帮他们用中文操作、生成英文电商站、部署在 Cloudflare 卖给老外、用 Stripe 收美元。
- **B（中国新锐 DTC 出海）**：美妆 / 玩具 / 家居 / 服饰品牌，已经有产品但卡在"做不出 BIOLOGICA / Aesop 那种站"。

**不做**：
- ❌ 给国内 C 端消费者卖货的站（天猫 / 拼多多 / 抖店生态）
- ❌ 微信小程序商城（不在 Cloudflare Pages 范围）

---

## 1. 用户语言：B 端中文 / 站点英文

| 维度 | Forgely 平台 | 用户生成的独立站 |
|---|---|---|
| 默认 UI 语言 | **`zh-CN` 简体中文** | **`en` 英文** |
| 备选 | `en`（让外籍合伙人 / Agency 用） | `de` / `fr` / `es` / `pt` 等海外多语 |
| 客服 / 文档 | 中文为主 | 英文为主 |

## 2. 登录与身份（**仅 Forgely 平台 = B 端**）

> 这层只影响**中国 B 端用户登录 Forgely 后台**。用户**生成的独立站**给海外消费者用，仍是标准 email / Google OAuth + Apple ID（沿用 W3/W6 已实现）。

| 方式 | 优先级 | 实现 | 服务商 |
|---|---|---|---|
| **微信扫码登录** | P0 主用 | OAuth2.0 微信开放平台 | <https://open.weixin.qq.com> |
| **手机号 + 短信 OTP** | P0 主用 | 阿里云/腾讯云短信 SDK | 阿里云 SMS / 腾讯云 SMS |
| 邮箱 + 密码 | P1 备用 | 沿用 W3 已实现的 argon2 + Auth.js 链路 | 自建 |
| 企业微信 | P2（V2） | OAuth | 企业微信开放平台 |
| 钉钉 | P2（V2） | OAuth | 钉钉开放平台 |

**Schema 改动**（追加到 `services/api/prisma/schema.prisma`）：
- `WechatAccount`：openid / unionid / nickname / avatarUrl / scope / accessToken / refreshToken / expiresAt
- `PhoneOtp`：phoneE164 / codeHash / purpose（login/bind/verify）/ attempts / expiresAt / consumedAt
- `User.phoneE164`、`User.wechatUnionId` 字段（可空）

**审计**：保留 W3 实现的 LoginEvent + AuditLog，新增 `provider` 字段记录 `wechat` / `phone` / `email`。

## 3. 支付层 — **两层完全独立的支付**

### 3.1 Forgely 平台收 B 端订阅 / 积分（中国 B 端用户付月费）

| 渠道 | 优先级 | 实现 |
|---|---|---|
| **微信支付（JSAPI / Native / H5）** | P0 | `services/api/src/payments/wechat.ts` |
| **支付宝（PC / Wap / App）** | P0 | `services/api/src/payments/alipay.ts` |
| 银联云闪付 | P2 | TBD |
| Stripe / PayPal | 备用（接外籍 Agency 客户） | 沿用 W3 已实现 |

**计费货币**：Forgely 平台月费 / 积分包 = **CNY**（外籍客户可切 USD）

### 3.2 用户独立站收 C 端货款（海外消费者刷信用卡）

| 渠道 | 优先级 | 实现 |
|---|---|---|
| **Stripe Connect**（推荐，分账）| P0 | 用户在 Forgely 后台 OAuth 授权 → 走 Stripe Connect 模式，平台抽成可选 |
| **PayPal** | P0 | 沿用 |
| **Apple Pay / Google Pay** | P0 | Stripe 内置 |
| **NOWPayments（crypto）** | P1 | 沿用 |

**计费货币**：用户店铺默认 **USD**，可设 EUR / GBP / CAD 等

**自研模块**：`services/api/src/payments/{wechat,alipay,unionpay}.ts`，统一接口 `PaymentProvider`：
```ts
interface PaymentProvider {
  createCheckout(opts: { amountCents, orderId, returnUrl, description }): Promise<{ url: string; qrCode?: string; prepayId?: string }>
  verifyWebhook(req: Request): Promise<WebhookEvent>
  refund(opts: { paymentId: string; amountCents: number }): Promise<RefundResult>
}
```

**计费货币**：默认 CNY（人民币），跨境站可切 USD。

## 4. AI / LLM 层 — **服务端按部署区域选**

> 这层与"站点 / 平台"无关，是**服务端调用 LLM 时**的物流选择。Forgely 服务端在国内部署 → 走国内 LLM 减少延迟 + 成本；海外部署 → 走 Claude。

| Provider | 用途 | 模型 | 何时用 |
|---|---|---|---|
| **DeepSeek** | P0 国内默认 | `deepseek-chat` / `coder` / `vl`（视觉） | 服务端 deploy 在中国 → 主用 |
| **通义千问（Qwen）** | P0 国内备份 | `qwen-max` / `qwen-vl-max` | DeepSeek 限流时切 |
| **Claude Sonnet 4 / Opus 4** | P0 海外默认 | `claude-sonnet-4` / `opus-4` | 服务端 deploy 在 Cloudflare/Vercel 海外 → 主用，质量最佳 |
| Kimi（Moonshot） | P1 | `moonshot-v1-128k` | 长上下文场景 |
| 智谱 GLM | P1 | `glm-4` / `glm-4v` | 备份 |

**provider 解析**：`FORGELY_LLM_REGION=cn`（默认走 DeepSeek/Qwen），`=global`（走 Claude）。**生成的独立站质量完全不受影响**——给海外消费者看的英文文案、视频 prompt 都来自统一 `LlmProvider` 接口。

## 5. 视频 / 图像生成

| 类型 | v1.2 旧 | v2.0 中国版 |
|---|---|---|
| 视频 | Kling 2.0 + Runway Gen-4 | **Vidu / 即梦 / MiniMax abab-video / Kling**（Kling 在国内可用） |
| 图像 | Flux 1.1 Pro + Ideogram 3.0 | 通义万相 / Recraft / Flux（保留） |
| 3D | Meshy + Tripo | Meshy（保留） + Vega3D |

## 6. 部署 / CDN / 存储 — **两层不同**

### 6.1 Forgely 平台基础设施（B 端付费用户在国内访问）

| 层 | 实现 |
|---|---|
| 前端托管（forgely.cn / app.forgely.cn） | **Vercel 中国节点 + EdgeOne**（腾讯云 CDN，备 ICP）/ 阿里云 OSS+CDN |
| Workers / Edge | 腾讯云 SCF / 阿里云 FC |
| 对象存储（用户上传素材） | **阿里云 OSS**（国内访问快） |
| Redis | 阿里云 Redis 标准版 |
| Postgres | **阿里云 PolarDB-PG** |
| 邮件（B 端通知） | 阿里云邮件推送 + 短信 OTP |
| 监控 | Sentry + 神策 |
| ICP 备案 | forgely.cn 平台域名必备 |

### 6.2 用户独立站基础设施（站点给海外消费者访问）

| 层 | 实现 |
|---|---|
| 前端托管 | **Cloudflare Pages**（保留 v1.2 决策，全球 200+ 节点） |
| Workers / Edge | **Cloudflare Workers** |
| 对象存储 | **Cloudflare R2**（同区域低延迟） |
| 域名 | `*.forgely.app` 通配符 + 用户绑定自定义海外域名 |
| 监控 | Sentry + Plausible（GDPR 友好） |
| ICP 备案 | **不需要**（站点不在中国，托管在 Cloudflare）|

## 7. 爬虫源站（**核心场景：中国老板抓自己/竞品的源 SKU 重建海外独立站**）

W4 已完成 6 adapter（Shopify/WooCommerce/Amazon/AliExpress/Etsy/GenericAI），新增以下 P0 是因为**中国 B 端用户最常见的输入是这些**：

| 平台 | 优先级 | 用途 | 实现 |
|---|---|---|---|
| **1688** | P0 | 工厂主把自己的 1688 店铺源货搬到海外独立站 | `packages/scraper/src/adapters/1688.ts` ✓ |
| **Taobao / 天猫** | P0 | 国内已有 Tmall 旗舰店，要复刻一个海外版 | `taobao.ts` ✓ |
| **京东** | P1 | 同上 | TBD（W4 T28 路线）|
| Shopify | 已有 | 已经有 Shopify 想换 Forgely | `shopify.ts` ✓ |
| Amazon | 已有 | 抓竞品 listing 找差异化 | `amazon.ts` ✓ |
| AliExpress | 已有 | 国内 / 海外都用 | `aliexpress.ts` ✓ |
| Etsy | 已有 | 手作类源站 | `etsy.ts` ✓ |
| **抖店 / 快手小店** | P2 | 需要 OAuth，优先级低于 1688/Tmall | TBD |
| **Shopee** | P2 | 东南亚出海 | TBD |

## 8. 合规层 — **两层独立**

### 8.1 Forgely 平台对中国 B 端用户的合规

| 法规 | 适用 | 用途 |
|---|---|---|
| **《电子商务法》** | 平台经营者 | 平台资质 / 实名 |
| **《个人信息保护法》（PIPL）** | 必须 | 中文隐私政策 + Cookie banner |
| **《广告法》** | 平台对外宣传 | "最佳/国家级"绝对化用语自检 |
| **ICP 备案** | 平台域名 | forgely.cn 必备案 |

### 8.2 用户独立站对海外 C 端消费者的合规（**Compliance Agent 主体**）

> 这是 W8 已经实现的 `packages/compliance` 主战场，沿用原 v1.2 决策。

| 法规 | 地区 | 实现 |
|---|---|---|
| **FTC** 广告诚实 | 🇺🇸 | `packages/compliance/src/rules/regional/ftc.ts` ✓ |
| **FDA** 保健品 / 化妆品 | 🇺🇸 | `fda.ts` ✓ |
| **CPSIA** 儿童用品安全 | 🇺🇸 | `cpsia.ts` ✓ |
| **CA Prop 65** 化学物质警告 | 🇺🇸 | `prop65.ts` ✓ |
| **COPPA** 儿童隐私 | 🇺🇸 | `coppa.ts` ✓ |
| **GDPR** 数据保护 | 🇪🇺 | `gdpr.ts` ✓ |
| **DSA** 数字服务法 | 🇪🇺 | TBD（W8） |
| **CE 标志** | 🇪🇺 | TBD（W8） |
| **ASA** 广告标准 | 🇬🇧 | TBD（W8） |
| **CASL** 反垃圾邮件 | 🇨🇦 | TBD（W8） |

## 9. SEO / GEO — **用户独立站走海外搜索**

| 维度 | 用户独立站（海外） | Forgely 平台官网（B 端） |
|---|---|---|
| 主搜索 | **Google + Bing + Perplexity + ChatGPT 答疑** | 百度 + 微信指数 + 知乎 |
| 关键词工具 | DataForSEO（保留 W8 实现） | 5118 + 百度统计 |
| Schema.org JSON-LD | ✅ 必须 | ✅ 必须 |
| sitemap.xml | ✅ 自动生成（W8 T30） | ✅ |
| `llms.txt` / `llms-full.txt` | ✅ 必须 | ✅ |
| 海外结构化数据 | Product / Review / FAQPage 等 | SoftwareApplication / Organization |

## 10. UI 文案与 i18n — **两层不同**

### 10.1 Forgely 平台（apps/web 官网 + apps/app 后台）

W5 已经启动 i18n 框架（`apps/web/i18n/` + `[locale]` 路由 + locale-switcher）。

- **默认语言：`zh-CN` 简体中文**
- 备选：`en`（让外籍合伙人 / Agency 用）
- 字体：中文用 `Noto Sans SC` + `Source Han Sans`（含商用授权）
- 用户后台 (`apps/app`) 同步加 i18n（W6 任务）

### 10.2 用户生成的独立站 (apps/storefront 模板)

- **默认语言：`en` 英文**
- 备选：`de` / `fr` / `es` / `pt` / `ja` / `it` 等（用户在后台勾选启用）
- 字体：英文用 Inter / Fraunces / Inter Display（已配）
- AI 一键翻译（Copywriter Agent T15 — 已实现 locale-aware）

## 11. Forgely 平台对中国 B 端用户的定价

| 项 | 旧 USD | 新（人民币 CNY） |
|---|---|---|
| Free | $0 | ¥0 — 1 个 .forgely.app 子域 + 水印 |
| Starter | $29/月 | **¥199/月**（≈ 1 个 EUR/USD 海外站 + 1500 积分） |
| Pro（主力） | $99/月 | **¥599/月**（≈ 5 个海外站 + 6000 积分 + 3D + 代码导出） |
| Agency | $299/月 | **¥1,999/月**（无限站 + 25000 积分 + 白标） |
| Enterprise | $2,000+/月 | **¥10,000+/月**（按需报价） |
| 积分包 Mini | $5/500 | **¥39/500** |
| 积分包 Standard | $20/2,800 | **¥149/2,800** |
| 一次性服务 Code Export | $499 | **¥2,999** |
| 一次性服务 DFY Launch | $1,999 | **¥12,800** |

**注**：定价是 Forgely 平台对**中国 B 端用户**收的钱（用微信支付/支付宝结算）。**用户独立站对海外 C 端消费者收的钱**（USD/EUR）走 Stripe Connect，平台可选抽成 0%/1%（订阅版）或更高（白牌）。

## 12. 优先级 / 路线图（Sprint 2-4）

| Sprint | 重点 | 责任窗口 |
|---|---|---|
| **Sprint 2（本周）** | 微信/手机登录后端 + DeepSeek/Qwen Provider + T13/T14/T15 AI Agent 链 + 1688/Taobao Scraper | W1 + W3 + W4 + W6（UI 接入） |
| **Sprint 3** | 微信/支付宝支付 + T16/T17 Artist + Compiler+Deployer + i18n 全站中文 + 阿里云/腾讯云对接 | W3 + W1 + W5 |
| **Sprint 4** | 中国合规规则库重写 + 百度 SEO + ICP 备案引导 + 视频生成 Vidu/MiniMax + Beta 内测上线 | W8 + W4 + W1 |

## 13. 不立即做的事（明确边界）

- ❌ 不立刻删除 v1.2 已完成的欧美链路（Stripe、Auth.js Google OAuth、Cloudflare、英文 SEO）— 跨境站继续用
- ❌ 不立即接入抖音 / 快手电商（Sprint 4 之后）
- ❌ 不做 App（仅 Web，PWA 即可）

## 14. 文档维护规则

- 本文档（`docs/PIVOT-CN.md`）是 v2.0 中国版的 **唯一权威**
- 旧的 `docs/MASTER.md` v1.2 FINAL 仍保留作为"欧美版决策记录"
- 任何新决策（市场、定价、技术选型）都补到本文档对应章节
- 所有窗口（W1-W10）开发前先看一眼本文档对应章节
