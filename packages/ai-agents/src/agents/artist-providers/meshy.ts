/**
 * Meshy Provider — text/image to 3D model (.glb).
 *
 * https://docs.meshy.ai
 *
 * Capability: model3d. Cost ≈ $0.05-0.20 per model (depends on quality preset).
 *
 * @owner W1 — T16
 */
import {
  type ArtistRequest,
  type ArtistResult,
  type AssetProvider,
  type AssetRegion,
  type AssetType,
} from '../artist'

export interface MeshyProviderOptions {
  apiKey: string
  baseUrl?: string
  pollMs?: number
  timeoutMs?: number
  quality?: 'preview' | 'refine'
}

export class MeshyProvider implements AssetProvider {
  readonly id = 'meshy'
  readonly displayName = 'Meshy 3D'
  readonly capabilities: AssetType[] = ['model3d']
  private readonly apiKey: string
  private readonly baseUrl: string
  private readonly pollMs: number
  private readonly timeoutMs: number
  private readonly quality: 'preview' | 'refine'

  constructor(opts: MeshyProviderOptions) {
    if (!opts.apiKey) throw new Error('MESHY_API_KEY missing.')
    this.apiKey = opts.apiKey
    this.baseUrl = opts.baseUrl ?? 'https://api.meshy.ai/openapi/v2'
    this.pollMs = opts.pollMs ?? 5000
    this.timeoutMs = opts.timeoutMs ?? 10 * 60_000
    this.quality = opts.quality ?? 'preview'
  }

  scoreFor(_region: AssetRegion, type: AssetType): number {
    return type === 'model3d' ? 90 : 0
  }

  async generate(req: ArtistRequest): Promise<ArtistResult> {
    const startedAt = Date.now()
    const submit = await fetch(`${this.baseUrl}/text-to-3d`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${this.apiKey}` },
      body: JSON.stringify({
        mode: this.quality,
        prompt: req.prompt,
        art_style: 'realistic',
        ai_model: 'meshy-4',
      }),
    })
    if (!submit.ok) throw new Error(`Meshy submit failed: HTTP ${submit.status}`)
    const submitJson = (await submit.json()) as { result?: string }
    const taskId = submitJson.result
    if (!taskId) throw new Error('Meshy submit returned no task id.')

    const deadline = startedAt + this.timeoutMs
    while (Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, this.pollMs))
      const poll = await fetch(`${this.baseUrl}/text-to-3d/${taskId}`, {
        headers: { authorization: `Bearer ${this.apiKey}` },
      })
      if (!poll.ok) continue
      const json = (await poll.json()) as { status?: string; model_urls?: { glb?: string }; thumbnail_url?: string }
      if (json.status === 'SUCCEEDED') {
        const url = json.model_urls?.glb
        if (!url) throw new Error('Meshy succeeded but no glb url.')
        return {
          url,
          thumbnailUrl: json.thumbnail_url,
          providerId: this.id,
          costUsd: this.quality === 'refine' ? 0.18 : 0.05,
          durationMs: Date.now() - startedAt,
          metadata: { type: 'model3d', prompt: req.prompt },
        }
      }
      if (json.status === 'FAILED' || json.status === 'EXPIRED') {
        throw new Error(`Meshy task ${json.status}.`)
      }
    }
    throw new Error('Meshy generation timed out.')
  }
}
