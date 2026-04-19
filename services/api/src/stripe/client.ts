/**
 * Stripe SDK singleton.
 *
 * Lazy-init so unit tests that don't touch billing don't blow up when the
 * env var is missing. `setStripeClient` is the seam for tests that want to
 * inject a fake.
 *
 * @owner W3 (T24)
 */

import Stripe from 'stripe';

import { ForgelyError } from '../errors.js';

/** Pinned Stripe API version. Bump deliberately when upgrading. */
export const STRIPE_API_VERSION = '2024-10-28.acacia';

let cachedClient: Stripe | null = null;
let injected: Stripe | null = null;

const buildClient = (): Stripe => {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new ForgelyError(
      'STRIPE_NOT_CONFIGURED',
      'Stripe is not configured for this environment.',
      500,
    );
  }
  return new Stripe(key, {
    apiVersion: STRIPE_API_VERSION as Stripe.LatestApiVersion,
    appInfo: {
      name: 'Forgely',
      url: 'https://forgely.com',
    },
  });
};

/** Get the active Stripe client. Throws STRIPE_NOT_CONFIGURED if not configured. */
export const getStripe = (): Stripe => {
  if (injected) return injected;
  if (!cachedClient) cachedClient = buildClient();
  return cachedClient;
};

/** Test seam — inject a stub. Pass `null` to restore real behaviour. */
export const setStripeClient = (client: Stripe | null): void => {
  injected = client;
  cachedClient = null;
};

/** Best-effort check used by feature-flagged code paths. */
export const isStripeConfigured = (): boolean =>
  !!(injected ?? process.env.STRIPE_SECRET_KEY);

/** Webhook secret accessor — kept here so tests can override via env at runtime. */
export const getWebhookSecret = (): string => {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    throw new ForgelyError(
      'STRIPE_NOT_CONFIGURED',
      'STRIPE_WEBHOOK_SECRET is not set.',
      500,
    );
  }
  return secret;
};
