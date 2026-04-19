import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/cn'
import { formatCurrency } from '@/lib/format'
import type { Product } from '@/lib/types'

interface Props {
  product: Product
  siteId: string
}

const STATUS_TONE = {
  active: 'success',
  draft: 'warning',
  archived: 'neutral',
} as const

export function ProductInventoryBar({ inventory }: { inventory: number }) {
  if (inventory === 0) {
    return <Badge tone="error" dot>out</Badge>
  }
  if (inventory <= 10) {
    return <Badge tone="warning" dot>low · {inventory}</Badge>
  }
  return <span className="font-mono text-caption tabular-nums text-text-secondary">{inventory}</span>
}

export function ProductPriceCell({ product }: { product: Product }) {
  return (
    <div className="flex items-center gap-2">
      <span className="font-mono tabular-nums text-text-primary">
        {formatCurrency(product.priceCents)}
      </span>
      {product.compareAtCents ? (
        <span className="font-mono text-caption tabular-nums text-text-muted line-through">
          {formatCurrency(product.compareAtCents)}
        </span>
      ) : null}
    </div>
  )
}

export function ProductTitleCell({ product, siteId }: Props) {
  return (
    <Link
      href={`/sites/${siteId}/products/${product.id}`}
      className={cn(
        'flex items-center gap-3 transition-colors',
        'hover:text-forge-amber',
      )}
    >
      <span className="grid h-9 w-9 place-items-center rounded bg-bg-deep text-h3">
        {product.images[0]}
      </span>
      <span className="flex flex-col">
        <span className="text-small font-medium text-text-primary group-hover:text-forge-amber">
          {product.title}
        </span>
        <span className="font-mono text-caption text-text-muted">/{product.handle}</span>
      </span>
      {product.hot ? <Badge tone="forge" dot>hot</Badge> : null}
    </Link>
  )
}

export function ProductStatusCell({ product }: { product: Product }) {
  return (
    <Badge tone={STATUS_TONE[product.status]} dot={product.status === 'active'}>
      {product.status}
    </Badge>
  )
}
