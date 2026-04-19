#!/usr/bin/env bash
# Sync Better Stack uptime monitors from infra/monitoring/better-stack/monitors.json.
#
#   BETTER_STACK_API_TOKEN=... ./scripts/sync-better-stack.sh
#
# Idempotent: existing monitors with the same `pronounceable_name` are PATCHed.
# Heartbeats and status page block are info-only here — set them up once via UI
# unless the API surface for those reaches GA.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MONITORS_FILE="${MONITORS_FILE:-$REPO_ROOT/infra/monitoring/better-stack/monitors.json}"
API_BASE="${BETTER_STACK_API_BASE:-https://uptime.betterstack.com/api/v2}"

if [ -z "${BETTER_STACK_API_TOKEN:-}" ]; then
  echo "ERROR: BETTER_STACK_API_TOKEN env var is required." >&2
  exit 1
fi

if ! command -v jq >/dev/null 2>&1; then
  echo "ERROR: jq is required (brew install jq)." >&2
  exit 1
fi

if [ ! -f "$MONITORS_FILE" ]; then
  echo "ERROR: $MONITORS_FILE not found." >&2
  exit 1
fi

curl_better() {
  local method="$1"
  local path="$2"
  shift 2
  curl --silent --show-error --fail \
    --request "$method" \
    --header "Authorization: Bearer ${BETTER_STACK_API_TOKEN}" \
    --header "Content-Type: application/json" \
    "$@" \
    "${API_BASE}${path}"
}

echo "==> Fetching existing monitors…"
existing=$(curl_better GET "/monitors?per_page=100")
existing_count=$(echo "$existing" | jq '.data | length')
echo "    found $existing_count existing monitors"

echo "==> Syncing monitors from $MONITORS_FILE"
jq -c '.monitors[]' "$MONITORS_FILE" | while read -r monitor; do
  name=$(echo "$monitor" | jq -r '.pronounceable_name')
  url=$(echo "$monitor" | jq -r '.url')
  echo "  -> $name ($url)"

  existing_id=$(echo "$existing" | jq -r --arg name "$name" \
    '.data[] | select(.attributes.pronounceable_name == $name) | .id // empty' | head -n1)

  body=$(echo "$monitor" | jq '{ data: { attributes: . } }')

  if [ -n "$existing_id" ]; then
    curl_better PATCH "/monitors/${existing_id}" --data "$body" > /dev/null
    echo "     PATCHed id=$existing_id"
  else
    curl_better POST "/monitors" --data "$body" > /dev/null
    echo "     CREATED"
  fi
done

echo "==> Done."
