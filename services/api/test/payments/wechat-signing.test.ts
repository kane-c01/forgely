/**
 * Tests for WeChat Pay v3 signing helpers using a freshly generated RSA
 * keypair (no real merchant credentials required).
 */
import { generateKeyPairSync, createSign, createCipheriv, randomBytes } from 'node:crypto'
import { describe, expect, it } from 'vitest'

import {
  buildWechatAuthHeader,
  decryptWechatResource,
  verifyWechatWebhookSignature,
} from '../../src/payments/wechat.js'
import type { ForgelyError } from '../../src/errors.js'

const newKeypair = () => {
  const { publicKey, privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 })
  return {
    publicPem: publicKey.export({ type: 'spki', format: 'pem' }).toString(),
    privatePem: privateKey.export({ type: 'pkcs8', format: 'pem' }).toString(),
  }
}

describe('payments/wechat — signing', () => {
  it('buildWechatAuthHeader produces a parseable token with all five claims', () => {
    const { privatePem } = newKeypair()
    const header = buildWechatAuthHeader({
      method: 'POST',
      url: '/v3/pay/transactions/native',
      body: '{"foo":1}',
      mchId: '1700000000',
      serialNo: 'ABCDEF1234',
      privateKeyPem: privatePem,
      timestamp: 1_700_000_000,
      nonceStr: 'forgely-test-nonce',
    })
    expect(header.startsWith('WECHATPAY2-SHA256-RSA2048 ')).toBe(true)
    for (const claim of ['mchid', 'nonce_str', 'signature', 'timestamp', 'serial_no']) {
      expect(header).toContain(`${claim}="`)
    }
    expect(header).toContain('mchid="1700000000"')
    expect(header).toContain('timestamp="1700000000"')
    expect(header).toContain('nonce_str="forgely-test-nonce"')
  })
})

describe('payments/wechat — verifyWechatWebhookSignature', () => {
  it('accepts a signature minted by the matching private key', () => {
    const { publicPem, privatePem } = newKeypair()
    const timestamp = '1700000000'
    const nonce = 'nonce-1'
    const body = '{"event":"transaction.success"}'
    const message = `${timestamp}\n${nonce}\n${body}\n`
    const signer = createSign('RSA-SHA256')
    signer.update(message, 'utf8')
    signer.end()
    const signature = signer.sign(privatePem).toString('base64')

    expect(() =>
      verifyWechatWebhookSignature({
        serial: 'cert-1',
        signature,
        timestamp,
        nonce,
        body,
        platformCerts: { 'cert-1': publicPem },
      }),
    ).not.toThrow()
  })

  it('rejects an unknown serial', () => {
    try {
      verifyWechatWebhookSignature({
        serial: 'unknown',
        signature: 'abc',
        timestamp: '1',
        nonce: 'n',
        body: 'b',
        platformCerts: {},
      })
      throw new Error('should not reach')
    } catch (err) {
      expect((err as ForgelyError).code).toBe('WECHAT_PAY_WEBHOOK_INVALID')
    }
  })

  it('rejects a tampered body', () => {
    const { publicPem, privatePem } = newKeypair()
    const timestamp = '1700000000'
    const nonce = 'nonce-1'
    const body = '{"a":1}'
    const goodSig = (() => {
      const signer = createSign('RSA-SHA256')
      signer.update(`${timestamp}\n${nonce}\n${body}\n`, 'utf8')
      signer.end()
      return signer.sign(privatePem).toString('base64')
    })()

    try {
      verifyWechatWebhookSignature({
        serial: 'cert-1',
        signature: goodSig,
        timestamp,
        nonce,
        body: '{"a":2}', // tampered
        platformCerts: { 'cert-1': publicPem },
      })
      throw new Error('should not reach')
    } catch (err) {
      expect((err as ForgelyError).code).toBe('WECHAT_PAY_WEBHOOK_INVALID')
    }
  })
})

describe('payments/wechat — decryptWechatResource', () => {
  it('round-trips an AES-256-GCM ciphertext + nonce + AAD', () => {
    const apiV3Key = '0'.repeat(32)
    const nonce = 'nonce-12-bytes' // 12-byte IV
    const associatedData = 'transaction'
    const plaintext = '{"out_trade_no":"order_1","trade_state":"SUCCESS"}'

    const cipher = createCipheriv('aes-256-gcm', Buffer.from(apiV3Key), Buffer.from(nonce))
    cipher.setAAD(Buffer.from(associatedData))
    const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
    const tag = cipher.getAuthTag()
    const ciphertextB64 = Buffer.concat([enc, tag]).toString('base64')

    const decoded = decryptWechatResource({
      ciphertextB64,
      associatedData,
      nonce,
      apiV3Key,
    })
    expect(decoded).toBe(plaintext)
  })

  it('throws WECHAT_PAY_WEBHOOK_INVALID on truncated ciphertext', () => {
    try {
      decryptWechatResource({
        ciphertextB64: Buffer.from('short').toString('base64'),
        associatedData: 'aad',
        nonce: 'n'.repeat(12),
        apiV3Key: '0'.repeat(32),
      })
      throw new Error('should not reach')
    } catch (err) {
      expect((err as ForgelyError).code).toBe('WECHAT_PAY_WEBHOOK_INVALID')
    }
  })
})

void randomBytes
