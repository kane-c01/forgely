import { Skeleton } from '@/components/ui/skeleton'

export default function MediaLoading() {
  return (
    <div className="mx-auto flex max-w-[1280px] flex-col gap-6">
      <Skeleton className="h-9 w-72" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="border-border-subtle bg-bg-surface overflow-hidden rounded-lg border"
          >
            <Skeleton className="aspect-square" />
            <div className="p-3">
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="mt-2 h-2 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
