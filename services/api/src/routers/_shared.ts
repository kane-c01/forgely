/**
 * Shared schemas + helpers used by every tenant-scoped router under
 * `src/routers/**`.
 *
 * @owner W3
 */

import { z } from 'zod'

/** Cuid-shaped id schema (Prisma's default cuid is 25 chars, alphanumeric). */
export const IdSchema = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[a-z0-9_-]+$/i, 'Invalid id format')

/** Cursor pagination input shared by all list endpoints. */
export const PaginationInput = z.object({
  limit: z.number().int().min(1).max(100).optional(),
  cursor: z.string().optional(),
})
export type PaginationInput = z.infer<typeof PaginationInput>

/** Standard list response envelope. */
export interface PaginatedList<T> {
  items: T[]
  nextCursor: string | null
}

/**
 * Take a raw list of rows and turn it into the {items, nextCursor} envelope.
 * Pass `take = limit + 1` rows so we can detect "is there more?" cheaply.
 */
export const paginate = <T extends { id: string }>(rows: T[], limit: number): PaginatedList<T> => ({
  items: rows.slice(0, limit),
  nextCursor: rows.length > limit ? (rows[limit]?.id ?? null) : null,
})
