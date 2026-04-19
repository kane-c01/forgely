import type {
  AssetStorage,
  GetAssetResult,
  PutAssetInput,
  PutAssetResult,
} from './types.js'

interface StoredAsset {
  body: Uint8Array
  contentType?: string
}

/**
 * In-memory storage. Used by tests and local previews. Returns synthetic
 * `mem://` URLs that are stable for the lifetime of the process.
 */
export class InMemoryAssetStorage implements AssetStorage {
  readonly baseUrl: string
  private readonly map = new Map<string, StoredAsset>()

  constructor(baseUrl = 'mem://forgely-scraper/') {
    this.baseUrl = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`
  }

  async put(input: PutAssetInput): Promise<PutAssetResult> {
    this.map.set(input.key, {
      body: input.body,
      contentType: input.contentType,
    })
    return {
      url: `${this.baseUrl}${input.key}`,
      key: input.key,
      size: input.body.byteLength,
    }
  }

  async get(key: string): Promise<GetAssetResult | null> {
    const found = this.map.get(key)
    return found ? { ...found } : null
  }

  async exists(key: string): Promise<boolean> {
    return this.map.has(key)
  }

  /** Test helper. */
  size(): number {
    return this.map.size
  }
}
