output "pages_web_subdomain" {
  description = "*.pages.dev URL for the marketing site preview."
  value       = cloudflare_pages_project.web.subdomain
}

output "pages_app_subdomain" {
  description = "*.pages.dev URL for the dashboard preview."
  value       = cloudflare_pages_project.app.subdomain
}

output "pages_storefront_subdomain" {
  description = "*.pages.dev URL for the storefront template preview."
  value       = cloudflare_pages_project.storefront.subdomain
}

output "r2_assets_bucket" {
  value = cloudflare_r2_bucket.assets.name
}

output "r2_backups_bucket" {
  value = cloudflare_r2_bucket.backups.name
}

output "kv_namespace_tenant_config_id" {
  value = cloudflare_workers_kv_namespace.tenant_config.id
}

output "kv_namespace_rate_limit_id" {
  value = cloudflare_workers_kv_namespace.rate_limit.id
}
