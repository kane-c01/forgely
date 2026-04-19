# GitHub Actions Workflows (parking lot)

These three YAML files are the real CI / CD workflows that should live at
`.github/workflows/` in the repo root, but **they're parked here** because the
GitHub PAT used by this clone lacks the `workflow` scope (push-side restriction).

## To activate

Pick **one** of the two paths:

### A. Add `workflow` scope to the PAT (recommended, 1-time)

1. <https://github.com/settings/tokens> → edit the PAT → tick **`workflow`** → save.
2. From this repo:
   ```bash
   cd ~/Desktop/Forgely
   mkdir -p .github/workflows
   cp infra/ci/workflows/*.yml .github/workflows/
   git add .github/workflows/
   git commit -m "chore(ci): activate GitHub Actions workflows"
   git push
   ```
3. Watch CI fire under <https://github.com/kane-c01/forgely/actions>.

### B. Paste via GitHub web UI (one-off)

1. Open <https://github.com/kane-c01/forgely> in browser.
2. Press `.` to open github.dev (web editor) — or use **Add file → Create new file**.
3. For each of `ci.yml`, `e2e.yml`, `preview-deploy.yml`:
   - Path: `.github/workflows/<name>.yml`
   - Paste contents from this folder.
   - Commit on `main`.

## Required GitHub Secrets

Before CI is useful, set these under **Settings → Secrets and variables → Actions**:

| Secret                         | Used by              |
| ------------------------------ | -------------------- |
| `CLOUDFLARE_API_TOKEN`         | `preview-deploy.yml` |
| `CLOUDFLARE_ACCOUNT_ID`        | `preview-deploy.yml` |
| `CF_PAGES_PROJECT_WEB`         | `preview-deploy.yml` |
| `CF_PAGES_PROJECT_APP`         | `preview-deploy.yml` |
| `NEXT_PUBLIC_POSTHOG_KEY`      | `preview-deploy.yml` |
| `NEXT_PUBLIC_POSTHOG_HOST`     | `preview-deploy.yml` |
| `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` | `preview-deploy.yml` |
| `SENTRY_DSN`                   | `preview-deploy.yml` |
| `SENTRY_AUTH_TOKEN`            | `preview-deploy.yml` |

Full how-to: [`infra/secrets/README.md`](../../secrets/README.md).
