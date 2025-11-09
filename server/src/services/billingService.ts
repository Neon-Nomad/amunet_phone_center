import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';

import { env } from '../config/env';

export type BillingTier = 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';

export class BillingService {
  private readonly stripe: Stripe | null;

  constructor(private readonly prisma: PrismaClient) {
    this.stripe = env.STRIPE_SECRET_KEY ? new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: '2023-08-16' }) : null;
  }

  async createCheckoutSession({
    tier,
    tenantId,
    successUrl,
    cancelUrl
  }: {
    tier: BillingTier;
    tenantId: string;
    successUrl: string;
    cancelUrl: string;
  }) {
    if (!this.stripe) {
      return {
        url: `${successUrl}?tenantId=${tenantId}&tier=${tier}&mode=demo`
      };
    }

    const priceId = this.priceIdForTier(tier);
    if (!priceId) {
      throw new Error(`Stripe price not configured for tier ${tier}`);
    }

    const subscription = await this.prisma.subscription.findFirst({ where: { tenantId } });
    if (!subscription) {
      throw new Error('Subscription not found');
    }

    let customerId = subscription.stripeCustomer;
    if (!customerId) {
      const customer = await this.stripe.customers.create({
        metadata: { tenantId }
      });
      customerId = customer.id;
      await this.prisma.subscription.update({
        where: { id: subscription.id },
        data: { stripeCustomer: customerId }
      });
    }

    const session = await this.stripe.checkout.sessions.create({
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
    if (!this.stripe) {
      return { url: `${returnUrl}?portal=disabled` };
    }

    const session = await this.stripe.billingPortal.sessions.create({
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
}
