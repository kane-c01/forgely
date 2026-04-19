/**
 * Kling 2.0 Provider — global cinematic video.
 *
 * https://kling.kuaishou.com (Klingai 提供国际版 + 国内版 API)
 *
 * Capability: video (6-10s loop). Cost ≈ $0.20-0.40 per generation.
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

export interface KlingProviderOptions {
  apiKey: string
  baseUrl?: string
  /** Request polling interval (ms). */
  pollMs?: number
  timeoutMs?: number
}

export class KlingProvider implements AssetProvider {
  readonly id = 'kling'
  readonly displayName = 'Kling 2.0'
  readonly capabilities: AssetType[] = ['video']
  private readonly apiKey: string
  private readonly baseUrl: string
  private readonly pollMs: number
  private readonly timeoutMs: number

  constructor(opts: KlingProviderOptions) {
    if (!opts.apiKey) throw new Error('KLING_API_KEY missing.')
    this.apiKey = opts.apiKey
    this.baseUrl = opts.baseUrl ?? 'https://api.kling.com/v1'
    this.pollMs = opts.pollMs ?? 4000
    this.timeoutMs = opts.timeoutMs ?? 8 * 60_000
  }

  scoreFor(region: AssetRegion, type: AssetType): number {
    if (type !== 'video') return 0
    return region === 'global' ? 100 : 60
  }

  async generate(req: ArtistRequest): Promise<ArtistResult> {
    const startedAt = Date.now()
    const submit = await fetch(`${this.baseUrl}/videos/text2video`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${this.apiKey}` },
      body: JSON.stringify({
        prompt: req.prompt,
        negative_prompt: (req.negative ?? []).join(', '),
        aspect_ratio: req.aspectRatio ?? '16:9',
        duration: String(req.durationSec ?? 6),
        mode: 'std',
      }),
    })
    if (!submit.ok) {
      throw new Error(`Kling submit failed: HTTP ${submit.status}`)
    }
    const submitJson = (await submit.json()) as { data?: { task_id: string } }
    const taskId = submitJson.data?.task_id
    if (!taskId) throw new Error('Kling submit returned no task_id.')

    const deadline = startedAt + this.timeoutMs
    while (Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, this.pollMs))
      const poll = await fetch(`${this.baseUrl}/videos/text2video/${taskId}`, {
        headers: { authorization: `Bearer ${this.apiKey}` },
      })
      if (!poll.ok) continue
      const json = (await poll.json()) as {
        data?: { task_status: string; task_result?: { videos: Array<{ url: string }> } }
      }
      const status = json.data?.task_status
      if (status === 'succeed') {
        const url = json.data?.task_result?.videos?.[0]?.url
        if (!url) throw new Error('Kling task succeeded but no video url.')
        return {
          url,
          providerId: this.id,
          costUsd: 0.28,
          durationMs: Date.now() - startedAt,
          metadata: {
            type: 'video',
            prompt: req.prompt,
            aspectRatio: req.aspectRatio,
            durationSec: req.durationSec ?? 6,
          },
        }
      }
      if (status === 'failed') throw new Error('Kling task failed upstream.')
    }
    throw new Error('Kling generation timed out.')
  }
}
