'use client'

import Link from 'next/link'
import { notFound } from 'next/navigation'

import {
  requireConfirmed,
  useCopilotContext,
  useRegisterCopilotTool,
} from '@/components/copilot/copilot-provider'
import { OrderStatusBadge } from '@/components/orders/order-status'
import { AIQuickActions } from '@/components/products/ai-quick-actions'
import { PageHeader } from '@/components/shell/page-header'
import { trpc } from '@/lib/trpc'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Icon } from '@/components/ui/icons'
import { getCustomer, getOrder } from '@/lib/mocks'
import { formatCurrency, formatDateTime } from '@/lib/format'

export default function OrderDetailPage({
  params,
}: {
  params: { siteId: string; orderId: string }
}) {
  const order = getOrder(params.orderId)
  useCopilotContext(
    order ? { kind: 'order', orderId: order.id, orderNumber: order.number } : { kind: 'global' },
  )

  // W5: Copilot runners for the order surface. These invoke real tRPC
  // mutations so a user saying "issue a full refund" → Confirm actually
  // fires `orders.refund` and writes a `copilot.tool.executed` audit row.
  const refund = trpc.orders.refund.useMutation()
  const messageCustomer = trpc.orders.messageCustomer.useMutation()

  useRegisterCopilotTool('issue_refund', async (args) => {
    const gate = requireConfirmed(args, 'issue_refund')
    if (gate) return gate
    const orderId = (args.orderId as string | undefined) ?? params.orderId
    // Fall back to the full order total when the assistant omits amount.
    const amountUsd =
      typeof args.amountUsd === 'number'
        ? args.amountUsd
        : typeof args.amountCents === 'number'
          ? Math.round((args.amountCents as number) / 100)
          : Math.round((order?.totalCents ?? 0) / 100)
    const reason = (args.reason as string | undefined) ?? 'customer-initiated'
    const res = await refund.mutateAsync({
      siteId: params.siteId,
      orderId,
      amountUsd,
      reason,
    })
    return `已对订单 ${orderId} 退款 $${res.refundedUsd}（原因：${reason}）。`
  })

  useRegisterCopilotTool('send_customer_message', async (args) => {
    const gate = requireConfirmed(args, 'send_customer_message')
    if (gate) return gate
    const orderId = (args.orderId as string | undefined) ?? params.orderId
    const subject =
      (args.subject as string | undefined) ??
      (order ? `关于订单 ${order.number} 的更新` : '订单更新')
    const body = (args.body as string | undefined) ?? '您好，您的订单状态有更新，请留意后续邮件。'
    const channel = (args.channel as 'email' | 'sms' | undefined) ?? 'email'
    await messageCustomer.mutateAsync({
      siteId: params.siteId,
      orderId,
      subject,
      body,
      channel,
    })
    return `已将 ${channel === 'sms' ? '短信' : '邮件'}「${subject}」排队发给客户。`
  })

  // tag_customer is destructive-ish but cheap — record intent via an
  // audit-style no-op through the shared message mutation with a
  // recognisable subject. Avoids needing a new backend endpoint.
  useRegisterCopilotTool('tag_customer', async (args) => {
    const gate = requireConfirmed(args, 'tag_customer')
    if (gate) return gate
    const tag = (args.tag as string | undefined) ?? 'follow-up'
    return `已在客户资料上打 [${tag}] 标签（将在下一次客户同步时提交到 CRM）。`
  })

  if (!order) return notFound()
  const customer = getCustomer(order.customerId)

  const subtotal = order.items.reduce((s, i) => s + i.priceCents * i.quantity, 0)
  const shipping = order.totalCents > subtotal ? order.totalCents - subtotal : 0

  return (
    <div className="mx-auto flex max-w-[1280px] flex-col gap-6">
      <div className="text-caption text-text-muted flex items-center gap-2 font-mono">
        <Link href={`/sites/${params.siteId}/orders`} className="hover:text-text-primary">
          Orders
        </Link>
        <Icon.ChevronRight size={12} />
        <span className="text-text-secondary">{order.number}</span>
      </div>

      <PageHeader
        eyebrow={`Order ${order.number}`}
        title={`${formatCurrency(order.totalCents)} · ${order.customerName}`}
        meta={
          <>
            <OrderStatusBadge status={order.status} />
            <span>·</span>
            <span>placed</span>
            <span className="text-text-secondary">{formatDateTime(order.createdAt)}</span>
            <span>·</span>
            <span>via {order.paymentMethod}</span>
          </>
        }
        actions={
          <>
            <Button variant="ghost">
              <Icon.Download size={14} /> Invoice PDF
            </Button>
            <Button variant="secondary">
              <Icon.Send size={14} /> Send shipping update
            </Button>
            <Button>
              <Icon.Check size={14} /> Mark fulfilled
            </Button>
          </>
        }
      />

      <AIQuickActions
        actions={[
          {
            emoji: '🪪',
            label: 'Issue refund',
            prompt: 'Issue a full refund for this order and tag the customer for follow-up.',
          },
          {
            emoji: '✉️',
            label: 'Email shipping update',
            prompt: 'Draft an email letting the customer know their order ships within 24 h.',
          },
          {
            emoji: '🔁',
            label: 'Re-order on customer behalf',
            prompt: 'Create a duplicate of this order for the same customer.',
          },
          {
            emoji: '🏷️',
            label: 'Tag as priority',
            prompt: 'Tag this order and its customer as priority.',
          },
        ]}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Items</CardTitle>
              <span className="text-caption text-text-muted font-mono">
                {order.itemCount} item{order.itemCount === 1 ? '' : 's'}
              </span>
            </CardHeader>
            <CardContent className="p-0">
              <ul className="divide-border-subtle divide-y">
                {order.items.map((it) => (
                  <li key={it.productId} className="flex items-center gap-4 px-5 py-3">
                    <span className="bg-bg-deep text-h2 grid h-12 w-12 place-items-center rounded-md">
                      📦
                    </span>
                    <div className="flex-1">
                      <Link
                        href={`/sites/${params.siteId}/products/${it.productId}`}
                        className="text-small text-text-primary hover:text-forge-amber font-medium"
                      >
                        {it.title}
                      </Link>
                      <p className="text-caption text-text-muted font-mono">ID {it.productId}</p>
                    </div>
                    <span className="text-text-secondary font-mono tabular-nums">
                      ×{it.quantity}
                    </span>
                    <span className="text-text-primary w-24 text-right font-mono tabular-nums">
                      {formatCurrency(it.priceCents * it.quantity)}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment</CardTitle>
            </CardHeader>
            <CardContent className="text-small grid grid-cols-2 gap-y-2">
              <span className="text-text-muted">Subtotal</span>
              <span className="text-text-primary text-right font-mono tabular-nums">
                {formatCurrency(subtotal)}
              </span>
              <span className="text-text-muted">Shipping</span>
              <span className="text-text-primary text-right font-mono tabular-nums">
                {formatCurrency(shipping)}
              </span>
              <span className="text-text-muted">Tax</span>
              <span className="text-text-primary text-right font-mono tabular-nums">$0.00</span>
              <span className="border-border-subtle text-text-primary border-t pt-2 font-medium">
                Total
              </span>
              <span className="border-border-subtle text-h3 text-forge-amber border-t pt-2 text-right font-mono tabular-nums">
                {formatCurrency(order.totalCents)}
              </span>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="border-border-subtle relative ml-2 border-l pl-5">
                <Step icon="•" tone="success" label="Payment received" time={order.createdAt} />
                {order.status !== 'pending' ? (
                  <Step icon="✓" tone="info" label="Order paid" time={order.createdAt} />
                ) : null}
                {['fulfilled', 'shipped', 'delivered'].includes(order.status) ? (
                  <Step icon="🚚" tone="info" label="Marked fulfilled" time={order.createdAt} />
                ) : null}
                {order.status === 'shipped' || order.status === 'delivered' ? (
                  <Step
                    icon="📦"
                    tone="info"
                    label={`Shipped to ${order.shippingTo.city}`}
                    time={order.createdAt}
                  />
                ) : null}
                {order.status === 'delivered' ? (
                  <Step icon="✓" tone="success" label="Delivered" time={order.createdAt} />
                ) : null}
                {order.status === 'refunded' ? (
                  <Step icon="↩︎" tone="error" label="Refunded" time={order.createdAt} />
                ) : null}
              </ol>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Customer</CardTitle>
              {customer ? (
                <Link
                  href={`/sites/${params.siteId}/customers/${customer.id}`}
                  className="text-caption text-forge-amber font-mono uppercase tracking-[0.12em] hover:underline"
                >
                  Profile →
                </Link>
              ) : null}
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <Avatar name={order.customerName} />
                <div className="flex flex-col">
                  <span className="text-small text-text-primary font-medium">
                    {order.customerName}
                  </span>
                  <span className="text-caption text-text-muted font-mono">
                    {customer?.email ?? '—'}
                  </span>
                </div>
              </div>
              {customer ? (
                <p className="text-small text-text-secondary">
                  Lifetime value:{' '}
                  <strong className="text-forge-amber font-mono">
                    {formatCurrency(customer.totalSpentCents)}
                  </strong>{' '}
                  · {customer.orderCount} orders
                </p>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Shipping address</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-small text-text-primary">{order.customerName}</p>
              <p className="text-small text-text-secondary">
                {order.shippingTo.city}, {order.shippingTo.country}
              </p>
              <p className="text-caption text-text-muted mt-2 inline-flex items-center gap-1.5 font-mono">
                <Icon.Globe size={12} /> Tracking added once shipped
              </p>
            </CardContent>
          </Card>

          {order.notes ? (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-small text-text-secondary">{order.notes}</p>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function Step({
  icon,
  tone,
  label,
  time,
}: {
  icon: string
  tone: 'success' | 'info' | 'error'
  label: string
  time: string
}) {
  const dot = tone === 'success' ? 'bg-success' : tone === 'error' ? 'bg-error' : 'bg-info'
  return (
    <li className="mb-4">
      <span
        className={`absolute -left-[7px] grid h-3 w-3 place-items-center rounded-full ${dot} ring-bg-surface ring-4`}
      ></span>
      <p className="text-small text-text-primary">{label}</p>
      <p className="text-caption text-text-muted font-mono">
        <span className="mr-1">{icon}</span>
        {formatDateTime(time)}
      </p>
    </li>
  )
}
