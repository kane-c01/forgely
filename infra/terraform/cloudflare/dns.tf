# DNS records (forgely.cn marketing zone).
resource "cloudflare_record" "web_apex" {
  zone_id = var.zone_id_cn
  name    = "@"
  type    = "CNAME"
  content = "${cloudflare_pages_project.web.name}.pages.dev"
  proxied = true
  ttl     = 1
}

resource "cloudflare_record" "app_subdomain" {
  zone_id = var.zone_id_cn
  name    = "app"
  type    = "CNAME"
  content = "${cloudflare_pages_project.app.name}.pages.dev"
  proxied = true
  ttl     = 1
}

resource "cloudflare_record" "api_subdomain" {
  zone_id = var.zone_id_cn
  name    = "api"
  type    = "A"
  # Override after Aliyun SLB exists (set as TF var or update manually).
  content = "0.0.0.0"
  proxied = false
  ttl     = 300
  comment = "Set to alicloud_slb_load_balancer.edge.address after aliyun apply."
}

# Tenant wildcard zone (forgely.app).
resource "cloudflare_record" "tenant_wildcard" {
  zone_id = var.zone_id_app
  name    = "*"
  type    = "CNAME"
  content = "${cloudflare_pages_project.storefront.name}.pages.dev"
  proxied = true
  ttl     = 1
}

# Worker route binding for tenant router on *.forgely.app.
resource "cloudflare_workers_route" "tenant_router" {
  zone_id     = var.zone_id_app
  pattern     = "*.forgely.app/*"
  script_name = cloudflare_workers_script.tenant_router.name
}
