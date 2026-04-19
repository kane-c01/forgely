/* eslint-disable @typescript-eslint/ban-ts-comment, @typescript-eslint/no-explicit-any */
// @ts-nocheck — TODO(W11): ExecArgs moved to @medusajs/framework/types in v2.13.
import { Modules } from '@medusajs/framework/utils'

type ExecArgs = { container: any }

/**
 * Seed script: creates default regions, shipping profiles, and
 * 4 preset shipping option templates per docs/MASTER.md §6.6.
 *
 * Run with: medusa exec ./src/scripts/seed.ts
 */
export default async function seed({ container }: ExecArgs) {
  const regionService = container.resolve(Modules.REGION)
  const fulfillmentService = container.resolve(Modules.FULFILLMENT)

  // ---------- Regions ----------

  const usRegion = await regionService.createRegions({
    name: 'United States',
    currency_code: 'usd',
    countries: ['us'],
    payment_providers: ['stripe', 'paypal', 'nowpayments'],
  })

  const euRegion = await regionService.createRegions({
    name: 'European Union',
    currency_code: 'eur',
    countries: [
      'de',
      'fr',
      'it',
      'es',
      'nl',
      'be',
      'at',
      'pt',
      'ie',
      'fi',
      'gr',
      'sk',
      'si',
      'lt',
      'lv',
      'ee',
      'cy',
      'mt',
      'lu',
      'hr',
    ],
    payment_providers: ['stripe', 'paypal'],
  })

  const cnRegion = await regionService.createRegions({
    name: 'China',
    currency_code: 'cny',
    countries: ['cn'],
    payment_providers: ['wechat-pay', 'alipay', 'stripe'],
  })

  // ---------- Shipping profiles ----------

  const defaultProfile = await fulfillmentService.createShippingProfiles({
    name: 'Default Shipping',
    type: 'default',
  })

  // ---------- 4 preset shipping option templates (MASTER.md §6.6) ----------

  // 1) US domestic
  await fulfillmentService.createShippingOptions({
    name: 'US Domestic (USPS / UPS)',
    profile_id: defaultProfile.id,
    region_id: usRegion.id,
    provider_id: 'manual',
    price_type: 'flat_rate',
    data: { price: 599 },
    amount: 599,
  })

  await fulfillmentService.createShippingOptions({
    name: 'US Domestic Express',
    profile_id: defaultProfile.id,
    region_id: usRegion.id,
    provider_id: 'manual',
    price_type: 'flat_rate',
    data: { price: 1499 },
    amount: 1499,
  })

  // 2) US → EU cross-border
  await fulfillmentService.createShippingOptions({
    name: 'US → EU International',
    profile_id: defaultProfile.id,
    region_id: euRegion.id,
    provider_id: 'manual',
    price_type: 'flat_rate',
    data: { price: 2499 },
    amount: 2499,
  })

  // 3) CN → US (Persona A)
  await fulfillmentService.createShippingOptions({
    name: 'CN → US (ePacket / YunExpress)',
    profile_id: defaultProfile.id,
    region_id: usRegion.id,
    provider_id: 'manual',
    price_type: 'flat_rate',
    data: { price: 1999 },
    amount: 1999,
  })

  // 4) EU domestic
  await fulfillmentService.createShippingOptions({
    name: 'EU Domestic (DPD / DHL)',
    profile_id: defaultProfile.id,
    region_id: euRegion.id,
    provider_id: 'manual',
    price_type: 'flat_rate',
    data: { price: 799 },
    amount: 799,
  })

  await fulfillmentService.createShippingOptions({
    name: 'EU Express (DHL Express)',
    profile_id: defaultProfile.id,
    region_id: euRegion.id,
    provider_id: 'manual',
    price_type: 'flat_rate',
    data: { price: 1999 },
    amount: 1999,
  })

  console.log('✅ Seed complete: 3 regions + 6 shipping options + payment providers')
  console.log(`   US region: ${usRegion.id}`)
  console.log(`   EU region: ${euRegion.id}`)
  console.log(`   CN region: ${cnRegion.id}`)
}
