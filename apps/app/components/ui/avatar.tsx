import { cn } from '@/lib/cn'

interface AvatarProps {
  name: string
  src?: string | null
  size?: 'xs' | 'sm' | 'md' | 'lg'
  className?: string
}

const SIZES = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-caption',
  md: 'h-10 w-10 text-small',
  lg: 'h-12 w-12 text-body',
} as const

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('') || '?'
}

function colorFromName(name: string): string {
  const palette = [
    'bg-forge-orange/30 text-forge-amber',
    'bg-info/20 text-info',
    'bg-success/20 text-success',
    'bg-warning/20 text-warning',
    'bg-data-3/20 text-data-3',
  ]
  let hash = 0
  for (let i = 0; i < name.length; i += 1) hash = (hash * 31 + name.charCodeAt(i)) >>> 0
  return palette[hash % palette.length]!
}

export function Avatar({ name, src, size = 'md', className }: AvatarProps) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- avatar uses arbitrary URLs (Gravatar/OAuth) where next/image domain configuration would over-engineer this fallback path
      <img
        src={src}
        alt={name}
        className={cn('rounded-full object-cover ring-1 ring-border-subtle', SIZES[size], className)}
      />
    )
  }
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full font-medium ring-1 ring-border-subtle',
        SIZES[size],
        colorFromName(name),
        className,
      )}
    >
      {initials(name)}
    </span>
  )
}
