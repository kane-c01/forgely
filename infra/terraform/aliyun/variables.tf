variable "region" {
  description = "Aliyun region — defaults to cn-hangzhou (closest to most CN customers)."
  type        = string
  default     = "cn-hangzhou"
}

variable "project" {
  description = "Project tag applied to all resources."
  type        = string
  default     = "forgely"
}

variable "env" {
  description = "Environment tier: staging | prod."
  type        = string
  default     = "staging"
  validation {
    condition     = contains(["staging", "prod"], var.env)
    error_message = "env must be one of: staging, prod"
  }
}

variable "vpc_cidr" {
  description = "VPC CIDR block."
  type        = string
  default     = "10.10.0.0/16"
}

variable "vswitch_cidr" {
  description = "VSwitch CIDR block (subset of vpc_cidr)."
  type        = string
  default     = "10.10.1.0/24"
}

variable "polardb_node_class" {
  description = "PolarDB-PG node specification (size). 2c4g entry tier."
  type        = string
  default     = "polar.pg.x4.medium"
}

variable "redis_instance_class" {
  description = "Redis 7 standard 1G instance class."
  type        = string
  default     = "redis.master.small.default"
}

variable "oss_bucket_acl" {
  description = "OSS bucket default ACL."
  type        = string
  default     = "private"
}

locals {
  name_prefix = "${var.project}-${var.env}"
  common_tags = {
    Project     = var.project
    Environment = var.env
    ManagedBy   = "terraform"
    Module      = "aliyun"
  }
}
