resource "cloudflare_pages_project" "web" {
  account_id        = var.account_id
  name              = "${var.project}-web"
  production_branch = var.production_branch

  build_config {
    build_command   = "pnpm --filter @forgely/web build"
    destination_dir = "apps/web/.next"
    root_dir        = "/"
  }

  source {
    type = "github"
    config {
      owner                         = "kane-c01"
      repo_name                     = "forgely"
      production_branch             = var.production_branch
      pr_comments_enabled           = true
      deployments_enabled           = true
      production_deployment_enabled = true
      preview_deployment_setting    = "all"
    }
  }

  deployment_configs {
    production {
      compatibility_date  = "2026-04-19"
      compatibility_flags = ["nodejs_compat"]
      environment_variables = {
        NODE_VERSION         = "20"
        NEXT_TELEMETRY_DISABLED = "1"
      }
    }
    preview {
      compatibility_date  = "2026-04-19"
      compatibility_flags = ["nodejs_compat"]
      environment_variables = {
        NODE_VERSION         = "20"
        NEXT_TELEMETRY_DISABLED = "1"
      }
    }
  }
}

resource "cloudflare_pages_project" "app" {
  account_id        = var.account_id
  name              = "${var.project}-app"
  production_branch = var.production_branch

  build_config {
    build_command   = "pnpm --filter @forgely/app build"
    destination_dir = "apps/app/.next"
    root_dir        = "/"
  }

  source {
    type = "github"
    config {
      owner                         = "kane-c01"
      repo_name                     = "forgely"
      production_branch             = var.production_branch
      pr_comments_enabled           = true
      deployments_enabled           = true
      production_deployment_enabled = true
      preview_deployment_setting    = "all"
    }
  }

  deployment_configs {
    production {
      compatibility_date  = "2026-04-19"
      compatibility_flags = ["nodejs_compat"]
      environment_variables = {
        NODE_VERSION = "20"
      }
    }
    preview {
      compatibility_date  = "2026-04-19"
      compatibility_flags = ["nodejs_compat"]
      environment_variables = {
        NODE_VERSION = "20"
      }
    }
  }
}

resource "cloudflare_pages_project" "storefront" {
  account_id        = var.account_id
  name              = "${var.project}-storefront"
  production_branch = var.production_branch

  build_config {
    build_command   = "pnpm --filter @forgely/storefront build"
    destination_dir = "apps/storefront/.next"
    root_dir        = "/"
  }

  source {
    type = "github"
    config {
      owner                         = "kane-c01"
      repo_name                     = "forgely"
      production_branch             = var.production_branch
      pr_comments_enabled           = false
      deployments_enabled           = true
      production_deployment_enabled = true
      preview_deployment_setting    = "all"
    }
  }
}
