/**
 * Vidu Provider — 国内主力视频生成（生数科技），region=cn 首选。
 *
 * https://vidu.com (Studio API)
 *
 * Capability: video. Cost ≈ ¥1.5-3 per 4-second clip.
 *
 * @owner W1 — T16 (docs/PIVOT-CN.md §5)
 */
import {
  type ArtistRequest,
  type ArtistResult,
  type AssetProvider,
  type AssetRegion,
  type AssetType,
} from '../artist'

export interface ViduProviderOptions {
  apiKey: string
  baseUrl?: string
  pollMs?: number
  timeoutMs?: number
}

export class ViduProvider implements AssetProvider {
  readonly id = 'vidu'
  readonly displayName = 'Vidu (生数)'
  readonly capabilities: AssetType[] = ['video']
  private readonly apiKey: string
  private readonly baseUrl: string
  private readonly pollMs: number
  private readonly timeoutMs: number

  constructor(opts: ViduProviderOptions) {
    if (!opts.apiKey) throw new Error('VIDU_API_KEY missing.')
    this.apiKey = opts.apiKey
    this.baseUrl = opts.baseUrl ?? 'https://api.vidu.com/v1'
    this.pollMs = opts.pollMs ?? 3000
    this.timeoutMs = opts.timeoutMs ?? 8 * 60_000
  }

  scoreFor(region: AssetRegion, type: AssetType): number {
    if (type !== 'video') return 0
    return region === 'cn' ? 90 : 50
  }

  async generate(req: ArtistRequest): Promise<ArtistResult> {
    const startedAt = Date.now()
    const submit = await fetch(`${this.baseUrl}/text2video`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Token ${this.apiKey}` },
      body: JSON.stringify({
        model: 'vidu-1.5',
        prompt: req.prompt,
        aspect_ratio: req.aspectRatio ?? '16:9',
        duration: req.durationSec ?? 4,
      }),
    })
    if (!submit.ok) throw new Error(`Vidu submit failed: HTTP ${submit.status}`)
    const submitJson = (await submit.json()) as { task_id?: string }
    const taskId = submitJson.task_id
    if (!taskId) throw new Error('Vidu submit returned no task_id.')

    const deadline = startedAt + this.timeoutMs
    while (Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, this.pollMs))
      const poll = await fetch(`${this.baseUrl}/tasks/${taskId}`, {
        headers: { authorization: `Token ${this.apiKey}` },
      })
      if (!poll.ok) continue
      const json = (await poll.json()) as { state?: string; creations?: Array<{ url: string }> }
      if (json.state === 'success') {
        const url = json.creations?.[0]?.url
        if (!url) throw new Error('Vidu task succeeded but no video url.')
        return {
          url,
          providerId: this.id,
          costUsd: 0.22,
          durationMs: Date.now() - startedAt,
          metadata: {
            type: 'video',
            prompt: req.prompt,
            aspectRatio: req.aspectRatio,
            durationSec: req.durationSec ?? 4,
          },
        }
      }
      if (json.state === 'failed') throw new Error('Vidu task failed upstream.')
    }
    throw new Error('Vidu generation timed out.')
  }
}
