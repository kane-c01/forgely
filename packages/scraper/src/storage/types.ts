/**
 * Pluggable object storage used to mirror remote assets (product images,
 * screenshots ...) into Forgely-owned storage.
 *
 * Implementations: in-memory (tests), local FS (dev), Cloudflare R2 (prod).
 */
export interface AssetStorage {
  /** Persist an asset and return a publicly-resolvable URL. */
  put(input: PutAssetInput): Promise<PutAssetResult>
  /** Read raw bytes back. Returns null on miss. */
  get(key: string): Promise<GetAssetResult | null>
  /** Cheap existence check. */
  exists(key: string): Promise<boolean>
}

export interface PutAssetInput {
  /** Logical key, e.g. `scrapes/site_123/products/abc.jpg`. */
  key: string
  body: Uint8Array
  contentType?: string
  /** Optional cache headers. */
  cacheControl?: string
}

export interface PutAssetResult {
  url: string
  key: string
  size: number
}

export interface GetAssetResult {
  body: Uint8Array
  contentType?: string
}
