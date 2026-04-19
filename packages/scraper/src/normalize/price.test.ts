import { describe, expect, it } from 'vitest'

import { DataValidationError } from '../errors.js'

import { lowestPrice, makeMoney, toMinorUnits } from './price.js'

describe('toMinorUnits', () => {
  it('handles plain numbers', () => {
    expect(toMinorUnits(0)).toBe(0)
    expect(toMinorUnits(12)).toBe(1200)
    expect(toMinorUnits(12.5)).toBe(1250)
    expect(toMinorUnits(12.345)).toBe(1235)
  })

  it('handles US-formatted strings', () => {
    expect(toMinorUnits('12.50')).toBe(1250)
    expect(toMinorUnits('$12.50')).toBe(1250)
    expect(toMinorUnits('USD 1,234.56')).toBe(123456)
  })

  it('handles European-formatted strings', () => {
    expect(toMinorUnits('1.234,56')).toBe(123456)
    expect(toMinorUnits('12,50 €')).toBe(1250)
  })

  it('throws on garbage', () => {
    expect(() => toMinorUnits('not-a-price')).toThrow(DataValidationError)
    expect(() => toMinorUnits(Number.NaN)).toThrow(DataValidationError)
  })
})

describe('makeMoney', () => {
  it('produces upper-case currency and integer cents', () => {
    const money = makeMoney('29.99', 'usd')
    expect(money).toEqual({ amountCents: 2999, currency: 'USD', raw: '29.99' })
  })
})

describe('lowestPrice', () => {
  it('returns the smallest amount within the same currency', () => {
    const m = lowestPrice([
      makeMoney('29.99', 'USD'),
      makeMoney('19.95', 'USD'),
      makeMoney('99.00', 'USD'),
    ])
    expect(m.amountCents).toBe(1995)
  })

  it('throws on empty input', () => {
    expect(() => lowestPrice([])).toThrow(DataValidationError)
  })
})
