import { mkdir, readFile, stat, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

import type {
  AssetStorage,
  GetAssetResult,
  PutAssetInput,
  PutAssetResult,
} from './types.js'

/**
 * Filesystem-backed storage for local development. Files are written under
 * `baseDir`, URLs are returned either as `file://` (default) or rewritten
 * against an HTTP `publicBaseUrl` when running behind a dev server.
 */
export class LocalAssetStorage implements AssetStorage {
  readonly baseDir: string
  readonly publicBaseUrl?: string

  constructor(baseDir: string, publicBaseUrl?: string) {
    this.baseDir = resolve(baseDir)
    this.publicBaseUrl = publicBaseUrl
  }

  async put(input: PutAssetInput): Promise<PutAssetResult> {
    const fullPath = join(this.baseDir, input.key)
    await mkdir(dirname(fullPath), { recursive: true })
    await writeFile(fullPath, input.body)
    return {
      url: this.urlFor(input.key),
      key: input.key,
      size: input.body.byteLength,
    }
  }

  async get(key: string): Promise<GetAssetResult | null> {
    try {
      const buf = await readFile(join(this.baseDir, key))
      return { body: new Uint8Array(buf) }
    } catch {
      return null
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const s = await stat(join(this.baseDir, key))
      return s.isFile()
    } catch {
      return false
    }
  }

  private urlFor(key: string): string {
    if (this.publicBaseUrl) {
      const base = this.publicBaseUrl.endsWith('/')
        ? this.publicBaseUrl
        : `${this.publicBaseUrl}/`
      return `${base}${key}`
    }
    return pathToFileURL(join(this.baseDir, key)).toString()
  }
}
