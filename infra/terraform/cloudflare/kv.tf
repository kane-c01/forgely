resource "cloudflare_workers_kv_namespace" "tenant_config" {
  account_id = var.account_id
  title      = "${local.name_prefix}-tenant-config"
}

resource "cloudflare_workers_kv_namespace" "rate_limit" {
  account_id = var.account_id
  title      = "${local.name_prefix}-rate-limit"
}

resource "cloudflare_workers_kv_namespace" "edge_cache" {
  account_id = var.account_id
  title      = "${local.name_prefix}-edge-cache"
}
