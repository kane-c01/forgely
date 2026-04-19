/**
 * Flux 1.1 Pro Provider — high-quality static image, via Fal.ai gateway.
 *
 * https://fal.ai/models/fal-ai/flux-pro/v1.1
 *
 * Capability: image. Cost ≈ $0.040 per image (Pro) / $0.025 (Schnell).
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

export interface FluxProviderOptions {
  apiKey: string
  baseUrl?: string
  /** `pro` = best quality, `schnell` = ~$0.003 cheap. */
  variant?: 'pro' | 'schnell'
}

export class FluxProvider implements AssetProvider {
  readonly id = 'flux'
  readonly displayName = 'Flux 1.1 Pro (Fal.ai)'
  readonly capabilities: AssetType[] = ['image']
  private readonly apiKey: string
  private readonly baseUrl: string
  private readonly variant: 'pro' | 'schnell'

  constructor(opts: FluxProviderOptions) {
    if (!opts.apiKey) throw new Error('FAL_API_KEY missing.')
    this.apiKey = opts.apiKey
    this.baseUrl = opts.baseUrl ?? 'https://fal.run/fal-ai'
    this.variant = opts.variant ?? 'pro'
  }

  scoreFor(_region: AssetRegion, type: AssetType): number {
    return type === 'image' ? 80 : 0
  }

  async generate(req: ArtistRequest): Promise<ArtistResult> {
    const startedAt = Date.now()
    const path = this.variant === 'pro' ? 'flux-pro/v1.1' : 'flux/schnell'
    const submit = await fetch(`${this.baseUrl}/${path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Key ${this.apiKey}` },
      body: JSON.stringify({
        prompt: req.prompt,
        image_size: req.aspectRatio === '9:16' ? 'portrait_16_9' : req.aspectRatio === '1:1' ? 'square_hd' : 'landscape_16_9',
        num_inference_steps: this.variant === 'pro' ? 28 : 4,
        guidance_scale: 3.5,
      }),
    })
    if (!submit.ok) throw new Error(`Flux submit failed: HTTP ${submit.status}`)
    const json = (await submit.json()) as { images?: Array<{ url: string; width: number; height: number }> }
    const img = json.images?.[0]
    if (!img) throw new Error('Flux returned no image.')
    return {
      url: img.url,
      providerId: this.id,
      costUsd: this.variant === 'pro' ? 0.04 : 0.003,
      durationMs: Date.now() - startedAt,
      metadata: {
        type: 'image',
        prompt: req.prompt,
        aspectRatio: req.aspectRatio,
        width: img.width,
        height: img.height,
      },
    }
  }
}
