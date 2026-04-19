/**
 * Artist Agent — T16.
 *
 * Unified front for **all** asset generation (image / video / 3D).
 * Multiple providers register; per-asset request picks the cheapest
 * working one and falls back through the chain on failure.
 *
 * Region-aware (docs/PIVOT-CN.md §4-5):
 *   - region=cn → Vidu / MiniMax / Qwen-VL / Flux (via Fal) / Meshy
 *   - region=global → Kling 2.0 → Runway Gen-4 → Flux → Meshy
 *
 * Cost (rough, per asset; provider-specific adapter computes the precise cost):
 *   image  ~ $0.005-0.04  → 5-30 credits
 *   video  ~ $0.10-0.40   → 100-300 credits
 *   3D     ~ $0.05-0.20   → 50-200 credits
 *
 * @owner W1 — T16 (docs/MASTER.md §5.1, AI-DEV-GUIDE Task 16)
 */
import { z } from 'zod'

export type AssetType = 'image' | 'video' | 'model3d'
export type AssetRegion = 'cn' | 'global'

export interface ArtistRequest {
  type: AssetType
  prompt: string
  /** Optional negative-prompt keywords. */
  negative?: string[]
  referenceImageUrls?: string[]
  /** Image: aspect ratio. Video: 9:16 / 16:9 / 1:1. */
  aspectRatio?: '1:1' | '16:9' | '9:16' | '4:5' | '3:2'
  /** Video only — seconds (4-10). */
  durationSec?: number
  /** Strength of style transfer (0-1). */
  strength?: number
  /** Idempotency key — if same key was already produced, return cached. */
  idempotencyKey?: string
}

export interface ArtistResult {
  url: string
  thumbnailUrl?: string
  /** Provider that actually produced the asset. */
  providerId: string
  costUsd: number
  durationMs: number
  /** Metadata so callers can store generator + prompt for the Media Library. */
  metadata: {
    type: AssetType
    prompt: string
    aspectRatio?: string
    durationSec?: number
    width?: number
    height?: number
  }
}

export interface AssetProvider {
  readonly id: string
  readonly displayName: string
  readonly capabilities: AssetType[]
  /** Higher = preferred. CN providers get higher score on region=cn. */
  scoreFor(region: AssetRegion, type: AssetType): number
  generate(req: ArtistRequest): Promise<ArtistResult>
}

export class ArtistError extends Error {
  override name = 'ArtistError'
  constructor(
    message: string,
    public readonly code: 'NO_PROVIDER' | 'ALL_PROVIDERS_FAILED' | 'INVALID_INPUT' | 'UPSTREAM',
    public readonly causes?: Error[],
  ) {
    super(message)
  }
}

export interface ArtistOptions {
  region?: AssetRegion
  /** Bring your own providers — defaults to the registered global registry. */
  providers?: AssetProvider[]
  /** Telemetry callback per attempt (success or failure). */
  onAttempt?: (info: { providerId: string; ok: boolean; durationMs: number; error?: string }) => void
}

const ArtistRequestSchema = z.object({
  type: z.enum(['image', 'video', 'model3d']),
  prompt: z.string().min(8).max(2000),
  negative: z.array(z.string()).max(16).optional(),
  referenceImageUrls: z.array(z.string().url()).max(8).optional(),
  aspectRatio: z.enum(['1:1', '16:9', '9:16', '4:5', '3:2']).optional(),
  durationSec: z.number().int().min(2).max(12).optional(),
  strength: z.number().min(0).max(1).optional(),
  idempotencyKey: z.string().optional(),
})

/**
 * Run a generation request through the chain of providers.
 *
 * Picks the highest-scored provider that can handle `req.type`, tries it,
 * on failure walks down the score-ordered list. Each attempt fires
 * `onAttempt` for telemetry. Throws `ArtistError` if every provider failed.
 */
export async function generateAsset(
  req: ArtistRequest,
  options: ArtistOptions = {},
): Promise<ArtistResult> {
  ArtistRequestSchema.parse(req)
  const region = options.region ?? 'cn'
  const candidates = (options.providers ?? defaultProviders())
    .filter((p) => p.capabilities.includes(req.type))
    .map((p) => ({ p, score: p.scoreFor(region, req.type) }))
    .sort((a, b) => b.score - a.score)
    .map((x) => x.p)

  if (candidates.length === 0) {
    throw new ArtistError(`No provider can handle type=${req.type}`, 'NO_PROVIDER')
  }

  const causes: Error[] = []
  for (const provider of candidates) {
    const startedAt = Date.now()
    try {
      const result = await provider.generate(req)
      options.onAttempt?.({
        providerId: provider.id,
        ok: true,
        durationMs: Date.now() - startedAt,
      })
      return result
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      causes.push(error)
      options.onAttempt?.({
        providerId: provider.id,
        ok: false,
        durationMs: Date.now() - startedAt,
        error: error.message,
      })
    }
  }
  throw new ArtistError(`All ${candidates.length} provider(s) failed for ${req.type}.`, 'ALL_PROVIDERS_FAILED', causes)
}

// ──────────────────────────────────────────────────────────────────────────
//  Default provider registry
//
//  Each provider lives in its own file; this entry point only ships the mock
//  + adapter classes — production wiring (real API keys + HTTP) is plugged
//  in by the worker process.
// ──────────────────────────────────────────────────────────────────────────

let defaultRegistry: AssetProvider[] | undefined

/** Returns the lazily-built default provider list (mock-only without env). */
export function defaultProviders(): AssetProvider[] {
  if (defaultRegistry) return defaultRegistry
  const list: AssetProvider[] = []
  list.push(new MockArtistProvider('mock-image', 'Mock Image', ['image']))
  list.push(new MockArtistProvider('mock-video', 'Mock Video', ['video']))
  list.push(new MockArtistProvider('mock-3d', 'Mock 3D', ['model3d']))
  // Real providers register themselves on import — see ./artist-providers/*.
  defaultRegistry = list
  return list
}

/** Registers a custom provider (e.g. KlingProvider) into the default list. */
export function registerProvider(provider: AssetProvider): void {
  defaultProviders().unshift(provider)
}

// ──────────────────────────────────────────────────────────────────────────
//  Mock implementation — used in tests and dev without API keys.
// ──────────────────────────────────────────────────────────────────────────

export class MockArtistProvider implements AssetProvider {
  constructor(
    public readonly id: string,
    public readonly displayName: string,
    public readonly capabilities: AssetType[],
  ) {}
  scoreFor(_region: AssetRegion, type: AssetType): number {
    return this.capabilities.includes(type) ? 1 : 0
  }
  async generate(req: ArtistRequest): Promise<ArtistResult> {
    const w = req.type === 'image' ? 1024 : 1920
    const h = req.type === 'image' ? 1024 : 1080
    return {
      url: `https://placehold.co/${w}x${h}.${req.type === 'video' ? 'mp4' : req.type === 'model3d' ? 'glb' : 'jpg'}?text=${encodeURIComponent(req.prompt.slice(0, 30))}`,
      thumbnailUrl: req.type === 'video' ? `https://placehold.co/${w}x${h}.jpg` : undefined,
      providerId: this.id,
      costUsd: req.type === 'video' ? 0.15 : req.type === 'model3d' ? 0.08 : 0.01,
      durationMs: 320,
      metadata: {
        type: req.type,
        prompt: req.prompt,
        aspectRatio: req.aspectRatio,
        durationSec: req.durationSec,
        width: w,
        height: h,
      },
    }
  }
}
