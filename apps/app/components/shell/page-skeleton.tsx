import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/cn'

interface PageSkeletonProps {
  /** Choose the skeleton family that best matches the route shape. */
  variant?: 'dashboard' | 'list' | 'detail' | 'editor'
  className?: string
}

/**
 * Top-level skeleton screens used by Next.js `loading.tsx` files.
 *
 * Stays roughly proportional to the real page so the layout doesn't jump
 * once data resolves. Pure server-rendered, zero JS.
 */
export function PageSkeleton({ variant = 'list', className }: PageSkeletonProps) {
  return (
    <div className={cn('mx-auto flex max-w-[1280px] flex-col gap-6', className)}>
      <header className="flex flex-col gap-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-9 w-72" />
        <Skeleton className="h-3 w-96" />
      </header>

      {variant === 'dashboard' ? (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="border-border-subtle bg-bg-surface rounded-lg border p-4">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="mt-3 h-9 w-32" />
                <Skeleton className="mt-3 h-3 w-16" />
              </div>
            ))}
          </div>
          <Skeleton className="h-[220px] w-full rounded-lg" />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
            <Skeleton className="h-64 rounded-lg lg:col-span-3" />
            <Skeleton className="h-64 rounded-lg lg:col-span-2" />
          </div>
        </>
      ) : null}

      {variant === 'list' ? (
        <>
          <div className="flex items-center justify-between gap-2">
            <Skeleton className="h-9 w-72 rounded-md" />
            <Skeleton className="h-9 w-60 rounded-md" />
          </div>
          <div className="border-border-subtle bg-bg-surface flex flex-col gap-2 rounded-lg border p-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        </>
      ) : null}

      {variant === 'detail' ? (
        <>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="flex flex-col gap-4 lg:col-span-2">
              <Skeleton className="h-56 rounded-lg" />
              <Skeleton className="h-72 rounded-lg" />
              <Skeleton className="h-56 rounded-lg" />
            </div>
            <div className="flex flex-col gap-4">
              <Skeleton className="h-40 rounded-lg" />
              <Skeleton className="h-32 rounded-lg" />
              <Skeleton className="h-32 rounded-lg" />
            </div>
          </div>
        </>
      ) : null}

      {variant === 'editor' ? (
        <div className="grid h-[60vh] grid-cols-[280px_1fr_360px] gap-2">
          <Skeleton className="h-full rounded-lg" />
          <Skeleton className="h-full rounded-lg" />
          <Skeleton className="h-full rounded-lg" />
        </div>
      ) : null}
    </div>
  )
}
