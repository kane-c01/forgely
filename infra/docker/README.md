# Forgely Docker

本目录提供两类工件：

1. **`compose.dev.yml`** — 一键起本地依赖（Postgres / Redis / MinIO / Mailpit）。
2. **6 个 `Dockerfile.*`** — 给 services 和 apps 打容器镜像（staging / prod 用）。

---

## 1. 本地 dev stack（每次开发都要先启）

```bash
# 启动
docker compose -f infra/docker/compose.dev.yml up -d

# 看状态（4 个 service 都应该 healthy）
docker compose -f infra/docker/compose.dev.yml ps

# 看日志
docker compose -f infra/docker/compose.dev.yml logs -f postgres redis minio

# 关闭（保留数据）
docker compose -f infra/docker/compose.dev.yml down

# 关闭并清空所有数据卷（重置）
docker compose -f infra/docker/compose.dev.yml down -v
```

### 服务一览

| 服务       | 端口                        | 用途                                                      |
| ---------- | --------------------------- | --------------------------------------------------------- |
| `postgres` | `5432`                      | PolarDB-PG 兼容；预建 `forgely` DB + 扩展                 |
| `redis`    | `6379`                      | BullMQ + 速率限制 + sessions                              |
| `minio`    | `9000` (S3) / `9001` (UI)   | R2 / OSS 本地兼容（`forgely-dev` / `forgely-dev-secret`） |
| `mailpit`  | `1025` (SMTP) / `8025` (UI) | dev SMTP，邮件不真发                                      |

### 配套 ENV（写到根 `.env`）

```bash
DATABASE_URL=postgresql://forgely:forgely@localhost:5432/forgely
REDIS_URL=redis://localhost:6379

# MinIO 当本地 R2 / OSS 用
R2_ACCOUNT_ID=local
R2_ACCESS_KEY_ID=forgely-dev
R2_SECRET_ACCESS_KEY=forgely-dev-secret
R2_BUCKET_ASSETS=forgely-assets
R2_ENDPOINT=http://localhost:9000

# 本地 SMTP（services/api/src/email）
EMAIL_SMTP_HOST=localhost
EMAIL_SMTP_PORT=1025
EMAIL_FROM=dev@forgely.local
```

启动后：

```bash
pnpm --filter @forgely/api db:migrate     # 跑 prisma 迁移
pnpm --filter @forgely/api db:seed        # 可选 seed
pnpm dev                                  # 启 web/app/storefront/api/worker
```

MinIO 控制台：<http://localhost:9001>（账号 `forgely-dev` / 密码 `forgely-dev-secret`）。
Mailpit 收件箱：<http://localhost:8025>。

---

## 2. 镜像构建（staging / prod）

每个服务 / 应用一个 Dockerfile，**所有 `docker build` 命令都在 monorepo 根运行**（context 是 root）：

```bash
# Backend services
docker build -f infra/docker/Dockerfile.api      -t forgely/api:latest .
docker build -f infra/docker/Dockerfile.worker   -t forgely/worker:latest .
docker build -f infra/docker/Dockerfile.medusa   -t forgely/medusa:latest .

# Frontend apps（使用 Next.js standalone output）
docker build -f infra/docker/Dockerfile.web        -t forgely/web:latest .
docker build -f infra/docker/Dockerfile.app        -t forgely/app:latest .
docker build -f infra/docker/Dockerfile.storefront -t forgely/storefront:latest .
```

> **Next.js standalone**：要让 `forgely/web|app|storefront` 镜像最小化，需要在每个 `apps/*/next.config.mjs` 里加 `output: 'standalone'`。当前未启用（保持 zero-config 部署到 Cloudflare Pages 兼容）。当走自托管路线时再切。

### 容器化运行

```bash
# 单跑 API（连接外部 Postgres / Redis）
docker run --env-file .env -p 4000:4000 forgely/api:latest

# 跑 worker（同 .env）
docker run --env-file .env forgely/worker:latest
```

---

## 3. 排错

- **`pg_isready` 一直失败**：`docker compose down -v` 清掉旧 volume 重启。
- **MinIO bucket 没出现**：看 `forgely-minio-init` 容器日志，确认 `mc mb` 成功。
- **端口冲突**：本机已经跑了 5432 / 6379？ `lsof -nP -iTCP:5432 -sTCP:LISTEN` 看看，或者改 compose 里的左侧端口（如 `5433:5432`）。
- **Apple Silicon 缓慢**：所有镜像都用 `alpine` + 多阶段，已经较小；首次 build 会拉 base image，后续走 cache。

---

## 4. 后续 TODO

- [ ] **W11 Medusa 真起**：替换 `Dockerfile.medusa` 的占位 CMD 为 `medusa start`。
- [ ] **Next.js standalone 切换**：apps/\* 改 `output: 'standalone'` 后，Dockerfile.web|app|storefront 已经按 standalone 路径写，会变得超小。
- [ ] **GHCR 推送**：在 `.github/workflows/` 加 image build & push，把 `forgely/*` 推到 `ghcr.io/kane-c01/forgely-*`。
