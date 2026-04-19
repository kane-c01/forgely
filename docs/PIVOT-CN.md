# Forgely 中国市场 Pivot 决策（v2.0 中国版）

> **决策日期**：2026-04-19
> **状态**：锁定（覆盖 docs/MASTER.md v1.2 FINAL 中"欧美市场"决策）
> **执行优先级**：所有窗口（W1-W10）从 Sprint 2 起按本文档执行

## 1. 产品定位调整

| 维度 | v1.2 FINAL（旧） | v2.0 中国版（新） |
|---|---|---|
| 主目标市场 | 欧美（US + EU + UK + CA） | **中国大陆**（一线 + 新一线品牌方） |
| 用户语言 | 英文优先 | **中文优先**（i18n 仍保留英文，便于跨境品牌） |
| 出海版仍存在？ | — | 是（用户后台可一键切换"国内站 / 海外站"，海外站走原 v1.2 链路） |
| 核心 Persona | A（中国工厂出海）+ C（欧美 DTC） | **A（中国工厂出海，但站点同时上国内 + 海外）** + 新增 D（国内新锐 DTC 品牌） |

## 2. 登录与身份

**完全替换** v1.2 的 `Email/Password + Google OAuth` 方案：

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

## 3. 支付层

**双轨并行**（用户后台可勾选启用哪些）：

| 渠道 | 用途 | 实现 |
|---|---|---|
| **微信支付（JSAPI / Native / H5）** | P0，国内主用 | 微信支付 V3 API，独立 SDK |
| **支付宝（PC / Wap / App）** | P0，国内主用 | 支付宝开放平台 V3 API |
| **银联云闪付** | P2 | 银联开放平台 |
| Stripe | P1，海外站继续用 | 沿用 W3 已实现的 Stripe 链路 |
| NOWPayments（crypto） | P2 | 沿用 |

**自研模块**：`services/api/src/payments/{wechat,alipay,unionpay}.ts`，统一接口 `PaymentProvider`：
```ts
interface PaymentProvider {
  createCheckout(opts: { amountCents, orderId, returnUrl, description }): Promise<{ url: string; qrCode?: string; prepayId?: string }>
  verifyWebhook(req: Request): Promise<WebhookEvent>
  refund(opts: { paymentId: string; amountCents: number }): Promise<RefundResult>
}
```

**计费货币**：默认 CNY（人民币），跨境站可切 USD。

## 4. AI / LLM 层

**Claude 在国内访问不稳**，新增国内 LLM Provider，走同一 `LlmProvider` 接口：

| Provider | 用途 | 模型 |
|---|---|---|
| **DeepSeek** | P0，主力推理 | `deepseek-chat` / `deepseek-coder` / `deepseek-vl`（视觉） |
| **通义千问（Qwen）** | P0，主力推理 + 视觉 | `qwen-max` / `qwen-vl-max` |
| Kimi（Moonshot） | P1 | `moonshot-v1-128k`（长上下文） |
| 智谱 GLM | P1 | `glm-4` / `glm-4v` |
| Claude（海外通道） | 跨境站继续 | 沿用 |

**provider 解析**：环境变量 `FORGELY_LLM_REGION=cn`（默认走 DeepSeek/Qwen），`=global` 走 Claude。

## 5. 视频 / 图像生成

| 类型 | v1.2 旧 | v2.0 中国版 |
|---|---|---|
| 视频 | Kling 2.0 + Runway Gen-4 | **Vidu / 即梦 / MiniMax abab-video / Kling**（Kling 在国内可用） |
| 图像 | Flux 1.1 Pro + Ideogram 3.0 | 通义万相 / Recraft / Flux（保留） |
| 3D | Meshy + Tripo | Meshy（保留） + Vega3D |

## 6. 部署 / CDN / 存储

**Cloudflare Pages 在中国不稳**，迁到国内 PaaS：

| 层 | 旧 | 新 |
|---|---|---|
| 前端托管 | Cloudflare Pages | **Vercel 中国节点 + EdgeOne**（腾讯云 CDN，备 ICP）/ 阿里云 OSS+CDN |
| Workers / Edge | Cloudflare Workers | 腾讯云 SCF / 阿里云 FC |
| 对象存储 | Cloudflare R2 | **阿里云 OSS** / 腾讯云 COS |
| Redis | Upstash | 阿里云 Redis 标准版 |
| Postgres | Neon / Supabase | **阿里云 PolarDB-PG** / 腾讯云 PostgreSQL |
| 邮件 | Resend | 阿里云邮件推送（v1）+ 短信 OTP（主） |
| 监控 | Sentry / PostHog | Sentry（保留）/ 神策 / 友盟+ |

