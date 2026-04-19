/**
 * Stripe Customer creation / retrieval. Caches the cus_xxx id back onto
 * `User.stripeCustomerId` so we never make duplicate Customer rows.
 *
 * @owner W3 (T24)
 */

import type { User } from '@prisma/client';

import { prisma } from '../db.js';
import { errors } from '../errors.js';

import { getStripe } from './client.js';

/** Returns the user's Stripe Customer id, creating it on first use. */
export const getOrCreateStripeCustomer = async (
  userId: string,
): Promise<string> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, stripeCustomerId: true },
  });
  if (!user) throw errors.notFound('User');
  if (user.stripeCustomerId) return user.stripeCustomerId;

  const stripe = getStripe();
  const customer = await stripe.customers.create({
    email: user.email,
    name: user.name ?? undefined,
    metadata: { forgelyUserId: user.id },
  });

  await prisma.user.update({
    where: { id: user.id },
    data: { stripeCustomerId: customer.id },
  });

  return customer.id;
};

/**
 * Resolve a Stripe customer id back to our User. Used during webhook
 * dispatch when Stripe sends `customer = cus_xxx`.
 */
export const resolveUserByStripeCustomer = async (
  stripeCustomerId: string,
): Promise<User | null> => {
  return prisma.user.findUnique({ where: { stripeCustomerId } });
};
