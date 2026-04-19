import { describe, expect, it } from 'vitest'

import { absoluteUrl, apexHostname, slugify, urlPathOnly } from './url.js'

describe('absoluteUrl', () => {
  it('resolves relative paths against base', () => {
    expect(absoluteUrl('/a.jpg', 'https://x.com/foo')).toBe('https://x.com/a.jpg')
    expect(absoluteUrl('//cdn.x.com/a.jpg', 'https://x.com')).toBe('https://cdn.x.com/a.jpg')
  })

  it('returns null for empty input', () => {
    expect(absoluteUrl('', 'https://x.com')).toBeNull()
    expect(absoluteUrl(null, 'https://x.com')).toBeNull()
    expect(absoluteUrl(undefined, 'https://x.com')).toBeNull()
  })

  it('returns null for invalid URLs without an explicit base scheme', () => {
    expect(absoluteUrl('http://x x', 'invalid-base')).toBeNull()
  })
})

describe('urlPathOnly', () => {
  it('drops query and fragment', () => {
    expect(urlPathOnly('https://x.com/a/b?c=1#x')).toBe('https://x.com/a/b')
  })
  it('returns input untouched when invalid', () => {
    expect(urlPathOnly('not-a-url')).toBe('not-a-url')
  })
})

describe('apexHostname', () => {
  it('strips www', () => {
    expect(apexHostname('https://www.toy.com/')).toBe('toy.com')
    expect(apexHostname('https://acme.myshopify.com/')).toBe('acme.myshopify.com')
  })
})

describe('slugify', () => {
  it('produces ascii slugs', () => {
    expect(slugify('Forge — Hammer™')).toBe('forge-hammer')
    expect(slugify('日本語 タイトル ABC')).toBe('abc')
  })
  it('returns "item" for empty input', () => {
    expect(slugify('')).toBe('item')
  })
})
