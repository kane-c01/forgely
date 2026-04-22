import { isDemoFallbackEnabled } from './demo-mode'

/**
 * Hybrid data source — try tRPC first, fall back to in-memory mocks.
 *
 * The whole dashboard was prototyped against `lib/mocks.ts` so the UI
 * can render without a database. Sprint 3 adds real tRPC backed by
 * Postgres, but most dev environments don't have `DATABASE_URL` set,
 * which would crash every list/detail page.
 *
 * Pattern:
 *   const { data, isLoading, source } = useDataSource(
 *     trpc.sites.list.useQuery({}),
 *     mockSites,
 *   )
 *
 *   - When the tRPC call succeeds → real data, `source: 'trpc'`.
 *   - When it fails / is unavailable → mocks, `source: 'mock'`.
 *
 * Pages can use `source` to render a small "demo data" badge so users
 * know whether what they see is live.
 */
export interface DataSourceResult<T> {
  data: T
  isLoading: boolean
  source: 'trpc' | 'mock'
  error: unknown
}

interface QueryLike<T> {
  data?: T
  isLoading: boolean
  isError: boolean
  error: unknown
}

function emptyLike<T>(fallback: T): T {
  if (Array.isArray(fallback)) return [] as unknown as T
  return fallback
}

export function selectDataSource<T>(query: QueryLike<T>, fallback: T): DataSourceResult<T> {
  const demo = isDemoFallbackEnabled()

  if (!query.isError && query.data !== undefined) {
    return { data: query.data, isLoading: query.isLoading, source: 'trpc', error: null }
  }
  if (query.isError) {
    if (!demo) {
      return {
        data: emptyLike(fallback),
        isLoading: false,
        source: 'trpc',
        error: query.error,
      }
    }
    return { data: fallback, isLoading: false, source: 'mock', error: query.error }
  }
  if (!demo) {
    return {
      data: emptyLike(fallback),
      isLoading: query.isLoading,
      source: 'trpc',
      error: null,
    }
  }
  return { data: fallback, isLoading: query.isLoading, source: 'mock', error: null }
}
