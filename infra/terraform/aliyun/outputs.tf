output "vpc_id" {
  description = "Created VPC ID."
  value       = alicloud_vpc.main.id
}

output "polardb_cluster_id" {
  description = "PolarDB-PG cluster ID — set as POLARDB_CLUSTER_ID."
  value       = alicloud_polardb_cluster.main.id
}

output "polardb_endpoint" {
  description = "PolarDB-PG primary endpoint (private)."
  value       = try(alicloud_polardb_cluster.main.connection_string, "pending")
}

output "polardb_app_user" {
  description = "Application DB user."
  value       = alicloud_polardb_account.forgely_app.account_name
}

output "polardb_app_password" {
  description = "Application DB user password (sensitive)."
  value       = random_password.polardb_admin.result
  sensitive   = true
}

output "redis_endpoint" {
  description = "Redis private endpoint."
  value       = alicloud_kvstore_instance.main.private_connection_string
}

output "redis_password" {
  description = "Redis AUTH password (sensitive)."
  value       = random_password.redis_auth.result
  sensitive   = true
}

output "oss_assets_bucket" {
  description = "Public-read assets bucket name (set as ALIYUN_OSS_BUCKET)."
  value       = alicloud_oss_bucket.assets.bucket
}

output "oss_backups_bucket" {
  value = alicloud_oss_bucket.backups.bucket
}

output "oss_logs_bucket" {
  value = alicloud_oss_bucket.logs.bucket
}

output "slb_address" {
  description = "Public SLB address — point DNS / DCDN origin here."
  value       = alicloud_slb_load_balancer.edge.address
}
