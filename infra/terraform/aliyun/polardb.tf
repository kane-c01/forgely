resource "random_password" "polardb_admin" {
  length  = 24
  special = true
  override_special = "!#$%*-_=+"
}

resource "alicloud_polardb_cluster" "main" {
  db_type         = "PostgreSQL"
  db_version      = "14"
  db_node_class   = var.polardb_node_class
  pay_type        = var.env == "prod" ? "PrePaid" : "PostPaid"
  description     = "${local.name_prefix}-polardb"
  vswitch_id      = alicloud_vswitch.main.id
  security_ips    = [var.vpc_cidr]
  resource_group_id = null
  tags            = local.common_tags
}

resource "alicloud_polardb_database" "forgely" {
  db_cluster_id = alicloud_polardb_cluster.main.id
  db_name       = "forgely"
  db_description = "Forgely core schema."
}

resource "alicloud_polardb_account" "forgely_app" {
  db_cluster_id    = alicloud_polardb_cluster.main.id
  account_name     = "forgely_app"
  account_password = random_password.polardb_admin.result
  account_type     = "Normal"
  account_description = "Application service account."
}

resource "alicloud_polardb_account_privilege" "forgely_app_full" {
  db_cluster_id     = alicloud_polardb_cluster.main.id
  account_name      = alicloud_polardb_account.forgely_app.account_name
  account_privilege = "DMLOnly"
  db_names          = [alicloud_polardb_database.forgely.db_name]
}
