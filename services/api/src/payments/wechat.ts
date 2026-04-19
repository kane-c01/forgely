/**
 * 微信支付 V3 Provider — Native(扫码) / JSAPI(公众号) / H5 / 小程序 / App。
 *
 * 实现框架（生产部署需补）：
 *   - V3 接口：https://api.mch.weixin.qq.com/v3/pay/transactions/{native|jsapi|h5|app}
 *   - APIv3 加签：商户 RSA-SHA256，请求带 Authorization: WECHATPAY2-SHA256-RSA2048
 *   - Webhook 验签：响应头 Wechatpay-Serial / Signature / Timestamp / Nonce
 *   - 退款：/v3/refund/domestic/refunds
 *
 * 本文件提供契约 + 主流程，省略二级签名计算（生产对接时引入
 * `wechatpay-axios-plugin` 或 `wechatpay-node-v3` 包）。
 *
 * @owner W1 — CN pivot (docs/PIVOT-CN.md §3)
 */
import { ForgelyError } from '../errors.js'
import type {
  CheckoutResult,
  CreateCheckoutInput,
  PaymentProvider,
  RefundResult,
  WebhookEvent,
} from './types.js'

interface Env {
  appId: string
  mchId: string
  mchPrivateKey: string
  apiV3Key: string
  serialNo: string
  notifyUrlDefault: string
}

function readEnv(): Env {
  const env = {
    appId: process.env.WECHAT_PAY_APP_ID ?? '',
    mchId: process.env.WECHAT_PAY_MCH_ID ?? '',
    mchPrivateKey: process.env.WECHAT_PAY_PRIVATE_KEY ?? '',
    apiV3Key: process.env.WECHAT_PAY_APIV3_KEY ?? '',
    serialNo: process.env.WECHAT_PAY_SERIAL_NO ?? '',
    notifyUrlDefault:
      process.env.WECHAT_PAY_NOTIFY_URL ?? 'https://app.forgely.cn/api/webhooks/wechat-pay',
  }
  for (const [k, v] of Object.entries(env)) {
    if (!v && k !== 'notifyUrlDefault') {
      throw new ForgelyError(
        'WECHAT_PAY_NOT_CONFIGURED',
        `微信支付未配置：缺少 ${k}。`,
        500,
      )
    }
  }
  return env
}

export class WechatPayProvider implements PaymentProvider {
  readonly channel = 'wechat' as const

  async createCheckout(input: CreateCheckoutInput): Promise<CheckoutResult> {
    const env = readEnv()
    const endpoint = ((): string => {
      switch (input.scene) {
        case 'native':
          return 'https://api.mch.weixin.qq.com/v3/pay/transactions/native'
        case 'jsapi':
        case 'mini':
          return 'https://api.mch.weixin.qq.com/v3/pay/transactions/jsapi'
        case 'h5':
        case 'wap':
          return 'https://api.mch.weixin.qq.com/v3/pay/transactions/h5'
        case 'app':
          return 'https://api.mch.weixin.qq.com/v3/pay/transactions/app'
        default:
          throw new ForgelyError('WECHAT_PAY_SCENE_UNSUPPORTED', `不支持的支付场景：${input.scene}`, 400)
      }
    })()

    if ((input.scene === 'jsapi' || input.scene === 'mini') && !input.wechatOpenid) {
      throw new ForgelyError(
        'WECHAT_PAY_OPENID_REQUIRED',
        '微信 JSAPI / 小程序支付需要 openid。',
        400,
      )
    }

    const body = {
      appid: env.appId,
      mchid: env.mchId,
      description: input.description.slice(0, 127),
      out_trade_no: input.orderId,
      notify_url: input.notifyUrl ?? env.notifyUrlDefault,
      amount: { total: input.amountCents, currency: input.currency },
      ...(input.wechatOpenid ? { payer: { openid: input.wechatOpenid } } : {}),
      attach: input.metadata ? JSON.stringify(input.metadata).slice(0, 127) : undefined,
    }

    const signature = '__SIGNED__' // TODO: 实际 RSA-SHA256 签名
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json',
        authorization: signature,
      },
      body: JSON.stringify(body),
    })
    if (!response.ok) {
      throw new ForgelyError(
        'WECHAT_PAY_CREATE_FAILED',
        `微信支付下单失败：HTTP ${response.status}`,
        response.status,
      )
    }
    const json = (await response.json()) as Record<string, string>

    return {
      channel: 'wechat',
      redirectUrl: json.h5_url,
      qrCode: json.code_url,
      jsapiParams:
        input.scene === 'jsapi' || input.scene === 'mini'
          ? buildJsapiParams(env.appId, json.prepay_id ?? '')
          : undefined,
      externalId: json.prepay_id ?? input.orderId,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    }
  }

  async verifyWebhook(headers: Headers, body: string): Promise<WebhookEvent> {
    // TODO: 验签 + 解密（apiV3Key + AES-GCM）
    void headers
    const event = JSON.parse(body) as {
      resource: { ciphertext: string; associated_data: string; nonce: string }
      event_type: string
    }
    void event
    throw new ForgelyError('WECHAT_PAY_WEBHOOK_TODO', '微信支付 webhook 验签待生产对接', 500)
  }

  async refund(input: { externalId: string; amountCents: number; reason?: string }): Promise<RefundResult> {
    void input
    throw new ForgelyError('INTERNAL_ERROR', '微信支付退款待生产对接 (input ignored).', 500, { input })
  }
}

function buildJsapiParams(appId: string, prepayId: string): Record<string, string> {
  const timeStamp = String(Math.floor(Date.now() / 1000))
  const nonceStr = Math.random().toString(36).slice(2, 10)
  return {
    appId,
    timeStamp,
    nonceStr,
    package: `prepay_id=${prepayId}`,
    signType: 'RSA',
    paySign: '__SIGNED__', // TODO
  }
}
