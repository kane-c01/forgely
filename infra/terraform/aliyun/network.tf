data "alicloud_zones" "default" {
  available_resource_creation = "VSwitch"
}

resource "alicloud_vpc" "main" {
  vpc_name   = "${local.name_prefix}-vpc"
  cidr_block = var.vpc_cidr
  tags       = local.common_tags
}

resource "alicloud_vswitch" "main" {
  vswitch_name = "${local.name_prefix}-vsw-a"
  cidr_block   = var.vswitch_cidr
  vpc_id       = alicloud_vpc.main.id
  zone_id      = data.alicloud_zones.default.zones[0].id
  tags         = local.common_tags
}

resource "alicloud_security_group" "internal" {
  name        = "${local.name_prefix}-sg-internal"
  description = "Internal traffic between Forgely services within the VPC."
  vpc_id      = alicloud_vpc.main.id
  tags        = local.common_tags
}

resource "alicloud_security_group_rule" "allow_internal_pg" {
  type              = "ingress"
  ip_protocol       = "tcp"
  port_range        = "5432/5432"
  security_group_id = alicloud_security_group.internal.id
  cidr_ip           = var.vpc_cidr
  description       = "PolarDB-PG"
}

resource "alicloud_security_group_rule" "allow_internal_redis" {
  type              = "ingress"
  ip_protocol       = "tcp"
  port_range        = "6379/6379"
  security_group_id = alicloud_security_group.internal.id
  cidr_ip           = var.vpc_cidr
  description       = "Redis"
}
