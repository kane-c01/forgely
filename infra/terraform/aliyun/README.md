# Terraform — Aliyun (PolarDB-PG / Redis / OSS / SLB / DCDN)

中国主资源栈：付费用户来自国内，所有 Forgely 平台层数据落阿里云。

## 1. 你需要先在阿里云控制台准备

1. 实名认证 + 充值 + 开通：**PolarDB-PG**、**云数据库 Redis**、**OSS**、**SLB / ALB**、**DCDN**。
2. RAM 子账号（不要用主账号 AK），授权 `AliyunPolarDBFullAccess` / `AliyunRedisFullAccess` / `AliyunOSSFullAccess` / `AliyunSLBFullAccess` / `AliyunDCDNFullAccess`。
3. 域名（`forgely.cn`）已在阿里云或腾讯云解析，并完成 **ICP 备案**（Aliyun DCDN/OSS 公网必须）。

## 2. 配 ENV（本地）

```bash
export ALICLOUD_ACCESS_KEY="LTAI..."
export ALICLOUD_SECRET_KEY="****"
# 可选：cn-hangzhou / cn-shanghai / cn-shenzhen
export ALICLOUD_REGION="cn-hangzhou"
```

或者 `cp terraform.tfvars.example terraform.tfvars` 后填值。

## 3. 跑 plan / apply

```bash
cd infra/terraform/aliyun
terraform init
terraform plan -out=staging.tfplan
terraform apply staging.tfplan
```

prod：

```bash
terraform workspace new prod
terraform plan  -var env=prod -var polardb_node_class=polar.pg.x8.large -out=prod.tfplan
terraform apply prod.tfplan
```

## 4. 落到 Forgely .env

跑完 `terraform output` 把输出贴到根 `.env`：

```bash
DATABASE_URL="postgresql://$(terraform output -raw polardb_app_user):$(terraform output -raw polardb_app_password)@$(terraform output -raw polardb_endpoint)/forgely?schema=public"
REDIS_URL="redis://:$(terraform output -raw redis_password)@$(terraform output -raw redis_endpoint):6379"
ALIYUN_OSS_BUCKET=$(terraform output -raw oss_assets_bucket)
```

## 5. 资源清单

| 资源           | 数量 | 备注                                      |
| -------------- | ---- | ----------------------------------------- |
| VPC + VSwitch  | 1    | `10.10.0.0/16` + `10.10.1.0/24`           |
| PolarDB-PG 14  | 1    | `polar.pg.x4.medium`（staging 入门）      |
| Redis 7 标准版 | 1    | `redis.master.small.default` 1G           |
| OSS bucket     | 3    | assets / backups / logs                   |
| SLB            | 1    | HTTPS 443 → API :4000，需要单独传 cert id |
| DCDN           | 2    | forgely.cn / app.forgely.cn               |

## 6. 备注

- **EdgeOne**：原 prompt 写的是 EdgeOne，但 EdgeOne 是腾讯云。Aliyun 的等价物是 DCDN，已在 `dcdn.tf`。如要真用腾讯 EdgeOne，单独建 `infra/terraform/tencent/`。
- **`server_certificate_id`**：HTTPS 证书需要先在阿里云 SSL 证书服务申请上传，然后把 `cert_id` 通过 var 注入；当前 `slb.tf` 里留空。
- **state 后端**：默认本地 state，prod 强烈建议切到 OSS remote state（`provider.tf` 顶部有注释模板）。
