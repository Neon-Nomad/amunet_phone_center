import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';

import { env } from '../config/env';
import { getStripeClient } from '../lib/stripe';

export type BillingTier = 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';

export class BillingService {
  constructor(private readonly prisma: PrismaClient) {}

  async createCheckoutSession({
    tier,
    tenantId,
    successUrl,
    cancelUrl,
    customerEmail
  }: {
    tier: BillingTier;
    tenantId: string;
    successUrl: string;
    cancelUrl: string;
    customerEmail: string;
  }) {
    const stripe = getStripeClient();
    if (!stripe) {
      return {
        url: `${successUrl}?tenantId=${tenantId}&tier=${tier}&mode=demo`
      };
    }

    const priceId = this.priceIdForTier(tier);
    if (!priceId) {
      throw new Error(`Stripe price not configured for tier ${tier}`);
    }

    const { customerId } = await this.findOrCreateCustomer(tenantId, customerEmail, stripe);

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      metadata: { tenantId },
      success_url: successUrl,
      cancel_url: cancelUrl,
      line_items: [
        {
          price: priceId,
          quantity: 1
        }
      ]
    });

    return { url: session.url };
  }

  async createCustomerPortalSession(customerId: string, returnUrl: string) {
    const stripe = getStripeClient();
    if (!stripe) {
      return { url: `${returnUrl}?portal=disabled` };
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl
    });

    return { url: session.url };
  }

  private priceIdForTier(tier: BillingTier) {
    switch (tier) {
      case 'STARTER':
        return env.STRIPE_STARTER_PRICE_ID;
      case 'PROFESSIONAL':
        return env.STRIPE_PROFESSIONAL_PRICE_ID;
      case 'ENTERPRISE':
        return env.STRIPE_ENTERPRISE_PRICE_ID;
      default:
        return undefined;
    }
  }

  private async findOrCreateCustomer(tenantId: string, email: string, stripe: Stripe) {
    if (!email?.includes('@')) {
      throw new Error('Valid email required for Stripe customer');
    }

    const subscription = await this.prisma.subscription.findFirst({ where: { tenantId } });
    if (!subscription) {
      throw new Error('Subscription not found');
    }

    let customerId = subscription.stripeCustomer;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email,
        metadata: { tenantId }
      });
      customerId = customer.id;
      await this.prisma.subscription.update({
        where: { id: subscription.id },
        data: { stripeCustomer: customerId }
      });
    }

    return { subscription, customerId };
  }
}
