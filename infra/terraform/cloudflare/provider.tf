terraform {
  required_version = ">= 1.6.0"

  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.40"
    }
  }

  # backend "r2" {
  #   bucket = "forgely-tfstate"
  #   prefix = "cloudflare"
  # }
}

provider "cloudflare" {
  # API token must include: Pages Edit, Workers Scripts Edit, KV Storage Edit, R2 Edit, DNS Edit, Zone Read.
  # See infra/secrets/README.md.
  # api_token sourced from CLOUDFLARE_API_TOKEN env var.
}
