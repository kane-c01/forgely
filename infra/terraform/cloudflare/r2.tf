resource "cloudflare_r2_bucket" "assets" {
  account_id = var.account_id
  name       = "${var.project}-assets"
  location   = "WNAM"
}

resource "cloudflare_r2_bucket" "backups" {
  account_id = var.account_id
  name       = "${var.project}-backups"
  location   = "WNAM"
}
