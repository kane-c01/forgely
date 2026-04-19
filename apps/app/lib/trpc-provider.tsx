'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, type ReactNode } from 'react'
import superjson from 'superjson'

import { trpc, trpcLinks } from './trpc'

interface TrpcProviderProps {
  children: ReactNode
}

/**
 * tRPC + React Query Provider.
 *
 * Sits as the outermost client provider in `app/layout.tsx` so every page
 * can call `trpc.<router>.<proc>.useQuery(...)`.
 *
 * Defaults are tuned for a dashboard (lots of small reads, fast retries):
 *   - 30 s stale time (KPIs and lists are fine being a half-minute behind)
 *   - 1 retry on transient failures
 *   - refetch on window focus (so coming back to a tab shows fresh data)
 */
export function TrpcProvider({ children }: TrpcProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: 1,
            refetchOnWindowFocus: true,
          },
          mutations: { retry: 0 },
        },
      }),
  )

  const [trpcClient] = useState(() =>
    trpc.createClient({
      transformer: superjson,
      links: trpcLinks,
    }),
  )

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  )
}
