import { describe, expect, it } from 'vitest'

import { presignUpload } from '../../src/routers/_storage.js'

describe('routers/_storage.presignUpload (stub)', () => {
  it('builds a tenant-scoped key under users/{userId}/', async () => {
    const result = await presignUpload({
      userId: 'u1',
      filename: 'logo.png',
      type: 'image',
      mimeType: 'image/png',
      sizeBytes: 1024,
    })
    expect(result.key).toMatch(/^users\/u1\/image\/[0-9a-f]{16}-logo\.png$/)
    expect(result.publicUrl).toContain(result.key)
    expect(result.uploadUrl).toContain(encodeURIComponent(result.key))
  })

  it('inserts siteId fragment when present', async () => {
    const result = await presignUpload({
      userId: 'u1',
      siteId: 's1',
      filename: 'hero.mp4',
      type: 'video',
      mimeType: 'video/mp4',
      sizeBytes: 1024,
    })
    expect(result.key).toMatch(/^users\/u1\/s1\/video\/[0-9a-f]{16}-hero\.mp4$/)
  })

  it('sanitises unsafe characters in the filename', async () => {
    const result = await presignUpload({
      userId: 'u1',
      filename: 'path/with weird*chars?.png',
      type: 'image',
      mimeType: 'image/png',
      sizeBytes: 100,
    })
    expect(result.key).not.toContain('/with')
    expect(result.key).toMatch(/path_with_weird_chars_\.png$/)
  })

  it('expiresAt is in the future', async () => {
    const result = await presignUpload({
      userId: 'u1',
      filename: 'x.png',
      type: 'image',
      mimeType: 'image/png',
      sizeBytes: 100,
    })
    expect(result.expiresAt.getTime()).toBeGreaterThan(Date.now())
  })
})