**ICP 备案**：用户绑定自定义域名时，需引导完成 ICP 备案（提供阿里云/腾讯云一键备案链接）。

## 7. 爬虫源站（Sprint 2 重点）

W4 已完成 6 adapter，新增 P0：

| 平台 | 优先级 | 实现 |
|---|---|---|
| **1688** | P0 | Playwright + 已抓的部分（`packages/scraper/src/adapters/aliexpress.ts` 复用） |
| **Taobao / 天猫** | P0 | Playwright + 国内代理池 |
| **京东** | P1 | Browse API 部分公开 + 爬虫 |
| **拼多多** | P2 | 反爬最重，最后做 |
| **抖店 / 快手小店** | P2 | OAuth API |
| Shopline | 已有部分（W4），保持 |
| Shopee（东南亚出海） | P2 | 跨境用 |

## 8. 合规层

**完全替换** v1.2 的 FTC/FDA/GDPR 规则：

| 法规 | 适用 | 实现 |
|---|---|---|
| **《中华人民共和国电子商务法》** | 必须 | `packages/compliance/src/rules/regional/cn-ecommerce.ts` |
| **《个人信息保护法》（PIPL）** | 必须 | `cn-pipl.ts` — 隐私政策模板 + Cookie banner 中文 |
| **《广告法》** | 必须 | `cn-advertising.ts` — 禁用"最佳/第一/国家级"等绝对化用语 |
| **《消费者权益保护法》** | 必须 | `cn-consumer.ts` — 7 天无理由退货、三包条款 |
| **《网络安全法》/ 等保 2.0** | P1 | 数据本地化、日志保留 6 月+ |
| 行业特殊：保健品 / 化妆品 / 儿童 | 必须 | `category/cn-{health,cosmetics,kids}.ts` |
| 跨境海外站 | 保留 | 走原 v1.2 FTC/FDA/GDPR/CPSIA 链路 |

## 9. SEO / GEO

| 维度 | 旧 | 新 |
|---|---|---|
| 主搜索 | Google + 答疑 AI（Perplexity 等） | **百度 + 必应中国 + 神马**（移动）+ DeepSeek/Kimi/豆包 |
| 关键词工具 | DataForSEO | **百度统计 + 5118 + 站长平台 API** |
| Schema.org | 保留 | 保留（百度也支持 JSON-LD） |
| sitemap | 保留 | 保留（提交到百度站长平台） |
| `llms.txt` / `llms-full.txt` | 保留 | 保留（中文 LLM 也读） |

## 10. UI 文案与 i18n

W5 已经启动 i18n 框架（`apps/web/i18n/` + `[locale]` 路由 + locale-switcher）。Sprint 2 任务：

- 默认语言：`zh-CN`
- 备选语言：`en` / `zh-HK` / `zh-TW`（跨境站用）
- 所有文案抽到 `apps/web/messages/zh-CN.json` 和 `messages/en.json`
- 字体：中文用 `Noto Sans SC` + `Source Han Sans`（包含商用授权）
- 用户后台 (`apps/app`) 同步加 i18n（W6 任务）

## 11. 商业模式 / 定价

| 项 | 旧 | 新（中国版） |
|---|---|---|
| 货币 | USD | **CNY** |
| Free | $0 | ¥0 — 同条件 |
| Starter | $29/月 | **¥199/月**（≈ Starter 海外的 7 折，国内付费意愿） |
| Pro（主力） | $99/月 | **¥599/月** |
| Agency | $299/月 | **¥1,999/月** |
| Enterprise | $2,000+/月 | **¥10,000+/月**（按需报价） |
| 积分包 Mini | $5/500 | **¥39/500** |
| 积分包 Standard | $20/2,800 | **¥149/2,800** |
| 一次性服务 Code Export | $499 | **¥2,999** |
| 一次性服务 DFY Launch | $1,999 | **¥12,800** |

跨境用户（海外站）继续走 USD 定价，Stripe 收款。

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
