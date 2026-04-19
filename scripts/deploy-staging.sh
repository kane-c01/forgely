#!/usr/bin/env bash
# Deploy current HEAD to staging:
#   1) install deps
#   2) prisma migrate deploy
#   3) build apps/web + apps/app + apps/storefront
#   4) wrangler pages deploy each → *-staging Pages projects
#
# Required env (load from .env or CI secrets):
#   CLOUDFLARE_API_TOKEN          (Pages Edit + R2 Edit)
#   CLOUDFLARE_ACCOUNT_ID
#   CF_PAGES_PROJECT_WEB          (default: forgely-web)
#   CF_PAGES_PROJECT_APP          (default: forgely-app)
#   CF_PAGES_PROJECT_STOREFRONT   (default: forgely-storefront)
#   DATABASE_URL                  (staging Postgres)
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."

: "${CLOUDFLARE_API_TOKEN:?CLOUDFLARE_API_TOKEN is required}"
: "${CLOUDFLARE_ACCOUNT_ID:?CLOUDFLARE_ACCOUNT_ID is required}"
: "${DATABASE_URL:?DATABASE_URL is required (staging)}"

CF_PAGES_PROJECT_WEB="${CF_PAGES_PROJECT_WEB:-forgely-web}"
CF_PAGES_PROJECT_APP="${CF_PAGES_PROJECT_APP:-forgely-app}"
CF_PAGES_PROJECT_STOREFRONT="${CF_PAGES_PROJECT_STOREFRONT:-forgely-storefront}"

GIT_SHA="$(git rev-parse --short HEAD)"
export APP_VERSION="${APP_VERSION:-$GIT_SHA}"

echo "==> Installing dependencies"
pnpm install --frozen-lockfile

echo "==> Generating Prisma client + migrating staging DB"
pnpm --filter @forgely/api prisma:generate
pnpm --filter @forgely/api prisma:migrate:deploy

echo "==> Building Next.js apps"
pnpm --filter @forgely/web build
pnpm --filter @forgely/app build
pnpm --filter @forgely/storefront build

deploy_pages() {
  local project="$1"
  local dir="$2"
  echo "==> Deploying ${project} preview ($dir)"
  pnpm dlx wrangler pages deploy "$dir" \
    --project-name "${project}-staging" \
    --commit-hash "$GIT_SHA" \
    --branch "staging"
}

deploy_pages "$CF_PAGES_PROJECT_WEB"        "apps/web/.next"
deploy_pages "$CF_PAGES_PROJECT_APP"        "apps/app/.next"
deploy_pages "$CF_PAGES_PROJECT_STOREFRONT" "apps/storefront/.next"

echo "==> Done. Staging at:"
echo "    https://staging.forgely.cn      (web)"
echo "    https://staging-app.forgely.cn  (app)"
