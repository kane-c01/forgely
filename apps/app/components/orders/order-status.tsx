import { Badge } from '@/components/ui/badge'
import type { OrderStatus } from '@/lib/types'

const TONE: Record<OrderStatus, 'success' | 'forge' | 'warning' | 'info' | 'neutral' | 'error'> = {
  pending: 'warning',
  paid: 'success',
  fulfilled: 'success',
  shipped: 'info',
  delivered: 'success',
  refunded: 'error',
  cancelled: 'neutral',
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <Badge tone={TONE[status]} dot={status === 'pending' || status === 'paid'}>
      {status}
    </Badge>
  )
}

export function statusTone(status: OrderStatus) {
  return TONE[status]
}
