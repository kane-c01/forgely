import * as React from 'react'
import { Loader2 } from 'lucide-react'

import { cn } from './utils'

export interface SpinnerProps extends React.SVGAttributes<SVGSVGElement> {
  size?: 'xs' | 'sm' | 'md' | 'lg'
  label?: string
}

const sizeMap = {
  xs: 'h-3 w-3',
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
} as const

/**
 * Spinner — minimal Lucide-based loader with the Forge Orange accent.
 * `label` is rendered into a visually hidden span for accessibility.
 */
export function Spinner({ size = 'md', label = 'Loading', className, ...props }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-live="polite"
      className="text-forge-orange inline-flex items-center gap-2"
    >
      <Loader2
        aria-hidden
        className={cn('text-forge-orange animate-spin', sizeMap[size], className)}
        {...props}
      />
      <span className="sr-only">{label}</span>
    </span>
  )
}
