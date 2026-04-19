resource "alicloud_oss_bucket" "assets" {
  bucket = "${local.name_prefix}-assets"
  acl    = var.oss_bucket_acl

  versioning {
    status = "Enabled"
  }

  lifecycle_rule {
    id      = "expire-old-versions"
    enabled = true
    expiration {
      days = 365
    }
    noncurrent_version_expiration {
      days = 30
    }
  }

  cors_rule {
    allowed_origins = ["https://forgely.cn", "https://app.forgely.cn", "https://*.forgely.app"]
    allowed_methods = ["GET", "POST", "PUT", "DELETE", "HEAD"]
    allowed_headers = ["*"]
    expose_headers  = ["ETag", "x-oss-request-id"]
    max_age_seconds = 3600
  }

  tags = local.common_tags
}

resource "alicloud_oss_bucket" "backups" {
  bucket = "${local.name_prefix}-backups"
  acl    = "private"

  lifecycle_rule {
    id      = "expire-stale-backups"
    enabled = true
    expiration {
      days = 90
    }
  }

  tags = local.common_tags
}

resource "alicloud_oss_bucket" "logs" {
  bucket = "${local.name_prefix}-logs"
  acl    = "private"

  lifecycle_rule {
    id      = "expire-logs"
    enabled = true
    expiration {
      days = 30
    }
  }

  tags = local.common_tags
}
