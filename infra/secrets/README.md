# Forgely 凭据填写指南

本文配合 [`/.env.template`](../../.env.template) 使用，按段说明每个 key 去哪里申请、怎么填到本地 `.env` / GitHub Secrets / Cloudflare Pages env / Aliyun ECS 环境里。

> **零密钥入 git**：所有 `*.env` 都被 [`.gitignore`](../../.gitignore) 拦着，唯一例外是 `.env.template` / `.env.example`。

## 0. 起手姿势

```bash
cp .env.template .env
cp .env.template apps/web/.env.local
cp .env.template apps/app/.env.local
# services/api 复用根 .env（symlink 也行）
```

如果用 `docker compose -f infra/docker/compose.dev.yml up -d` 起本地依赖（推荐），把第 2/3/10 段改成：

```bash
DATABASE_URL=postgresql://forgely:forgely@localhost:5432/forgely
REDIS_URL=redis://localhost:6379
R2_ENDPOINT=http://localhost:9000
R2_ACCESS_KEY_ID=forgely-dev
R2_SECRET_ACCESS_KEY=forgely-dev-secret
```

---

## 1. 数据库 / Redis（阿里云）

**对应 ENV**：`DATABASE_URL` / `POLARDB_*` / `REDIS_URL`

1. 阿里云控制台 → PolarDB-PG → 创建集群（PostgreSQL 14，最低 `polar.pg.x4.medium`）→ 拿 cluster id。
2. 控制台 → 云数据库 Redis → 创建 7.0 标准版 1G。
3. 任何 prod 都建议跑 `infra/terraform/aliyun/`，自动出 `polardb_endpoint` / `redis_endpoint` / `polardb_app_password`。

GitHub Secrets：仅 `DATABASE_URL` / `REDIS_URL` 需要给 CI（用 staging 实例的串）。

---

## 2. NextAuth & JWT

**对应 ENV**：`AUTH_SECRET` / `AUTH_JWT_*` / `NEXTAUTH_URL`

```bash
openssl rand -base64 48      # → AUTH_SECRET
```

`NEXTAUTH_URL` 在 prod 设 `https://app.forgely.cn`。

---

## 3. 微信开放平台扫码登录

**对应 ENV**：`WECHAT_OPEN_APP_ID` / `WECHAT_OPEN_APP_SECRET`

1. <https://open.weixin.qq.com> 注册账号 + 实名认证。
2. 创建网站应用 → 拿 `AppID` 和 `AppSecret`。
3. 授权回调域名填 `app.forgely.cn`。
4. 拿到的 `AppSecret` **只显示一次**，立刻保存。

---

## 4. 阿里云 / 腾讯云 SMS（手机号 OTP）

**对应 ENV**：`ALIYUN_SMS_*` / `TENCENT_SMS_*`

阿里云：

1. 控制台 → 短信服务 → 国内消息 → 申请签名 `Forgely`（个人 / 企业 类型）。
2. 申请模板：`您的验证码是 ${code}，5 分钟内有效` → 拿到 `TemplateCode`。
3. RAM → 创建子用户 → 授 `AliyunDysmsFullAccess` → 拿 AK/SK。

腾讯云做备用通道（阿里云送达失败自动切）：流程同上。

---

## 5. 微信支付 V3

**对应 ENV**：`WECHAT_PAY_*`

1. <https://pay.weixin.qq.com> → 申请商户号（需要营业执照）→ 拿 `MCH_ID`。
2. 商户后台 → 账户中心 → API 安全 → 设置 V3 API 密钥（32 字符随机）→ 填 `WECHAT_PAY_API_V3_KEY`。
3. 申请 API 证书 → 下载 `apiclient_key.pem` → 填 `WECHAT_PAY_PRIVATE_KEY`（注意 `\n` 转义）。
4. 同页面 → 拿 `WECHAT_PAY_CERT_SERIAL`（10 进制证书序列号）。
5. `WECHAT_PAY_NOTIFY_URL` 必须 https + 公网可达。

---

## 6. 支付宝 (RSA2)

**对应 ENV**：`ALIPAY_*`

1. <https://open.alipay.com> → 创建应用 → 拿 `APP_ID`。
2. 用支付宝 SDK 工具生成 RSA2 密钥对（2048）→ 把私钥填 `ALIPAY_PRIVATE_KEY`。
3. 应用后台上传公钥 → 拿支付宝公钥（用来验签 webhook）→ 填 `ALIPAY_PUBLIC_KEY`。

---

## 7. Stripe

**对应 ENV**：`STRIPE_SECRET_KEY` / `STRIPE_PUBLISHABLE_KEY` / `STRIPE_WEBHOOK_SECRET` / `STRIPE_CONNECT_CLIENT_ID` / `STRIPE_PRICE_*`

1. <https://dashboard.stripe.com> 注册 → Test mode 先调通。
2. Developers → API keys → 拿 `sk_test_*` / `pk_test_*`。
3. Developers → Webhooks → Add endpoint `https://api.forgely.cn/api/payments/stripe/webhook` → 拿 `whsec_*`。
4. Stripe Connect → Settings → 拿 `Connect client_id (ca_*)`，海外消费者下单时 platform fee 自动分账给 Forgely。
5. Products → 创建 4 个 plan × 2 cadence = 8 价 + 4 个积分包价 → 把 12 个 `price_*` 一一对应填入。

---

## 8. LLM Providers

**对应 ENV**：`DEEPSEEK_API_KEY` / `QWEN_API_KEY` / `ANTHROPIC_API_KEY`

