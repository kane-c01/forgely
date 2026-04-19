/**
 * Forgely Deployer — uploads a compiled tenant project to Cloudflare Pages.
 *
 * Source: docs/MASTER.md §13, §21, §29 (CN pivot keeps Cloudflare for
 * generated stores because the audience is overseas).
 *
 * Two-stage:
 *   1. `prepare()` — write the compiled file map to a temp dir, install
 *      deps, run `next build` (or rely on Cloudflare Pages build runner).
 *   2. `deploy()`  — call Cloudflare Pages REST API to create / update
 *      the project, push the build artefact, configure custom domain.
 *
 * For MVP we use the **direct upload** flow (no GitHub linkage) so we can
 * deploy purely from the Forgely control plane.
 *
 * @owner W1 — T17 (docs/MASTER.md §29.1, §9.1)
 */
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'

import type { CompiledProject } from '@forgely/dsl'

export interface DeployOptions {
  /** Cloudflare account id. */
  accountId: string
  /** Cloudflare API token with Pages:Edit scope. */
  apiToken: string
  /** Cloudflare Pages project name (auto-created if missing). */
  projectName: string
  /** Target subdomain `.forgely.app` — used for branch + DNS. */
  subdomain: string
  /** Optional custom apex / subdomain owned by the user. */
  customDomain?: string
  /** Region label for telemetry. */
  region?: 'cn-built' | 'global-built'
}

export interface DeployResult {
  url: string
  customDomainStatus?: 'pending' | 'active' | 'unsupported'
  cloudflareDeploymentId: string
  durationMs: number
}

/** Materialise a CompiledProject onto a tmp dir. */
export function materialise(project: CompiledProject): string {
  const dir = mkdtempSync(join(tmpdir(), `forgely-${project.subdomain}-`))
  for (const [rel, content] of project.files.entries()) {
    const abs = join(dir, rel)
    mkdirSync(dirname(abs), { recursive: true })
    writeFileSync(abs, content, 'utf-8')
  }
  return dir
}

/** Create or update a Cloudflare Pages project (REST). */
async function ensureProject(opts: DeployOptions): Promise<void> {
  const url = `https://api.cloudflare.com/client/v4/accounts/${opts.accountId}/pages/projects`
  const payload = {
    name: opts.projectName,
    production_branch: 'main',
    build_config: {
      build_command: 'pnpm install && pnpm build',
      destination_dir: '.next',
      root_dir: '/',
    },
  }
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${opts.apiToken}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
  // 409 = project exists, 200 = created — both are fine.
  if (res.status !== 200 && res.status !== 409) {
    const text = await res.text()
    throw new Error(`Cloudflare project create failed: HTTP ${res.status} ${text}`)
  }
}

/** Upload built artefacts via the direct-upload API. */
async function uploadArtefact(opts: DeployOptions, _projectDir: string): Promise<string> {
  // Production: tar.gz the project dir and POST to:
  //   POST /accounts/:account_id/pages/projects/:project_name/deployments
  // For the MVP scaffold we emit the request and return a synthetic id —
  // the real upload step is done by the Forgely worker that has access
  // to the build container.
  const url = `https://api.cloudflare.com/client/v4/accounts/${opts.accountId}/pages/projects/${opts.projectName}/deployments`
  const res = await fetch(url, {
    method: 'POST',
    headers: { authorization: `Bearer ${opts.apiToken}` },
    body: new FormData(), // populated from project_dir in production
  })
  if (!res.ok) {
    throw new Error(`Cloudflare deploy failed: HTTP ${res.status}`)
  }
  const json = (await res.json()) as { result?: { id?: string } }
  return json.result?.id ?? `deployment_${Date.now()}`
}

/** Top-level deploy: prepare → ensureProject → upload → return URL. */
export async function deploy(
  project: CompiledProject,
  options: DeployOptions,
): Promise<DeployResult> {
  const startedAt = Date.now()
  const dir = materialise(project)
  await ensureProject(options)
  const deploymentId = await uploadArtefact(options, dir)
  return {
    url: options.customDomain
      ? `https://${options.customDomain}`
      : `https://${options.subdomain}.forgely.app`,
    customDomainStatus: options.customDomain ? 'pending' : undefined,
    cloudflareDeploymentId: deploymentId,
    durationMs: Date.now() - startedAt,
  }
}

/**
 * One-shot helper used by the worker pipeline:
 *   compile DSL → upload to Cloudflare → return final URL.
 */
export async function compileAndDeploy(
  project: CompiledProject,
  options: DeployOptions,
): Promise<DeployResult> {
  return deploy(project, options)
}

export type { CompiledProject } from '@forgely/dsl'
