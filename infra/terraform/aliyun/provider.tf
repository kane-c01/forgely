terraform {
  required_version = ">= 1.6.0"

  required_providers {
    alicloud = {
      source  = "aliyun/alicloud"
      version = "~> 1.230"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }

  # Recommended for prod: switch to OSS remote state.
  # backend "oss" {
  #   bucket = "forgely-tfstate"
  #   prefix = "aliyun"
  #   region = "cn-hangzhou"
  # }
}

provider "alicloud" {
  region = var.region
  # Authentication is read from env vars by default:
  #   ALICLOUD_ACCESS_KEY, ALICLOUD_SECRET_KEY, optionally ALICLOUD_SECURITY_TOKEN
  # See infra/secrets/README.md.
}
