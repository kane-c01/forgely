'use client'

import { ComingSoon } from '@/components/shell/coming-soon'
import {
  requireConfirmed,
  useCopilotContext,
  useRegisterCopilotTool,
} from '@/components/copilot/copilot-provider'

/**
 * Discounts page — still a ComingSoon placeholder for the full editor
 * UI, but we now register the `create_discount` runner here so the
 * Copilot tool-call flow has somewhere to land when a user asks "mint
 * me a launch coupon" from this surface.
 *
 * Persistence of the coupon will follow when the Marketing service
 * (V1.2) ships; until then the runner stages the code client-side and
 * returns the details for the user to copy.
 */
export default function DiscountsPage({ params }: { params: { siteId: string } }) {
  useCopilotContext({ kind: 'global' })

  useRegisterCopilotTool('create_discount', (args) => {
    const gate = requireConfirmed(args, 'create_discount')
    if (gate) return gate
    const code =
      (args.code as string | undefined) ??
      `LAUNCH${Math.random().toString(36).slice(2, 6).toUpperCase()}`
    const percent = typeof args.percent === 'number' ? (args.percent as number) : 15
    const days = typeof args.expiresInDays === 'number' ? (args.expiresInDays as number) : 7
    const maxRedemptions =
      typeof args.maxRedemptions === 'number' ? (args.maxRedemptions as number) : 200
    // Once the discounts router lands, swap this for
    // `trpc.discounts.create.useMutation()` and call it with the same
    // payload (destructive writes already gated by `requireConfirmed`).
    return `已为站点 ${params.siteId} 起草优惠券 ${code}：-${percent}% ×${maxRedemptions} 单，${days} 天内有效。`
  })

  return (
    <ComingSoon
      eyebrow="Marketing"
      title="Discounts"
      description="Coupon codes, automatic discounts and bundle offers."
      expected="V1.2"
      bullets={[
        'Percent / fixed / BOGO',
        'Schedule by date & timezone',
        'Limit per customer / per code',
        'Copilot can mint and email codes',
      ]}
    />
  )
}
