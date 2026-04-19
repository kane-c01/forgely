import { httpRequest, type HttpRequestOptions } from '../http/client.js'
import type { AssetStorage } from '../storage/types.js'
import type { ScrapedImage, SourcePlatform } from '../types.js'

import { urlPathOnly } from './url.js'

export interface MirrorOptions {
  storage?: AssetStorage
  source: SourcePlatform
  siteId?: string
  signal?: AbortSignal
  /** Custom fetch impl (used by tests). */
  fetchImpl?: typeof fetch
}

/**
 * Try to mirror remote image into Forgely-controlled storage. Failures are
 * non-fatal — the original URL is preserved so downstream rendering still
 * works.
 */
export async function mirrorImage(
  image: ScrapedImage,
  options: MirrorOptions,
): Promise<ScrapedImage> {
  if (!options.storage) return image
  try {
    const reqOpts: HttpRequestOptions = {
      method: 'GET',
      headers: { Accept: 'image/*,*/*;q=0.5' },
      retries: 1,
      timeoutMs: 15_000,
    }
    if (options.signal !== undefined) reqOpts.signal = options.signal
    if (options.fetchImpl !== undefined) reqOpts.fetchImpl = options.fetchImpl

    const res = await httpRequest<Uint8Array>(image.url, reqOpts)
    const raw = res.data
    const bytes = raw instanceof Uint8Array ? raw : new TextEncoder().encode(String(raw))
    const contentType = res.headers.get('content-type') ?? guessContentType(image.url)
    const key = imageKey(options.source, image.url, options.siteId)
    const stored = await options.storage.put({
      key,
      body: bytes,
      contentType,
      cacheControl: 'public, max-age=2592000, immutable',
    })
    return { ...image, storedUrl: stored.url }
  } catch {
    return image
  }
}

export async function mirrorImages(
  images: ScrapedImage[],
  options: MirrorOptions,
): Promise<ScrapedImage[]> {
  if (!options.storage) return images
  return Promise.all(images.map((img) => mirrorImage(img, options)))
}

function imageKey(source: SourcePlatform, url: string, siteId?: string): string {
  const canonical = urlPathOnly(url)
  const file = canonical.split('/').filter(Boolean).slice(-1)[0] ?? 'image'
  const safe = file.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80) || 'image'
  const hash = simpleHash(canonical)
  const prefix = siteId ? `scrapes/${siteId}` : `scrapes/_unbound`
  return `${prefix}/${source}/${hash}-${safe}`
}

function simpleHash(input: string): string {
  let h = 5381
  for (let i = 0; i < input.length; i++) {
    h = ((h << 5) + h + input.charCodeAt(i)) >>> 0
  }
  return h.toString(36).padStart(7, '0').slice(0, 8)
}

function guessContentType(url: string): string {
  const ext = url.split('?')[0]?.split('.').pop()?.toLowerCase()
  switch (ext) {
    case 'png':
      return 'image/png'
    case 'webp':
      return 'image/webp'
    case 'gif':
      return 'image/gif'
    case 'svg':
      return 'image/svg+xml'
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg'
    default:
      return 'application/octet-stream'
  }
}
