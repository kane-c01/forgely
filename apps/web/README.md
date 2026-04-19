# `@forgely/web` — 对外官网 (forgely.com)

W5 窗口负责。负责 `T07` (官网 MVP) 与 `T27` (Terminal 升级)。

## 当前状态：T07 MVP

**已完成 (T07)**

- Next.js 14 App Router · TypeScript strict · Tailwind 3
- 7 段首页：Sticky Nav · Hero · Social Proof · How it works · Value Props · Showcase · Pricing · FAQ · Final CTA · Footer
- Waitlist 表单 + `POST /api/waitlist` (Zod 校验 + 蜜罐 + IP 哈希 + 本地 JSON 存储)
- SEO：`buildMetadata`、`Organization` / `SoftwareApplication` / `FAQPage` JSON-LD、`sitemap.xml`、`robots.txt`、`llms.txt`、动态 OG / favicon / Apple icon
- 移动端响应式 + 无障碍（skip-link、键盘聚焦、aria-expanded、reduce-motion）
- 设计 tokens 直接落到 `tailwind.config.ts`（W2 完成 `packages/design-tokens` 后切换为 import preset）
- 共用 `Button`/`Input`/`Badge` 组件（W2 完成 `packages/ui` 后切换为 import）

**T07 验收**

- [x] 7 段全部完成
- [x] Desktop / Tablet / Mobile 响应式
- [x] Waitlist 收邮箱（写入 `data/waitlist.json`，Git ignore）
- [ ] Lighthouse 桌面 ≥ 95 / 移动 ≥ 85（部署后跑一次确认）

## 启动

```bash
pnpm install              # 在仓库根目录
pnpm --filter @forgely/web dev
# → http://localhost:3000
```

## 脚本

```bash
pnpm --filter @forgely/web build      # 生产构建
pnpm --filter @forgely/web typecheck  # 严格 TS 检查
pnpm --filter @forgely/web lint       # next lint (max-warnings 0)
```

## 环境变量（`.env.local`）

```env
NEXT_PUBLIC_APP_URL=https://forgely.com
NEXT_PUBLIC_APP_DASH_URL=https://app.forgely.com
FORGELY_HASH_SALT=set-a-long-random-string
FORGELY_WAITLIST_PATH=./data/waitlist.json   # 可选
```

## 架构选择

| 决策                                    | 原因                                                                             |
| --------------------------------------- | -------------------------------------------------------------------------------- |
| 设计 tokens 内联到 `tailwind.config.ts` | W2 (`@forgely/design-tokens`) 还未交付；后续替换为 `presets: [forgelyPreset]`    |
| 自带 `components/ui/*`                  | 与 `@forgely/ui` 同一签名，W2 交付后只需改 import 路径                           |
| Waitlist 写本地 JSON                    | W3 (T05/T06) 还未交付；DB 接入后切换 `appendWaitlist` 内部实现即可               |
| 静态背景 + CSS 渐变（无视频）           | T07 用占位，T27 升级到 R3F 工坊场景或预渲染 AV1 视频                             |
| 全部动效服从 `prefers-reduced-motion`   | 满足 WCAG 2.2 AA + 高质感动效兼容性                                              |

## T27 升级预留接口

- `components/site/hero.tsx` 中 `<ForgeBackdrop />` 即 3D / 视频槽位
- `components/site/showcase.tsx` 中卡片 `gradient` 字段对应 T27 真实 hover 视频
- 6 幕滚动剧本会包裹 `<main>`，使用 GSAP ScrollTrigger + Lenis（T27 引入）
- Showcase 数据源：等 `packages/visual-dna` 与 `packages/product-moments` 完成后改为 import

## 下一步（属于 T27）

1. 真 3D Hero 场景（R3F + Drei + Theatre.js）或 Kling 渲染的 8s AV1 hero loop
2. 6 幕 600vh 滚动剧本（GSAP + Lenis）
3. Showcase hover 播视频
4. Interactive demo（可试的 AI 对话）
5. Testimonials 瀑布流
