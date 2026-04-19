resource "alicloud_slb_load_balancer" "edge" {
  load_balancer_name = "${local.name_prefix}-slb"
  address_type       = "internet"
  load_balancer_spec = "slb.s2.small"
  vswitch_id         = alicloud_vswitch.main.id
  payment_type       = var.env == "prod" ? "PayBySpec" : "PayBySpec"
  tags               = local.common_tags
}

resource "alicloud_slb_listener" "https" {
  load_balancer_id          = alicloud_slb_load_balancer.edge.id
  backend_port              = 4000
  frontend_port             = 443
  protocol                  = "https"
  bandwidth                 = 10
  health_check_connect_port = 4000
  health_check              = "on"
  health_check_uri          = "/health"
  health_check_http_code    = "http_2xx"
  tls_cipher_policy         = "tls_cipher_policy_1_2_strict"
  # NOTE: certificate_id 必须由用户单独申请上传后填入。
  # 通过 var 或 SSM 传入，避免硬编码。
  server_certificate_id     = ""
}
