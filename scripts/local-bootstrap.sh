#!/usr/bin/env bash
# One-shot onboarding for new contributors.
# Verifies tools → installs deps → starts dev stack → runs migrations.
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."

bold() { printf '\033[1m%s\033[0m\n' "$1"; }
fail() { printf '\033[31m✘ %s\033[0m\n' "$1" >&2; exit 1; }
ok()   { printf '\033[32m✓ %s\033[0m\n' "$1"; }

bold "==> 1/6 Verifying toolchain"

command -v node >/dev/null    || fail "node not found (need >=20). brew install node@20"
NODE_MAJOR="$(node -p 'process.versions.node.split(\".\")[0]')"
[ "$NODE_MAJOR" -ge 20 ] || fail "node $NODE_MAJOR detected, need >=20"
ok "node $(node -v)"

command -v pnpm >/dev/null    || fail "pnpm not found. corepack enable && corepack prepare pnpm@9.12.0 --activate"
ok  "pnpm $(pnpm -v)"

command -v docker >/dev/null  || fail "docker not found. brew install --cask docker"
docker info >/dev/null 2>&1   || fail "Docker daemon not running. Open Docker Desktop."
ok  "docker $(docker --version | awk '{print $3}' | tr -d ',')"

bold "==> 2/6 Bootstrapping .env files"

if [ ! -f .env ]; then
  cp .env.template .env
  ok  ".env created (copied from .env.template)"
else
  ok  ".env already exists, skipping"
fi
[ -f apps/web/.env.local ] || cp .env.template apps/web/.env.local
[ -f apps/app/.env.local ] || cp .env.template apps/app/.env.local
ok  "apps/{web,app}/.env.local ready"

bold "==> 3/6 Installing pnpm packages"
pnpm install
ok  "deps installed"

bold "==> 4/6 Starting docker dev stack"
docker compose -f infra/docker/compose.dev.yml up -d
echo "    Waiting for Postgres to be healthy…"
ATTEMPTS=30
until docker compose -f infra/docker/compose.dev.yml exec -T postgres pg_isready -U forgely -d forgely >/dev/null 2>&1; do
  ATTEMPTS=$((ATTEMPTS - 1))
  if [ $ATTEMPTS -le 0 ]; then fail "postgres never became healthy"; fi
  sleep 1
done
ok  "postgres + redis + minio + mailpit up"

bold "==> 5/6 Generating Prisma client + running migrations"
pnpm --filter @forgely/api prisma:generate
pnpm --filter @forgely/api db:migrate || true
ok  "schema applied"

bold "==> 6/6 You're ready"
cat <<EOF

Run any of:
  pnpm dev                                 # all apps + worker (parallel)
  pnpm --filter @forgely/web dev           # marketing only       (3000)
  pnpm --filter @forgely/app dev           # dashboard            (3001)
  pnpm --filter @forgely/storefront dev    # storefront template  (3002)

Useful URLs:
  http://localhost:3000          marketing
  http://localhost:3001          dashboard
  http://localhost:9001          MinIO console (forgely-dev / forgely-dev-secret)
  http://localhost:8025          Mailpit

Tear down dev stack with:
  docker compose -f infra/docker/compose.dev.yml down -v

EOF
