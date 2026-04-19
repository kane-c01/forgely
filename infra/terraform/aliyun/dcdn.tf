# 注：原派工 prompt 写的是 EdgeOne，但 EdgeOne 是腾讯云产品。
# Aliyun 的等价物是 DCDN（动态加速 CDN）。如要真用腾讯 EdgeOne，
# 单独建 infra/terraform/tencent/ 走 tencentcloud_teo_zone。

resource "alicloud_dcdn_domain" "web" {
  domain_name = "forgely.cn"
  scope       = "domestic"
  cert_name   = null

  sources {
    content  = alicloud_slb_load_balancer.edge.address
    type     = "ipaddr"
    priority = "20"
    port     = 80
    weight   = "10"
  }

  tags = local.common_tags
}

resource "alicloud_dcdn_domain" "app" {
  domain_name = "app.forgely.cn"
  scope       = "domestic"

  sources {
    content  = alicloud_slb_load_balancer.edge.address
    type     = "ipaddr"
    priority = "20"
    port     = 80
    weight   = "10"
  }

  tags = local.common_tags
}
