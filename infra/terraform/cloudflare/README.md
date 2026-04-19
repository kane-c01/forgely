# Terraform — Cloudflare (Pages / Workers / R2 / KV / DNS)

海外 / 全球资源栈：用户独立站 (`*.forgely.app`) 走 Pages + Workers + R2，对外官网 + 用户后台 (`forgely.cn` / `app.forgely.cn`) 也走 Pages（preview deploy）。

## 1. Cloudflare 准备

1. 注册账号 → 拿到 **Account ID**（dash.cloudflare.com 右侧栏）。
2. 把 `forgely.cn` 和 `forgely.app` 域名 add zone → 拿到两个 **Zone ID**。
3. 创建 API Token：**My Profile → API Tokens → Create Token**。Permissions 至少：
   - Account · Cloudflare Pages: Edit
   - Account · Workers Scripts: Edit
   - Account · Workers KV Storage: Edit
   - Account · Workers R2 Storage: Edit
   - Zone · DNS: Edit
   - Zone · Zone: Read
4. GitHub Repo Secrets 同时填：
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`
   - `CF_PAGES_PROJECT_WEB=forgely-web`
   - `CF_PAGES_PROJECT_APP=forgely-app`

## 2. 跑 plan / apply

```bash
cp terraform.tfvars.example terraform.tfvars
# 编辑 terraform.tfvars 填 account_id / zone_id_cn / zone_id_app

export CLOUDFLARE_API_TOKEN="..."
cd infra/terraform/cloudflare
terraform init
terraform plan -out=cf.tfplan
terraform apply cf.tfplan
```

prod：

```bash
terraform workspace new prod
terraform plan  -var env=prod -out=cf-prod.tfplan
terraform apply cf-prod.tfplan
```

## 3. 资源清单

| 资源                              | 数量 | 备注                                                 |
| --------------------------------- | ---- | ---------------------------------------------------- |
| `cloudflare_pages_project`        | 3    | `forgely-web` / `forgely-app` / `forgely-storefront` |
| `cloudflare_r2_bucket`            | 2    | `forgely-assets` / `forgely-backups`                 |
| `cloudflare_workers_kv_namespace` | 3    | `tenant-config` / `rate-limit` / `edge-cache`        |
| `cloudflare_workers_script`       | 1    | `forgely-tenant-router`（占位，实现稍后）            |
| `cloudflare_record`               | 4    | apex / app / api / `*` wildcard                      |
| `cloudflare_workers_route`        | 1    | `*.forgely.app/*` → tenant router                    |

## 4. CI 联动

`.github/workflows/preview-deploy.yml` 在 push main 时把 `apps/web` 和 `apps/app` 部署到这些 Pages project（preview branch）。生产合并后，Pages 自己 trigger production deploy（在 project 的 Git 集成里配的）。

## 5. 后续 TODO

- [ ] 真正的 tenant-router Worker：`infra/workers/tenant-router/src/index.ts`，从 KV 读 site_id → inject header → 转发到 Pages。
- [ ] Argo Smart Routing / Bot Management（prod 升级时再加 tf）。
- [ ] R2 lifecycle：30 天后转 IA，90 天后归档。
