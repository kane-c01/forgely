/**
 * Smoke tests for sitesRouter — focuses on the parts that don't need a
 * live Postgres: subdomain validation rules and the reserved-list logic.
 */
import { describe, expect, it } from 'vitest'

import { SUBDOMAIN_REGEX, isReservedSubdomain } from '../../src/routers/sites.js'

describe('routers/sites — subdomain rules', () => {
  it('regex accepts realistic subdomains', () => {
    for (const slug of ['toybloom', 'jane-store', 'ab1', 'kyoto42']) {
      expect(SUBDOMAIN_REGEX.test(slug)).toBe(true)
    }
  })

  it('regex rejects malformed subdomains', () => {
    for (const slug of [
      '1stpopup',
      '-leading',
      'trailing-',
      'TOO',
      'with_underscore',
      'has space',
      'a',
      'this-is-way-too-long-for-a-subdomain-and-should-fail',
    ]) {
      expect(SUBDOMAIN_REGEX.test(slug)).toBe(false)
    }
  })

  it('reserved subdomains are rejected', () => {
    expect(isReservedSubdomain('app')).toBe(true)
    expect(isReservedSubdomain('API')).toBe(true)
    expect(isReservedSubdomain('forgely')).toBe(true)
  })

  it('regular slugs are not reserved', () => {
    expect(isReservedSubdomain('toybloom')).toBe(false)
    expect(isReservedSubdomain('janestore')).toBe(false)
  })
})
