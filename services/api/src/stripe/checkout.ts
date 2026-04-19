/**
 * Stripe Checkout Session helpers.
 *
 * Two flavours:
 *   - `createCreditPackCheckout`   — one-shot Stripe Checkout for a credits pack
 *   - `createSubscriptionCheckout` — recurring subscription (3 plans × 2 cadences)
 *
 * Both use Stripe `client_reference_id = userId` and a `forgelyKind` metadata
 * key so the webhook can dispatch without a second DB lookup.
 *
 * @owner W3 (T24)
 */

import type Stripe from 'stripe';

import { prisma } from '../db.js';
import type { SubscriptionCadence } from '../db.js';
import { ForgelyError, errors } from '../errors.js';

import { getStripe } from './client.js';
import { getOrCreateStripeCustomer } from './customers.js';

export interface CreateCreditPackCheckoutInput {
  userId: string;
  packageSlug: string;
  successUrl: string;
  cancelUrl: string;
}

/** Idempotent Checkout Session creation for a credits pack. */
export const createCreditPackCheckout = async (
  input: CreateCreditPackCheckoutInput,
): Promise<{ sessionId: string; url: string }> => {
  const pkg = await prisma.creditsPackage.findUnique({
    where: { slug: input.packageSlug },
  });
  if (!pkg || !pkg.active) {
    throw new ForgelyError(
      'PACKAGE_NOT_FOUND',
      `Unknown credits package: ${input.packageSlug}`,
      404,
    );
  }

  const customer = await getOrCreateStripeCustomer(input.userId);
  const stripe = getStripe();

  const session = await stripe.checkout.sessions.create(
    {
      mode: 'payment',
      customer,
      client_reference_id: input.userId,
      line_items: [{ price: pkg.stripePriceId, quantity: 1 }],
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
      payment_intent_data: {
        metadata: {
          forgelyKind: 'credit_pack',
          forgelyUserId: input.userId,
          forgelyPackageSlug: pkg.slug,
        },
      },
      metadata: {
        forgelyKind: 'credit_pack',
        forgelyUserId: input.userId,
        forgelyPackageSlug: pkg.slug,
      },
    },
    {
      idempotencyKey: `credit_pack:${input.userId}:${pkg.slug}:${Date.now()}`,
    },
  );

  if (!session.url) {
    throw errors.notFound('Stripe Checkout URL');
  }

  return { sessionId: session.id, url: session.url };
};

export interface CreateSubscriptionCheckoutInput {
  userId: string;
  planSlug: 'starter' | 'pro' | 'agency';
  cadence: SubscriptionCadence;
  successUrl: string;
  cancelUrl: string;
  /** Optional discount coupon (Stripe `coupon` id). */
  couponId?: string;
}

const cadenceField = (cadence: SubscriptionCadence): 'stripePriceMonthlyId' | 'stripePriceYearlyId' =>
  cadence === 'yearly' ? 'stripePriceYearlyId' : 'stripePriceMonthlyId';

/** Subscription Checkout (auto-charges from the saved Stripe Customer card). */
export const createSubscriptionCheckout = async (
  input: CreateSubscriptionCheckoutInput,
): Promise<{ sessionId: string; url: string }> => {
  const plan = await prisma.plan.findUnique({ where: { slug: input.planSlug } });
  if (!plan || !plan.active) {
    throw new ForgelyError(
      'PLAN_NOT_FOUND',
      `Unknown plan: ${input.planSlug}`,
      404,
    );
  }

  const priceId = plan[cadenceField(input.cadence)];
  if (!priceId) {
    throw new ForgelyError(
      'PLAN_NOT_FOUND',
      `Plan ${plan.slug} has no Stripe price for ${input.cadence}.`,
      400,
    );
  }

  const customer = await getOrCreateStripeCustomer(input.userId);
  const stripe = getStripe();

  const params: Stripe.Checkout.SessionCreateParams = {
    mode: 'subscription',
    customer,
    client_reference_id: input.userId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
    subscription_data: {
      metadata: {
        forgelyKind: 'subscription',
        forgelyUserId: input.userId,
        forgelyPlanSlug: plan.slug,
        forgelyCadence: input.cadence,
      },
    },
    metadata: {
      forgelyKind: 'subscription',
      forgelyUserId: input.userId,
      forgelyPlanSlug: plan.slug,
      forgelyCadence: input.cadence,
    },
  };

  if (input.couponId) {
    params.discounts = [{ coupon: input.couponId }];
  }

  const session = await stripe.checkout.sessions.create(params, {
    idempotencyKey: `sub:${input.userId}:${plan.slug}:${input.cadence}:${Date.now()}`,
  });

  if (!session.url) {
    throw errors.notFound('Stripe Checkout URL');
  }
  return { sessionId: session.id, url: session.url };
};

export interface CreatePortalSessionInput {
  userId: string;
  returnUrl?: string;
}

/** Stripe Customer Portal — self-serve cancel/upgrade/edit-card. */
export const createBillingPortalSession = async (
  input: CreatePortalSessionInput,
): Promise<{ url: string }> => {
  const customer = await getOrCreateStripeCustomer(input.userId);
  const stripe = getStripe();
  const session = await stripe.billingPortal.sessions.create({
    customer,
    return_url:
      input.returnUrl ??
      process.env.STRIPE_PORTAL_RETURN_URL ??
      'http://localhost:3001/billing',
  });
  return { url: session.url };
};
