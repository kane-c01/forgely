import { describe, expect, it } from 'vitest'

import { IdSchema, paginate } from '../../src/routers/_shared.js'

describe('routers/_shared', () => {
  describe('IdSchema', () => {
    it('accepts cuid-shaped ids', () => {
      expect(IdSchema.safeParse('clxa9b8c0000abcd1234').success).toBe(true)
      expect(IdSchema.safeParse('user_42').success).toBe(true)
    })

    it('rejects whitespace + special chars + empty', () => {
      expect(IdSchema.safeParse('').success).toBe(false)
      expect(IdSchema.safeParse('with space').success).toBe(false)
      expect(IdSchema.safeParse('drop;table').success).toBe(false)
    })
  })

  describe('paginate', () => {
    const rows = Array.from({ length: 6 }, (_, i) => ({ id: `r${i}` }))

    it('returns nextCursor when there are more rows than limit', () => {
      const result = paginate(rows, 5)
      expect(result.items).toHaveLength(5)
      expect(result.nextCursor).toBe('r5')
    })

    it('returns null cursor when at the tail', () => {
      const result = paginate(rows.slice(0, 3), 5)
      expect(result.items).toHaveLength(3)
      expect(result.nextCursor).toBeNull()
    })
  })
})
