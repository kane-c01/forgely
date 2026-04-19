variable "account_id" {
  description = "Cloudflare account ID. Find at: dash.cloudflare.com → right sidebar."
  type        = string
}

variable "zone_id_cn" {
  description = "Cloudflare Zone ID for forgely.cn (the marketing site)."
  type        = string
}

variable "zone_id_app" {
  description = "Cloudflare Zone ID for forgely.app (tenant wildcard subdomain)."
  type        = string
}

variable "production_branch" {
  description = "Git branch that triggers production deploys."
  type        = string
  default     = "main"
}

variable "project" {
  description = "Project tag prefix for resources."
  type        = string
  default     = "forgely"
}

variable "env" {
  description = "Environment tier."
  type        = string
  default     = "staging"
  validation {
    condition     = contains(["staging", "prod"], var.env)
    error_message = "env must be one of: staging, prod"
  }
}

locals {
  name_prefix = "${var.project}-${var.env}"
}
