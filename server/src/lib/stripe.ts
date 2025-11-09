import Stripe from 'stripe';

import { env } from '../config/env';

let stripeClient: Stripe | null = env.STRIPE_SECRET_KEY
  ? new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: '2023-08-16' })
  : null;

export function getStripeClient(): Stripe | null {
  return stripeClient;
}

export function requireStripeClient(): Stripe {
  if (!stripeClient) {
    throw new Error('Stripe client not configured');
  }
  return stripeClient;
}

export function setStripeClientForTesting(client: Stripe | null) {
  stripeClient = client;
}
