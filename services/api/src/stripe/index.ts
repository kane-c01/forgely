/**
 * Public surface of `@forgely/api/stripe`.
 *
 * @owner W3 (T24)
 */

export {
  STRIPE_API_VERSION,
  getStripe,
  getWebhookSecret,
  isStripeConfigured,
  setStripeClient,
} from './client.js';

export {
  getOrCreateStripeCustomer,
  resolveUserByStripeCustomer,
} from './customers.js';

export {
  createBillingPortalSession,
  createCreditPackCheckout,
  createSubscriptionCheckout,
} from './checkout.js';
export type {
  CreateCreditPackCheckoutInput,
  CreatePortalSessionInput,
  CreateSubscriptionCheckoutInput,
} from './checkout.js';

export { handleStripeWebhook, verifyWebhookSignature } from './webhook.js';
export type { WebhookOutcome } from './webhook.js';
