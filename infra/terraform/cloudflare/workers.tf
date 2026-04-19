# Tenant routing Worker — sits in front of *.forgely.app to:
#   1) read tenant config from KV (tenant_config)
#   2) inject site_id header for SSR
#   3) enforce rate limit (rate_limit KV)
#
# The Worker source itself lives at infra/workers/tenant-router/src/index.ts.
# A thin module placeholder is registered here so Pages projects can be linked.

resource "cloudflare_workers_script" "tenant_router" {
  account_id = var.account_id
  name       = "${var.project}-tenant-router"
  content    = <<-JS
    /**
     * Forgely tenant router — placeholder.
     * Real implementation will live at infra/workers/tenant-router/.
     * Replace via `wrangler deploy` from that folder.
     */
    export default {
      async fetch(request) {
        return new Response("forgely tenant router placeholder", {
          status: 200,
          headers: { "content-type": "text/plain; charset=utf-8" },
        });
      },
    };
  JS
  module     = true

  kv_namespace_binding {
    name         = "TENANT_CONFIG"
    namespace_id = cloudflare_workers_kv_namespace.tenant_config.id
  }

  kv_namespace_binding {
    name         = "RATE_LIMIT"
    namespace_id = cloudflare_workers_kv_namespace.rate_limit.id
  }

  r2_bucket_binding {
    name        = "ASSETS"
    bucket_name = cloudflare_r2_bucket.assets.name
  }
}
