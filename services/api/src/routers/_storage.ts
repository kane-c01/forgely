/**
 * Cloudflare R2 presigned URL helper — stub for MVP.
 *
 * Real wiring uses `@aws-sdk/client-s3` against R2's S3-compatible endpoint
 * + STS-style signed POST. Interface is final; the body of `presignUpload`
 * lands when the R2 credentials are provisioned.
 *
 * @owner W3 (backend API for T20, W6)
 */

import { randomBytes } from 'node:crypto'

export interface PresignUploadInput {
  /** Tenant scope — every key is prefixed with this. */
  userId: string
  /** Optional site scope (further key namespacing). */
  siteId?: string | null
  filename: string
  /** image | video | 3d_model | icon | audio */
  type: string
  mimeType: string
  /** Upload size, in bytes. Used to enforce free-tier quotas later. */
  sizeBytes: number
}

export interface PresignedUpload {
  /** Browser PUTs the file body to this URL with the same Content-Type. */
  uploadUrl: string
  /** R2 object key (also returned so the caller can register it after upload). */
  key: string
  /** Public CDN URL the asset will be available at after the upload completes. */
  publicUrl: string
  /** When the presigned URL stops accepting new bodies. */
  expiresAt: Date
}

const safeFilename = (raw: string): string => raw.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80)

const r2BucketAssets = (): string => process.env.R2_BUCKET_ASSETS ?? 'forgely-assets'
const r2PublicBase = (): string =>
  process.env.R2_PUBLIC_BASE ?? `https://cdn.forgely.app/${r2BucketAssets()}`

/**
 * Stub: returns a deterministic key under `users/{userId}/{siteId?}/{type}/`
 * and a faux upload URL. The browser cannot actually PUT to it — the real
 * call is gated behind feature flag until R2 creds land.
 */
export const presignUpload = async (input: PresignUploadInput): Promise<PresignedUpload> => {
  const slug = safeFilename(input.filename)
  const random = randomBytes(8).toString('hex')
  const sitePart = input.siteId ? `${input.siteId}/` : ''
  const key = `users/${input.userId}/${sitePart}${input.type}/${random}-${slug}`

  const expiresAt = new Date(Date.now() + 15 * 60 * 1000)
  const uploadUrl = `https://r2-stub.forgely.dev/upload/${encodeURIComponent(key)}?expires=${expiresAt.getTime()}`
  const publicUrl = `${r2PublicBase()}/${key}`

  return { uploadUrl, key, publicUrl, expiresAt }
}
