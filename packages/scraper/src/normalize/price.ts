import { DataValidationError } from '../errors.js'
import type { MoneyAmount } from '../types.js'

/**
 * Convert a numeric or numeric-string price into integer minor units (cents).
 *
 * Accepts:
 *   - 12.5            -> 1250
 *   - "12.50"         -> 1250
 *   - "$12.50"        -> 1250  (currency stripped)
 *   - "1.234,56"      -> 123456 (european format, when explicit hint provided)
 *   - "12,50"         -> 1250   (european when 2 fractional digits after comma)
 */
export function toMinorUnits(input: number | string): number {
  if (typeof input === 'number') {
    if (!Number.isFinite(input)) {
      throw new DataValidationError(`Cannot convert non-finite number to minor units: ${input}`)
    }
    return Math.round(input * 100)
  }

  const cleaned = input.replace(/[^\d.,-]/g, '').trim()
  if (cleaned.length === 0) {
    throw new DataValidationError(`Cannot parse price string "${input}"`)
  }

  const lastDot = cleaned.lastIndexOf('.')
  const lastComma = cleaned.lastIndexOf(',')

  let normalized: string
  if (lastDot === -1 && lastComma === -1) {
    normalized = cleaned
  } else if (lastDot > lastComma) {
    // dot is decimal, commas are thousands
    normalized = cleaned.replace(/,/g, '')
  } else if (lastComma > lastDot) {
    // comma is decimal, dots are thousands
    normalized = cleaned.replace(/\./g, '').replace(',', '.')
  } else {
    normalized = cleaned
  }

  const value = Number.parseFloat(normalized)
  if (!Number.isFinite(value)) {
    throw new DataValidationError(`Cannot parse price string "${input}"`)
  }
  return Math.round(value * 100)
}

export function makeMoney(
  raw: number | string,
  currency: string,
  rawForAudit?: string,
): MoneyAmount {
  return {
    amountCents: toMinorUnits(raw),
    currency: currency.toUpperCase(),
    raw: rawForAudit ?? (typeof raw === 'string' ? raw : undefined),
  }
}

export function lowestPrice(amounts: MoneyAmount[]): MoneyAmount {
  if (amounts.length === 0) {
    throw new DataValidationError('lowestPrice called with empty list')
  }
  let best = amounts[0]!
  for (const m of amounts) {
    if (m.currency !== best.currency) {
      // Mixed currencies: keep first, but flag via raw.
      continue
    }
    if (m.amountCents < best.amountCents) {
      best = m
    }
  }
  return best
}