| Provider  | 申请地址                               | 备注              |
| --------- | -------------------------------------- | ----------------- |
| DeepSeek  | <https://platform.deepseek.com>        | 国内主，便宜      |
| Qwen      | <https://dashscope.console.aliyun.com> | 阿里云，国内备    |
| Anthropic | <https://console.anthropic.com>        | 海外端 Copilot 用 |

---

## 9. 视频 / 图片 / 3D

| ENV                  | 申请地址                     |
| -------------------- | ---------------------------- |
| `VIDU_API_KEY`       | <https://platform.vidu.com>  |
| `KLING_API_KEY`      | <https://kling.kuaishou.com> |
| `RUNWAY_API_KEY`     | <https://runwayml.com/api>   |
| `FAL_API_KEY` (Flux) | <https://fal.ai>             |
| `IDEOGRAM_API_KEY`   | <https://ideogram.ai>        |
| `MESHY_API_KEY`      | <https://www.meshy.ai>       |

---

## 10. 对象存储

### Cloudflare R2

1. dash.cloudflare.com → R2 → Create bucket `forgely-assets` / `forgely-backups`。
2. R2 → Manage R2 API Tokens → Create token (Read & Write) → 拿 `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY`。
3. `R2_ACCOUNT_ID` 在 dash 右侧栏。
4. `R2_ENDPOINT=https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`。

### 阿里云 OSS（CN 镜像）

1. 控制台 → OSS → 创建 bucket `forgely-cn-assets`（cn-hangzhou，公开读）。
2. RAM 子用户授 `AliyunOSSFullAccess` → 拿 AK/SK。

---

## 11. Cloudflare 部署

**对应 ENV / GitHub Secret**：`CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` / `CF_PAGES_PROJECT_*`

详见 [`infra/terraform/cloudflare/README.md`](../terraform/cloudflare/README.md)。

API Token 权限至少：

- Account · Cloudflare Pages: Edit
- Account · Workers Scripts: Edit
- Account · Workers KV Storage: Edit
- Account · Workers R2 Storage: Edit
- Zone · DNS: Edit
- Zone · Zone: Read

---

## 12. SEO

`DATAFORSEO_LOGIN` / `DATAFORSEO_PASSWORD` — <https://app.dataforseo.com>，按调用量付费。

`BAIDU_ZHANZHANG_TOKEN` — <https://ziyuan.baidu.com> → 站点管理 → 链接提交 → 拿 token，packages/seo 自动 push sitemap。

---

## 13. Scraper 代理

`PROXY_POOL_CN_URL` — 国内 1688/Taobao 抓取需要住宅 IP 池（推荐快代理 / 芝麻代理 / Bright Data CN）。
`SCRAPER_API_KEY` — 备用 https://www.scraperapi.com（绕过反爬）。

---

## 14. 监控

### Sentry (`SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN`)

1. <https://sentry.io> 创建项目（Next.js / Node.js）→ 复制 DSN。
2. 服务端用 `SENTRY_DSN`，浏览器用 `NEXT_PUBLIC_SENTRY_DSN`（一般同一个）。
3. Source map 上传：`SENTRY_AUTH_TOKEN` 在 Settings → Auth Tokens 创建（scope `project:write`）。
4. 留空则全部 no-op，不影响 dev / 线上。

### PostHog (`NEXT_PUBLIC_POSTHOG_KEY` / `NEXT_PUBLIC_POSTHOG_HOST`)

1. <https://app.posthog.com> 创建项目 → 复制 Project API Key (`phc_*`)。
2. self-host 改 `NEXT_PUBLIC_POSTHOG_HOST`。

### Plausible (已经在用)

`NEXT_PUBLIC_PLAUSIBLE_DOMAIN=forgely.cn` 即可，dashboard <https://plausible.io>。

### Better Stack

`BETTER_STACK_API_TOKEN` — <https://uptime.betterstack.com/team/api-tokens>。
`BETTER_STACK_HEARTBEAT_URL` — 创建 Heartbeat monitor 后拿到的 URL，worker 每 5 min POST 一次。

跑 `./scripts/sync-better-stack.sh` 同步 [monitors](../monitoring/better-stack/monitors.json) 到账号。

---

## 15. GitHub Repo Secrets

CI/CD 用到的 secrets，必须在 GitHub Repo Settings → Secrets and variables → Actions 添：

| Secret 名                      | 谁用                         |
| ------------------------------ | ---------------------------- |
| `CLOUDFLARE_API_TOKEN`         | preview-deploy.yml           |
| `CLOUDFLARE_ACCOUNT_ID`        | preview-deploy.yml           |
| `CF_PAGES_PROJECT_WEB`         | preview-deploy.yml           |
| `CF_PAGES_PROJECT_APP`         | preview-deploy.yml           |
| `NEXT_PUBLIC_POSTHOG_KEY`      | preview-deploy.yml           |
| `NEXT_PUBLIC_POSTHOG_HOST`     | preview-deploy.yml           |
| `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` | preview-deploy.yml           |
| `SENTRY_DSN`                   | preview-deploy.yml           |
| `SENTRY_AUTH_TOKEN`            | preview-deploy.yml           |
| `BETTER_STACK_API_TOKEN`       | (未来) sync-better-stack.yml |

> ⚠️ 推 `.github/workflows/*` 时 GitHub PAT 必须带 `workflow` scope，否则会被拒。
> 详见 [PROGRESS.md L141-L145](../../PROGRESS.md)。
