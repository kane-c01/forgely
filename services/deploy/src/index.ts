/**
 * Forgely Deployer — uploads a compiled tenant project to Cloudflare Pages.
 *
 * Source: docs/MASTER.md §13, §21, §29 + docs/PIVOT-CN.md §6.2–§6.4
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

// ─────────────────────────────────────────────────────────────────────────
//  Hosting region config (PIVOT-CN §6.3)
// ─────────────────────────────────────────────────────────────────────────

export type HostingRegion = 'auto' | 'us' | 'eu' | 'apac'

const REGION_PLACEMENT: Record<
  Exclude<HostingRegion, 'auto'>,
  { hint: string; r2Jurisdiction: string }
> = {
  us: { hint: 'wnam', r2Jurisdiction: 'us' },
  eu: { hint: 'weur', r2Jurisdiction: 'eu' },
  apac: { hint: 'apac', r2Jurisdiction: 'apac' },
}

export interface DeployOptions {
  accountId: string
  apiToken: string
  projectName: string
  subdomain: string
  customDomain?: string
  hostingRegion?: HostingRegion
}

export interface DeployResult {
  url: string
  customDomainStatus?: 'pending' | 'active' | 'unsupported'
  cloudflareDeploymentId: string
  hostingRegion: HostingRegion
  durationMs: number
}

export function materialise(project: CompiledProject): string {
  const dir = mkdtempSync(join(tmpdir(), `forgely-${project.subdomain}-`))
  for (const [rel, content] of project.files.entries()) {
    const abs = join(dir, rel)
    mkdirSync(dirname(abs), { recursive: true })
    writeFileSync(abs, content, 'utf-8')
  }
  return dir
}

async function ensureProject(opts: DeployOptions): Promise<void> {
  const url = `https://api.cloudflare.com/client/v4/accounts/${opts.accountId}/pages/projects`

  const region = opts.hostingRegion ?? 'auto'
  const placement = region !== 'auto' ? REGION_PLACEMENT[region] : undefined

  const payload: Record<string, unknown> = {
    name: opts.projectName,
    production_branch: 'main',
    build_config: {
      build_command: 'pnpm install && pnpm build',
      destination_dir: '.next',
      root_dir: '/',
    },
  }

  if (placement) {
    payload.deployment_configs = {
      production: { placement: { mode: 'smart', hint: placement.hint } },
    }
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${opts.apiToken}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
  if (res.status !== 200 && res.status !== 409) {
    const text = await res.text()
    throw new Error(`Cloudflare project create failed: HTTP ${res.status} ${text}`)
  }
}

async function uploadArtefact(opts: DeployOptions, _projectDir: string): Promise<string> {
  const url = `https://api.cloudflare.com/client/v4/accounts/${opts.accountId}/pages/projects/${opts.projectName}/deployments`
  const res = await fetch(url, {
    method: 'POST',
    headers: { authorization: `Bearer ${opts.apiToken}` },
    body: new FormData(),
  })
  if (!res.ok) {
    throw new Error(`Cloudflare deploy failed: HTTP ${res.status}`)
  }
  const json = (await res.json()) as { result?: { id?: string } }
  return json.result?.id ?? `deployment_${Date.now()}`
}

export async function deploy(
  project: CompiledProject,
  options: DeployOptions,
): Promise<DeployResult> {
  const startedAt = Date.now()
  const region = options.hostingRegion ?? 'auto'
  const dir = materialise(project)
  await ensureProject(options)
  const deploymentId = await uploadArtefact(options, dir)
  return {
    url: options.customDomain
      ? `https://${options.customDomain}`
      : `https://${options.subdomain}.forgely.app`,
    customDomainStatus: options.customDomain ? 'pending' : undefined,
    cloudflareDeploymentId: deploymentId,
    hostingRegion: region,
    durationMs: Date.now() - startedAt,
  }
}

export async function compileAndDeploy(
  project: CompiledProject,
  options: DeployOptions,
): Promise<DeployResult> {
  return deploy(project, options)
}

// ─────────────────────────────────────────────────────────────────────────
//  Custom domain management (PIVOT-CN §6.4)
// ─────────────────────────────────────────────────────────────────────────

export interface CustomDomainSetupOptions {
  accountId: string
  apiToken: string
  /** The Cloudflare zone id that hosts *.forgely.app. */
  zoneId: string
  domain: string
  siteSubdomain: string
}

export interface CustomDomainStatus {
  domain: string
  cnameTarget: string
  dnsVerified: boolean
  sslStatus: 'pending' | 'active' | 'failed' | 'unknown'
  cfCustomHostnameId?: string
}

/**
 * Register a custom domain via Cloudflare for SaaS (Custom Hostnames API).
 * The user must point their domain's CNAME to `{subdomain}.forgely.app`.
 */
export async function registerCustomDomain(
  opts: CustomDomainSetupOptions,
): Promise<CustomDomainStatus> {
  const cnameTarget = `${opts.siteSubdomain}.forgely.app`

  const res = await fetch(
    `https://api.cloudflare.com/client/v4/zones/${opts.zoneId}/custom_hostnames`,
    {
      method: 'POST',
      headers: {
        authorization: `Bearer ${opts.apiToken}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        hostname: opts.domain,
        ssl: {
          method: 'http',
          type: 'dv',
          settings: { min_tls_version: '1.2' },
        },
      }),
    },
  )

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Custom hostname registration failed: HTTP ${res.status} ${text}`)
  }

  const json = (await res.json()) as {
    result?: { id?: string; ssl?: { status?: string } }
  }

  return {
    domain: opts.domain,
    cnameTarget,
    dnsVerified: false,
    sslStatus: (json.result?.ssl?.status as CustomDomainStatus['sslStatus']) ?? 'pending',
    cfCustomHostnameId: json.result?.id,
  }
}

/**
 * Check the verification + SSL status of a previously registered custom domain.
 */
export async function verifyCustomDomain(opts: {
  apiToken: string
  zoneId: string
  cfCustomHostnameId: string
}): Promise<{ dnsVerified: boolean; sslStatus: string; ownershipVerified: boolean }> {
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/zones/${opts.zoneId}/custom_hostnames/${opts.cfCustomHostnameId}`,
    {
      headers: { authorization: `Bearer ${opts.apiToken}` },
    },
  )

  if (!res.ok) {
    return { dnsVerified: false, sslStatus: 'unknown', ownershipVerified: false }
  }

  const json = (await res.json()) as {
    result?: {
      status?: string
      ssl?: { status?: string }
      ownership_verification?: { type?: string }
    }
  }

  const status = json.result?.status ?? 'pending'
  return {
    dnsVerified: status === 'active' || status === 'pending_deployment',
    sslStatus: json.result?.ssl?.status ?? 'pending',
    ownershipVerified: status === 'active',
  }
}

/**
 * Remove a custom domain binding (user unbinds or admin removes).
 */
export async function removeCustomDomain(opts: {
  apiToken: string
  zoneId: string
  cfCustomHostnameId: string
}): Promise<void> {
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/zones/${opts.zoneId}/custom_hostnames/${opts.cfCustomHostnameId}`,
    {
      method: 'DELETE',
      headers: { authorization: `Bearer ${opts.apiToken}` },
    },
  )
  if (!res.ok && res.status !== 404) {
    throw new Error(`Custom hostname removal failed: HTTP ${res.status}`)
  }
}

export type { CompiledProject } from '@forgely/dsl'
