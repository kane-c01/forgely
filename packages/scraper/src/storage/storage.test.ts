import { mkdtemp, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { LocalAssetStorage } from './local.js'
import { InMemoryAssetStorage } from './memory.js'

describe('InMemoryAssetStorage', () => {
  it('stores and reads bytes back', async () => {
    const storage = new InMemoryAssetStorage()
    const bytes = new Uint8Array([1, 2, 3])
    const put = await storage.put({ key: 'a/b.bin', body: bytes, contentType: 'application/octet-stream' })
    expect(put.url).toBe('mem://forgely-scraper/a/b.bin')
    expect(put.size).toBe(3)
    expect(await storage.exists('a/b.bin')).toBe(true)
    const got = await storage.get('a/b.bin')
    expect(got?.body).toEqual(bytes)
    expect(got?.contentType).toBe('application/octet-stream')
  })

  it('returns null on miss', async () => {
    const storage = new InMemoryAssetStorage()
    expect(await storage.get('missing')).toBeNull()
    expect(await storage.exists('missing')).toBe(false)
  })
})

describe('LocalAssetStorage', () => {
  it('writes to disk and returns file:// URL', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'forgely-scraper-'))
    const storage = new LocalAssetStorage(dir)
    const bytes = new Uint8Array([9, 9, 9])
    const put = await storage.put({ key: 'foo/bar.bin', body: bytes })
    expect(put.url.startsWith('file://')).toBe(true)
    const onDisk = await readFile(join(dir, 'foo', 'bar.bin'))
    expect(new Uint8Array(onDisk)).toEqual(bytes)
    expect(await storage.exists('foo/bar.bin')).toBe(true)
  })

  it('respects publicBaseUrl when supplied', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'forgely-scraper-'))
    const storage = new LocalAssetStorage(dir, 'https://cdn.local/')
    const put = await storage.put({ key: 'a.txt', body: new Uint8Array() })
    expect(put.url).toBe('https://cdn.local/a.txt')
  })

  it('returns null/false on miss', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'forgely-scraper-'))
    const storage = new LocalAssetStorage(dir)
    expect(await storage.get('nope')).toBeNull()
    expect(await storage.exists('nope')).toBe(false)
  })
})
