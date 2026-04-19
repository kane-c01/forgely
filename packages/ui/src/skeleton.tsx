import * as React from 'react'

import { cn } from './utils'

/**
 * Skeleton — placeholder block with a subtle pulsing shimmer over the
 * elevated dark surface. Use while data is loading.
 */
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden
      className={cn(
        'bg-bg-elevated relative overflow-hidden rounded-md',
        'before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.6s_infinite]',
        'before:bg-gradient-to-r before:from-transparent before:via-white/5 before:to-transparent',
        className,
      )}
      {...props}
    />
  )
}
