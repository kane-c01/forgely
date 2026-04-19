#!/usr/bin/env bash
# Deploy current HEAD to production. Adds two safety rails over deploy-staging.sh:
#   1) refuse if not on `main`
#   2) interactive confirm prompt (skip with FORCE=1)
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."

: "${CLOUDFLARE_API_TOKEN:?CLOUDFLARE_API_TOKEN is required}"
: "${CLOUDFLARE_ACCOUNT_ID:?CLOUDFLARE_ACCOUNT_ID is required}"
: "${DATABASE_URL:?DATABASE_URL is required (PROD)}"

BRANCH="$(git rev-parse --abbrev-ref HEAD)"
GIT_SHA="$(git rev-parse --short HEAD)"
export APP_VERSION="${APP_VERSION:-$GIT_SHA}"

if [ "$BRANCH" != "main" ] && [ "${FORCE:-0}" != "1" ]; then
  echo "ERROR: refusing to deploy from non-main branch ($BRANCH). Set FORCE=1 to override." >&2
  exit 1
fi

if [ "${FORCE:-0}" != "1" ]; then
  echo "About to deploy commit $GIT_SHA on $BRANCH to PRODUCTION."
  echo "DATABASE_URL: ${DATABASE_URL%%@*}@..."
  read -r -p "Type 'PROD' to confirm: " ANSWER
  if [ "$ANSWER" != "PROD" ]; then
    echo "Aborted."
    exit 1
  fi
fi

CF_PAGES_PROJECT_WEB="${CF_PAGES_PROJECT_WEB:-forgely-web}"
CF_PAGES_PROJECT_APP="${CF_PAGES_PROJECT_APP:-forgely-app}"
CF_PAGES_PROJECT_STOREFRONT="${CF_PAGES_PROJECT_STOREFRONT:-forgely-storefront}"

echo "==> Installing dependencies"
pnpm install --frozen-lockfile

echo "==> Generating Prisma client + migrating PRODUCTION DB"
pnpm --filter @forgely/api prisma:generate
pnpm --filter @forgely/api prisma:migrate:deploy

echo "==> Building"
pnpm --filter @forgely/web build
pnpm --filter @forgely/app build
pnpm --filter @forgely/storefront build

deploy_pages_prod() {
  local project="$1"
  local dir="$2"
  echo "==> Deploying ${project} (production)"
  pnpm dlx wrangler pages deploy "$dir" \
    --project-name "$project" \
    --commit-hash "$GIT_SHA" \
    --branch "main"
}

deploy_pages_prod "$CF_PAGES_PROJECT_WEB"        "apps/web/.next"
deploy_pages_prod "$CF_PAGES_PROJECT_APP"        "apps/app/.next"
deploy_pages_prod "$CF_PAGES_PROJECT_STOREFRONT" "apps/storefront/.next"

echo "==> Tagging release"
TAG="release-$(date -u +%Y%m%d-%H%M%S)-${GIT_SHA}"
git tag -a "$TAG" -m "prod deploy $GIT_SHA"
echo "    git push origin $TAG   # <- run this if you want it on GitHub"

echo "==> Done. Production at:"
echo "    https://forgely.cn"
echo "    https://app.forgely.cn"
