import { model } from '@medusajs/framework/utils'

export const ForgelyTenant = model.define('forgely_tenant', {
  id: model.id().primaryKey(),
  forgely_user_id: model.text().unique(),
  sales_channel_id: model.text().unique(),
  plan: model.enum(['free', 'starter', 'pro', 'agency', 'enterprise']).default('free'),
  credits_balance: model.number().default(500),
  credits_monthly: model.number().default(0),
  stripe_customer_id: model.text().nullable(),
  stripe_subscription_id: model.text().nullable(),
  subscription_status: model
    .enum(['active', 'past_due', 'canceled', 'trialing', 'none'])
    .default('none'),
  custom_domain: model.text().nullable(),
  metadata: model.json().nullable(),
})
