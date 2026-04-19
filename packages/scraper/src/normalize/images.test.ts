import { describe, expect, it } from 'vitest'

import { InMemoryAssetStorage } from '../storage/memory.js'

import { mirrorImage, mirrorImages } from './images.js'

describe('mirrorImage', () => {
  it('returns the input untouched when no storage is provided', async () => {
    const original = { url: 'https://x.com/a.jpg' }
    const out = await mirrorImage(original, { source: 'shopify' })
    expect(out).toEqual(original)
    expect(out.storedUrl).toBeUndefined()
  })

  it('mirrors into storage and writes storedUrl', async () => {
    const storage = new InMemoryAssetStorage()
    const fetchImpl = (async () =>
      new Response(new Uint8Array([1, 2, 3]), {
        status: 200,
        headers: { 'content-type': 'image/jpeg' },
      })) as typeof fetch
    const out = await mirrorImage(
      { url: 'https://x.com/a.jpg' },
      { storage, source: 'shopify', siteId: 'site_a', fetchImpl },
    )
    expect(out.storedUrl).toMatch(/site_a\/shopify\//)
  })

  it('returns the original image when fetch fails (best-effort)', async () => {
    const storage = new InMemoryAssetStorage()
    const fetchImpl = (async () => {
      throw new Error('network down')
    }) as typeof fetch
    const out = await mirrorImage(
      { url: 'https://x.com/a.jpg' },
      { storage, source: 'shopify', fetchImpl },
    )
    expect(out.storedUrl).toBeUndefined()
    expect(out.url).toBe('https://x.com/a.jpg')
    expect(storage.size()).toBe(0)
  })

  it('preserves image metadata (alt/width/height) after mirroring', async () => {
    const storage = new InMemoryAssetStorage()
    const fetchImpl = (async () =>
      new Response(new Uint8Array([0]), {
        status: 200,
        headers: { 'content-type': 'image/png' },
      })) as typeof fetch
    const input = { url: 'https://x.com/a.png', alt: 'A', width: 100, height: 200 }
    const out = await mirrorImage(input, { storage, source: 'shopify', fetchImpl })
    expect(out.alt).toBe('A')
    expect(out.width).toBe(100)
    expect(out.height).toBe(200)
    expect(out.storedUrl).toBeDefined()
  })
})

describe('mirrorImages', () => {
  it('passes through when storage is missing', async () => {
    const images = [{ url: 'https://x.com/a.jpg' }, { url: 'https://x.com/b.jpg' }]
    const out = await mirrorImages(images, { source: 'shopify' })
    expect(out).toBe(images)
  })

  it('mirrors all images in parallel', async () => {
    const storage = new InMemoryAssetStorage()
    const fetchImpl = (async () =>
      new Response(new Uint8Array([0]), {
        status: 200,
        headers: { 'content-type': 'image/png' },
      })) as typeof fetch
    const out = await mirrorImages(
      [{ url: 'https://x.com/a.png' }, { url: 'https://x.com/b.png' }],
      { storage, source: 'shopify', fetchImpl },
    )
    expect(out.every((i) => Boolean(i.storedUrl))).toBe(true)
    expect(storage.size()).toBe(2)
  })
})
