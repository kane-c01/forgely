/**
 * Sanity tests for the Medusa stub adapter — guarantees its public shape
 * stays stable, so apps/app + storefront can rely on it during MVP.
 */
import { describe, expect, it } from 'vitest'

import { medusa } from '../../src/routers/_medusa.js'

const args = { salesChannelId: 'sc_test', limit: 25 }

describe('routers/_medusa stub', () => {
  it('listProducts returns an envelope with one placeholder', async () => {
    const list = await medusa.listProducts(args)
    expect(list.items).toHaveLength(1)
    expect(list.items[0]?.title).toMatch(/Medusa/)
    expect(list.nextCursor).toBeNull()
  })

  it('listProducts returns empty when no sales channel', async () => {
    const list = await medusa.listProducts({ ...args, salesChannelId: '' })
    expect(list.items).toEqual([])
    expect(list.total).toBe(0)
  })

  it('listOrders + listCustomers return placeholders too', async () => {
    const orders = await medusa.listOrders(args)
    const customers = await medusa.listCustomers(args)
    expect(orders.items[0]?.id).toBe('order_pending_medusa')
    expect(customers.items[0]?.email).toBe('demo@forgely.app')
  })

  it('refundOrder echoes the input', async () => {
    const result = await medusa.refundOrder('o1', 5_000)
    expect(result).toEqual({ orderId: 'o1', refundedUsd: 5_000 })
  })
})
