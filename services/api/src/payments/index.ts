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
export { WechatPayProvider, isWechatMockMode } from './wechat.js'
export { AlipayProvider, isAlipayMockMode } from './alipay.js'
export {
  activateCnSubscription,
  generateCnOrderId,
  rememberCheckoutContext,
  recallCheckoutContext,
  checkCnPaymentStatus,
  handleCnPaymentWebhook,
  CN_PLAN_CREDITS,
  CN_PLAN_PRICE_CNY_FEN,
} from './cn-billing.js'
export type {
  ActivateCnSubscriptionInput,
  ActivateCnSubscriptionResult,
  GenerateCnOrderIdInput,
  HandleCnWebhookInput,
  HandleCnWebhookResult,
} from './cn-billing.js'

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
