resource "random_password" "redis_auth" {
  length  = 32
  special = false
}

resource "alicloud_kvstore_instance" "main" {
  db_instance_name  = "${local.name_prefix}-redis"
  instance_class    = var.redis_instance_class
  instance_type     = "Redis"
  engine_version    = "7.0"
  vswitch_id        = alicloud_vswitch.main.id
  security_ips      = [var.vpc_cidr]
  payment_type      = var.env == "prod" ? "PrePaid" : "PayAsYouGo"
  password          = random_password.redis_auth.result
  tags              = local.common_tags
}
