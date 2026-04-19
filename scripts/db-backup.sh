#!/usr/bin/env bash
# Dump Postgres → gzip → upload to R2 + Aliyun OSS.
#
# Usage:
#   DATABASE_URL=postgresql://... ./scripts/db-backup.sh
#
# Optional env:
#   BACKUP_PREFIX=staging              # path prefix in bucket (default: env name)
#   R2_BUCKET_BACKUPS=forgely-backups
#   ALIYUN_OSS_BUCKET=forgely-backups
#   AWS_S3_ENDPOINT (R2 endpoint)
#   ALIYUN_OSS_ENDPOINT (e.g. https://oss-cn-hangzhou.aliyuncs.com)
set -euo pipefail

: "${DATABASE_URL:?DATABASE_URL is required}"

TS="$(date -u +%Y%m%dT%H%M%SZ)"
PREFIX="${BACKUP_PREFIX:-${NODE_ENV:-staging}}"
TMP_DIR="$(mktemp -d)"
DUMP_FILE="${TMP_DIR}/forgely-${TS}.sql.gz"
trap 'rm -rf "$TMP_DIR"' EXIT

echo "==> Dumping ${DATABASE_URL%%@*}@…"
pg_dump --no-owner --no-acl --format=plain "$DATABASE_URL" \
  | gzip --best > "$DUMP_FILE"

SIZE_HUMAN="$(du -h "$DUMP_FILE" | cut -f1)"
echo "    wrote $DUMP_FILE ($SIZE_HUMAN)"

push_r2() {
  local bucket="${R2_BUCKET_BACKUPS:-forgely-backups}"
  local key="${PREFIX}/${TS}.sql.gz"
  if [ -z "${AWS_S3_ENDPOINT:-}${R2_ENDPOINT:-}" ]; then
    echo "    [skip] R2: AWS_S3_ENDPOINT / R2_ENDPOINT unset"
    return
  fi
  if ! command -v aws >/dev/null 2>&1; then
    echo "    [skip] R2: awscli not installed (brew install awscli)"
    return
  fi
  echo "==> Uploading to R2 s3://${bucket}/${key}"
  aws s3 cp "$DUMP_FILE" "s3://${bucket}/${key}" \
    --endpoint-url "${AWS_S3_ENDPOINT:-$R2_ENDPOINT}"
}

push_oss() {
  local bucket="${ALIYUN_OSS_BUCKET:-forgely-backups}"
  local key="${PREFIX}/${TS}.sql.gz"
  if ! command -v ossutil >/dev/null 2>&1; then
    echo "    [skip] OSS: ossutil not installed"
    return
  fi
  echo "==> Uploading to OSS oss://${bucket}/${key}"
  ossutil cp "$DUMP_FILE" "oss://${bucket}/${key}"
}

push_r2
push_oss

echo "==> Done."
