# `@forgely/web` — 对外官网 (forgely.com)

W5 窗口负责，负责 Task `T07` (官网 MVP) 与 `T27` (Terminal 升级)。

## 当前状态

| Task                                           | 状态                                    | 备注                                                                                                   |
| ---------------------------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `T07-A` 9 段官网 MVP                           | ✅ 已合并 main                          | Nav · Hero · Social Proof · How it works · Value Props · Showcase · Pricing · FAQ · Final CTA · Footer |
| `T07-B` 接入共享 packages                      | ✅ 本分支 (`feat/T07-tokens-ui-import`) | 切到 `@forgely/design-tokens` preset + `@forgely/ui` 组件                                              |
| `T07-C` Waitlist 表单 + API                    | ✅ 已合并 main                          | 本地 JSON 存储，等 W3 落地 Prisma `Waitlist` 模型                                                      |
| `T07-D` SEO + Schema + sitemap + llms.txt + OG | ✅ 已合并 main                          | 动态 OG/icon/apple-icon (Edge Runtime + Satori)                                                        |
| `T07-E` a11y + reduce-motion                   | ✅ 已合并 main                          | skip-link、aria-expanded、honeypot、IP hash                                                            |
| `T27` Terminal 升级                            | ⏳ 准备中                               | 预留接口：Hero `<ForgeBackdrop/>` 槽位 / Showcase 卡片 hover 视频 / 6 幕滚动                           |

## 启动

```bash
# 1. 仓库根目录 install (workspace)
pnpm install

# 2. 开发 (默认 3000；如其他窗口占用，自行换端口)
pnpm --filter @forgely/web dev
# 或:
pnpm --filter @forgely/web exec next dev --port 3010
```

## 共享包依赖

`apps/web` 通过 workspace 协议消费这两个包，避免重复实现：

```jsonc
// apps/web/package.json
"dependencies": {
  "@forgely/design-tokens": "workspace:*",  // tokens + Tailwind preset + CSS vars
  "@forgely/ui":            "workspace:*"   // Button / Input / Badge / Card / Dialog (shadcn)
}
```

| 文件                                | 引用方式                                                          |
| ----------------------------------- | ----------------------------------------------------------------- |
| `tailwind.config.ts`                | `presets: [forgelyPreset]` from `@forgely/design-tokens/tailwind` |
| `app/globals.css`                   | `@import '@forgely/design-tokens/css'` 注入 root vars             |
| `components/site/*`                 | `import { Button, Badge, cn } from '@forgely/ui'`                 |
| `components/ui/section-heading.tsx` | 业务组件，仍在本 app；用 `cn` from `@forgely/ui`                  |

## 端到端 smoke

```bash
curl http://localhost:3010/                # 200 HTML
curl http://localhost:3010/robots.txt
curl http://localhost:3010/sitemap.xml
curl http://localhost:3010/llms.txt
curl http://localhost:3010/opengraph-image # 1200×630 PNG
curl -X POST http://localhost:3010/api/waitlist \
  -H 'content-type: application/json' \
  -d '{"email":"you@brand.com","storeUrl":"https://shop.example.com"}'
```

## 环境变量 (`.env.local`)

```env
NEXT_PUBLIC_APP_URL=https://forgely.com
NEXT_PUBLIC_APP_DASH_URL=https://app.forgely.com
FORGELY_HASH_SALT=set-a-long-random-string
FORGELY_WAITLIST_PATH=./data/waitlist.json   # 可选；默认即此值
```

## 待接入 (依赖其他窗口)

| 窗口          | 任务                                           | 我的切换点                                                                             |
| ------------- | ---------------------------------------------- | -------------------------------------------------------------------------------------- |
| W3 (T05/T06)  | Prisma `Waitlist` model + tRPC mutation        | `lib/waitlist-store.ts` 内部实现替换为 `prisma.waitlist.create / findUnique`，签名不变 |
| W2 (T04)      | Aceternity / Magic UI 动效组件入 `@forgely/ui` | Hero 升级用 `<Spotlight/>` / `<BorderBeam/>` 等                                        |
| W2 (T03 后续) | Card / Dialog / 更多 shadcn                    | Pricing 卡片可换 `<Card/>` 提升对齐                                                    |

## T27 升级路线（W11–W13）

1. **Hero 3D**：`<ForgeBackdrop/>` 槽位换为 R3F + Drei + Theatre.js 工坊场景，或 8s AV1 hero loop
2. **6 幕滚动剧本** (600vh)：GSAP ScrollTrigger + Lenis，包裹 `<main>`
3. **Showcase**：卡片 `gradient` 字段换为真实 hover 视频 (`<HoverPlay/>`)
4. **Interactive Demo**：可交互的 AI 对话演示
5. **Testimonials**：瀑布流证言墙
6. **性能目标**：Lighthouse 桌面 ≥ 95 / 移动 ≥ 85（部署预览后实测）
