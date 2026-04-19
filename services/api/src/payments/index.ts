/**
 * Payments — provider registry + factory.
 *
 * 海外站继续走 W3 已实现的 Stripe 链路（services/api/src/stripe/*）；
 * 国内场景由本目录提供微信支付 / 支付宝 / 银联实现。
 *
 * @owner W1 — CN pivot (docs/PIVOT-CN.md §3)
 */
import { AlipayProvider } from './alipay.js'
import { WechatPayProvider } from './wechat.js'
import type { PaymentChannel, PaymentProvider } from './types.js'

export * from './types.js'
export { WechatPayProvider } from './wechat.js'
export { AlipayProvider } from './alipay.js'

export function getPaymentProvider(channel: PaymentChannel): PaymentProvider {
  switch (channel) {
    case 'wechat':
      return new WechatPayProvider()
    case 'alipay':
      return new AlipayProvider()
    default:
      throw new Error(`Unsupported payment channel for CN provider registry: ${channel}`)
  }
}
